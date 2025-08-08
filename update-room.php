<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false]);
    exit;
}

$roomId = intval($_POST['room_id'] ?? 0);
$name = trim($_POST['name'] ?? '');
$color = trim($_POST['color'] ?? '');

if ($name === '' || !preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
    echo json_encode(['success' => false, 'message' => 'Неверные данные']);
    exit;
}

$pdo->prepare("UPDATE rooms SET name = ?, color = ? WHERE id = ?")
    ->execute([$name, $color, $roomId]);

echo json_encode(['success' => true]);
