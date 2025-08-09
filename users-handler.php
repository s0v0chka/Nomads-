<?php
$requiredRole = 'admin';
require_once 'authcheck.php';

header('Content-Type: application/json');  // Вказуємо, що ми відправляємо JSON
require_once 'db.php';  // Підключаємо базу даних

$response = [
    'success' => false,
    'error' => null,
    'message' => null
];

// Якщо це GET запит, виводимо користувачів
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Отримуємо список користувачів
        $stmt = $pdo->query("SELECT id, username, role, avatar, telega FROM users ORDER BY id DESC");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);  // Отримуємо список користувачів

        echo json_encode([
            'users' => $users,
            'success' => true
        ]);
        exit;  // Завершуємо скрипт
    } catch (PDOException $e) {
        echo json_encode([
            'error' => "Помилка отримання користувачів: " . $e->getMessage(),
            'success' => false
        ]);
        exit;  // Завершуємо скрипт
    }
}
// Логування початку виконання
error_log("POST запит отримано: " . print_r($_POST, true));  // Логування даних з форми
error_log("FILES запит отримано: " . print_r($_FILES, true));  // Логування файлів


// Якщо це POST запит, обробляємо запити для створення, редагування, видалення користувачів
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Створення нового користувача
    if (isset($_POST['create_user'])) {
    // Отримуємо всі необхідні дані
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $role = trim($_POST['role'] ?? '');

    error_log("Отримано дані для користувача: Username: $username, Role: $role");

    // Перевірка на порожні значення
    if (empty($username) || empty($password) || strlen($username) < 3 || strlen($password) < 6) {
        $response['error'] = "Логін та пароль мають бути коректними.";
        error_log("Помилка валідації: " . $response['error']);
        $username = '';
        $password = '';
    } else {
        try {
            // Перевірка на унікальність імені користувача
            $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
            $checkStmt->execute([$username]);

            if ($checkStmt->rowCount() > 0) {
                $response['error'] = "Користувач з таким іменем вже існує.";
                error_log("Помилка: Користувач з таким іменем вже існує.");
            } else {
                // Хешуємо пароль
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);

                // SQL запит на вставку нового користувача
                $stmt = $pdo->prepare("INSERT INTO users (username, password, role, avatar) VALUES (?, ?, ?, ?)");
                $stmt->execute([$username, $passwordHash, $role, 'user.png']);

                // Успішне додавання
                $response['success'] = true;
                $response['message'] = "Користувача успішно додано.";
                error_log("Користувача успішно додано: Username: $username");
            }
        } catch (PDOException $e) {
            // Логування помилок
            $response['error'] = "Помилка при створенні користувача: " . $e->getMessage();
            error_log("PDOException: " . $e->getMessage());
        }

        
    }
}




    

    // Редагування користувача
if (isset($_POST['edit_user'])) {
    $id = (int)($_POST['id'] ?? 0);
    $username = trim($_POST['username'] ?? '');
    $role = trim($_POST['role'] ?? '');
    $password = $_POST['password'] ?? null;
    $telega = $_POST['telega'] ?? '';
    try {
        // Отримуємо поточні дані користувача
        $stmt = $pdo->prepare("SELECT username, role, telega FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);


        if (!$currentUser) {
            $response['error'] = "Користувача не знайдено.";
        } else {
            // Готуємо SQL-запит для часткового оновлення
            $sqlParts = [];
            $params = [];
            
            // Якщо передано нове ім'я користувача і воно відрізняється від поточного
            if (!empty($username) && $username !== $currentUser['username']) {
                $sqlParts[] = "username = ?";
                $params[] = $username;
            }
            
            // Якщо передано нову роль і вона відрізняється від поточної
            if (!empty($role) && $role !== $currentUser['role']) {
                $sqlParts[] = "role = ?";
                $params[] = $role;
            }
            
            // Якщо передано новий пароль
            if (!empty($password)) {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $sqlParts[] = "password = ?";
                $params[] = $passwordHash;
            }

            // Якщо передано нове telega і воно відрізняється від поточного
            if (!empty($telega) && $telega !== $currentUser['telega']) {
                $sqlParts[] = "telega = ?";
                $params[] = $telega;
            }
            
            // Якщо є щось для оновлення
            if (!empty($sqlParts)) {
                $sql = "UPDATE users SET " . implode(', ', $sqlParts) . " WHERE id = ?";
                $params[] = $id;
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                $response['success'] = true;
                $response['message'] = "Користувача успішно оновлено.";
            } else {
                $response['error'] = "Змініть хоча б одне поле!";
            }
        }
    } catch (PDOException $e) {
        $response['error'] = "Помилка при оновленні користувача: " . $e->getMessage();
    }

    echo json_encode($response);
    exit;
}

    // Видалення користувача
    if (isset($_POST['delete_user'])) {
        $id = (int)($_POST['id'] ?? 0);

        try {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);

            $response['success'] = true;
            $response['message'] = "Користувача успішно видалено.";
        } catch (PDOException $e) {
            $response['error'] = "Помилка при видаленні користувача: " . $e->getMessage();
        }
    }

    echo json_encode($response); // Відправляємо JSON відповідь
    exit;
}
?>