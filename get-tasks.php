<?php
require_once 'db.php';
header('Content-Type: application/json');

$roomId = isset($_GET['room']) ? (int)$_GET['room'] : 0;

if ($roomId <= 0) {
    echo json_encode(['error' => 'Невірний ID кімнати']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM tasks WHERE room_id = ?");
$stmt->execute([$roomId]);
$tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($tasks);
