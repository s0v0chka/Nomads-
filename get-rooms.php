<?php

require_once 'authcheck.php';

require 'db.php'; 

$user_id = $_SESSION['user_id'];

$stmt = $pdo->prepare("
    SELECT r.id, r.name
    FROM room_users ru
    JOIN rooms r ON ru.room_id = r.id
    WHERE ru.user_id = ?
");
$stmt->execute([$user_id]);
$rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: application/json');
echo json_encode($rooms);
