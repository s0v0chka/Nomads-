<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/authcheck.php'; // підтягує сесію

$userId = $_SESSION['user_id'] ?? 0;
if ($userId <= 0) { http_response_code(401); echo json_encode([]); exit; }

$search = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($search === '') { echo json_encode([]); exit; }

$stmt = $pdo->prepare("
    SELECT id, title
    FROM tasks
    WHERE room_id IN (
        SELECT room_id FROM room_users WHERE user_id = :uid
    )
    AND (LOWER(title) LIKE LOWER(:search) OR LOWER(description) LIKE LOWER(:search))
");
$stmt->execute([
    'uid'    => $userId,
    'search' => "%{$search}%"
]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
