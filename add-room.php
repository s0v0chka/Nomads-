<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Неавторизован']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$color = trim($_POST['color'] ?? '#ff3b3b');

if ($name === '') {
    echo json_encode(['success' => false, 'message' => 'Пустое имя комнаты']);
    exit;
}

if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
    echo json_encode(['success' => false, 'message' => 'Некорректный цвет']);
    exit;
}

$stmt = $pdo->prepare("SELECT COUNT(*) FROM rooms r
    JOIN room_users ru ON ru.room_id = r.id
    WHERE r.name = ? AND ru.user_id = ?");
$stmt->execute([$name, $_SESSION['user_id']]);
if ($stmt->fetchColumn() > 0) {
    echo json_encode(['success' => false, 'message' => 'Комната с таким именем уже существует']);
    exit;
}

$stmt = $pdo->prepare("INSERT INTO rooms (name, color) VALUES (?, ?)");
$stmt->execute([$name, $color]);

$roomId = $pdo->lastInsertId();

$pdo->prepare("INSERT INTO room_users (room_id, user_id) VALUES (?, ?)")
    ->execute([$roomId, $_SESSION['user_id']]);

echo json_encode(['success' => true]);
