<?php

session_start();
require 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Неавторизован']);
    exit;
}

$roomId = intval($_POST['room_id'] ?? 0);
if (!$roomId) {
    echo json_encode(['success' => false, 'message' => 'Некорректный ID комнаты']);
    exit;
}

// Видаляємо зв'язок користувача (можна й повністю кімнату)
$pdo->prepare("DELETE FROM room_users WHERE room_id = ?")->execute([$roomId]);
$pdo->prepare("DELETE FROM rooms WHERE id = ?")->execute([$roomId]);

echo json_encode(['success' => true]);
