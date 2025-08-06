<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode([]);
    exit;
}

$roomId = intval($_GET['room_id'] ?? 0);
if (!$roomId) {
    echo json_encode([]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT u.id, u.username
    FROM room_users ru
    JOIN users u ON ru.user_id = u.id
    WHERE ru.room_id = ?
");
$stmt->execute([$roomId]);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
