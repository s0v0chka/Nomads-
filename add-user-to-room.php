<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]);
    exit;
}

$roomId = intval($_POST['room_id'] ?? 0);
$userId = intval($_POST['user_id'] ?? 0);

if (!$roomId || !$userId) {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
    exit;
}

// Проверим, есть ли уже такой юзер в комнате
$stmt = $pdo->prepare("SELECT COUNT(*) FROM room_users WHERE room_id = ? AND user_id = ?");
$stmt->execute([$roomId, $userId]);
if ($stmt->fetchColumn() > 0) {
    echo json_encode(['success' => false, 'message' => 'Пользователь уже добавлен']);
    exit;
}

// Добавим юзера
$stmt = $pdo->prepare("INSERT INTO room_users (room_id, user_id) VALUES (?, ?)");
$stmt->execute([$roomId, $userId]);

echo json_encode(['success' => true]);
