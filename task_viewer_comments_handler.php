<?php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'not_logged_in']);
    exit;
}

$method = $_POST['method'] ?? $_GET['method'] ?? null;

if ($method === 'get') {
    // ===== Получить все комменты задачи =====
    $task_id = (int)($_GET['task_id'] ?? 0);
    if ($task_id <= 0) {
        echo json_encode(['error' => 'bad_task_id']);
        exit;
    }
    $stAcc = $pdo->prepare("
  SELECT 1
  FROM tasks t
  JOIN room_users ru ON ru.room_id = t.room_id
  WHERE t.id = ? AND ru.user_id = ?
  LIMIT 1
");
$stAcc->execute([$task_id, (int)$_SESSION['user_id']]);
if (!$stAcc->fetchColumn()) {
  echo json_encode(['error' => 'forbidden']);
  exit;
}
    $stmt = $pdo->prepare("
SELECT
    c.id,
    c.body,
    c.created_at_utc,
    c.author_id AS user_id,
    COALESCE(NULLIF(TRIM(u.true_name), ''), u.username) AS username,
    u.avatar,
    u.telega AS telega
FROM comments c
JOIN users u ON u.id = c.author_id
WHERE c.task_id = ?
ORDER BY c.created_at_utc ASC, c.id ASC
    ");
    $stmt->execute([$task_id]);
    $comments = $stmt->fetchAll();

    // прикрепления
    foreach ($comments as &$c) {
        $fstmt = $pdo->prepare("
            SELECT f.id, f.orig_name, f.storage_path, f.size
            FROM comment_attachments ca
            JOIN files f ON f.id = ca.file_id
            WHERE ca.comment_id = ?
        ");
        $fstmt->execute([$c['id']]);
        $c['files'] = $fstmt->fetchAll();
    }

    echo json_encode(['success' => true, 'comments' => $comments]);
    exit;
}

if ($method === 'add') {
    // ===== Добавить коммент =====
    $task_id = (int)($_POST['task_id'] ?? 0);
    $body = trim($_POST['body'] ?? '');
    $user_id = (int)$_SESSION['user_id'];

    if ($task_id <= 0 || $body === '') {
        echo json_encode(['error' => 'empty_fields']);
        exit;
    }

    // создаём коммент
    $stmt = $pdo->prepare("
        INSERT INTO comments (task_id, author_id, body)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$task_id, $user_id, $body]);
    $comment_id = $pdo->lastInsertId();

    // загружаем файлы (если есть)
    if (!empty($_FILES['files']['name'][0])) {
        foreach ($_FILES['files']['tmp_name'] as $idx => $tmp) {
            if (!is_uploaded_file($tmp)) continue;

            $orig = $_FILES['files']['name'][$idx];
            $mime = mime_content_type($tmp);
            $size = filesize($tmp);
            $sha  = hash_file('sha256', $tmp);

            $baseDir = __DIR__; // папка, где лежит этот PHP
$storagePath = 'uploads/comments/' . date('Y/m/d/') . uniqid('', true) . '_' . basename($orig);

$fullPath = $baseDir . '/' . $storagePath;

// создаём папку
$dir = dirname($fullPath);
if (!is_dir($dir)) {
    mkdir($dir, 0775, true);
}

// сохраняем файл
if (!move_uploaded_file($tmp, $fullPath)) {
    echo json_encode(['error' => 'move_failed']);
    exit;
}

// пишем в files
$fs = $pdo->prepare("
    INSERT INTO files (storage_path, orig_name, mime, size, sha256, uploader_id)
    VALUES (?, ?, ?, ?, ?, ?)
");
$fs->execute([$storagePath, $orig, $mime, $size, $sha, $user_id]);
$file_id = $pdo->lastInsertId();

// связываем
$pdo->prepare("
    INSERT INTO comment_attachments (comment_id, file_id) VALUES (?, ?)
")->execute([$comment_id, $file_id]);
        }
    }

    echo json_encode(['success' => true, 'id' => $comment_id]);
    exit;
}

echo json_encode(['error' => 'no_method']);
