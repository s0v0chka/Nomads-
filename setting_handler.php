<?php
$requiredRole = 'admin'; // Або 'user', якщо налаштування можуть змінювати всі
require_once 'authcheck.php';

header('Content-Type: application/json');
require_once 'db.php';

$response = [
    'success' => false,
    'error' => null,
    'message' => null
];


if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['save_setings'])) {
    $userId = $_SESSION['user_id'] ?? null;
    
    if (!$userId) {
        $response['error'] = "Користувач не авторизований.";
        echo json_encode($response);
        exit;
    }


    // Отримуємо текстові поля
    $trueName = trim($_POST['true_name'] ?? '');
    $telega = trim($_POST['telega'] ?? '');
    $posada = trim($_POST['posada'] ?? '');
    $avatar = trim($_POST['avatar'] ?? '');
    
    

    try {
        // Готуємо SQL для оновлення (аватар оновлюємо тільки якщо він був завантажений)
        $sql = "UPDATE users SET true_name = ?, telega = ?, posada = ?, avatar = ?";
        $params = [$trueName, $telega, $posada, $avatar];

        $sql .= " WHERE id = ?";
        $params[] = $userId;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $response['success'] = true;
        $response['message'] = "Налаштування збережено!";
    } catch (PDOException $e) {
        $response['error'] = "Помилка бази даних: " . $e->getMessage();
    }
}

echo json_encode($response);
exit;





?>