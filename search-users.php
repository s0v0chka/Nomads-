<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

// Перевірка авторизації
if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$query = trim($_GET['q'] ?? '');
$roomId = $_GET['room_id'] ?? null;

// Мінімальна перевірка
if (strlen($query) < 2 || !$roomId) {
    echo json_encode([]);
    exit;
}

// Підготовка запиту
$stmt = $pdo->prepare("
    SELECT id, username, avatar FROM users 
    WHERE username LIKE ? 
    AND id NOT IN (
        SELECT user_id FROM room_users WHERE room_id = ?
    )
    LIMIT 5
");

// Передаємо обидва параметри
$stmt->execute(["%$query%", $roomId]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
