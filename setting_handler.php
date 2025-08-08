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



if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
    try {
        $sql = "SELECT true_name, telega, posada, avatar FROM users WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$userId]);
        $data = $stmt->fetch();

        echo json_encode ([
            'success' => true,
            'data'=> $data
        ]);
    } catch (PDOException $e) {
        echo json_encode ([
            'success' => false,
            'error'=> 'Error' .
            $e->getMessage()
        ]);
    }
exit;



}




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
    $avatar = '';
     $avatar = null;
        if (!empty($_FILES ['avatar_file']['name'])) {
            $uploadDir = 'assets/avatars/';
            $filename = basename($_FILES['avatar_file']['name']);
            
            $ext = pathinfo($filename, PATHINFO_EXTENSION);
            $allowedExt = ['jpeg','png','webp','jpg'];
            if (!in_array (strtolower($ext),$allowedExt)) {
                 $response['error'] = 'error not valid format';
                echo json_encode($response);
                exit;
            }
            $filename = 'user_' . $userId . '_' . time() . '.' . $ext;

            $targetPath = $uploadDir .  $filename;
            if (move_uploaded_file($_FILES['avatar_file']['tmp_name'], $targetPath)) {
                $avatar = $filename;
            } else {
                $response['error'] = 'error not saved';
                echo json_encode($response);
                exit;
            }
        } 
    try {
          $params = [$trueName, $telega, $posada];
        // Готуємо SQL для оновлення (аватар оновлюємо тільки якщо він був завантажений)
        $sql = "UPDATE users SET true_name = ?, telega = ?, posada = ?";
      

        if ($avatar !== null) {
            $sql .= ", avatar =?";
            $params[] = $avatar;
            $response['avatar'] = $avatar;
        }

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