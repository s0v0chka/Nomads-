<?php
// tv_cfile.php — скачивание файлов, прикреплённых к комментариям
session_start();
require_once __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) { 
    http_response_code(401); 
    exit('Auth required'); 
}

$cid = isset($_GET['c']) ? (int)$_GET['c'] : 0; // comment_id
$fid = isset($_GET['f']) ? (int)$_GET['f'] : 0; // file_id
if ($cid <= 0 || $fid <= 0) { 
    http_response_code(400); 
    exit('Bad request'); 
}

// Проверка доступа к комменту через задачу/комнату
$st = $pdo->prepare("
  SELECT f.storage_path, f.orig_name
  FROM comment_attachments ca
  JOIN comments c   ON c.id = ca.comment_id
  JOIN tasks t      ON t.id = c.task_id
  JOIN room_users ru ON ru.room_id = t.room_id
  JOIN files f      ON f.id = ca.file_id
  WHERE ca.comment_id = ? AND ca.file_id = ? AND ru.user_id = ?
  LIMIT 1
");
$st->execute([$cid, $fid, (int)$_SESSION['user_id']]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) { 
    http_response_code(404); 
    exit('Not found'); 
}

// Разрешаем только локальные пути (без http://)
$rel = (string)$row['storage_path'];
if ($rel === '' || preg_match('~^https?://~i', $rel)) { 
    http_response_code(404); 
    exit('Bad file'); 
}

// Поиск файла в допустимых корнях
function starts_with(string $hay, string $needle): bool {
    return strncmp($hay, $needle, strlen($needle)) === 0;
}
$roots = array_filter([
    realpath($_SERVER['DOCUMENT_ROOT'] ?? ''),
    realpath(__DIR__),
    realpath(dirname(__DIR__)),
]);

$abs = null;
$relClean = ltrim($rel, '/\\');
foreach ($roots as $root) {
    $candidate = realpath($root . DIRECTORY_SEPARATOR . $relClean);
    if ($candidate && is_file($candidate) && starts_with($candidate, $root)) {
        $abs = $candidate;
        break;
    }
}
if (!$abs) { 
    http_response_code(404); 
    exit('File missing'); 
}

// Ограничение размера файла — 300 МБ
$maxSize = 300 * 1024 * 1024; // 300 MB
if (filesize($abs) > $maxSize) {
    http_response_code(413); // Payload Too Large
    exit('File too large (max 300 MB)');
}

// Очистка имени файла
$filename = preg_replace('/[^A-Za-z0-9._-]+/u', '_', $row['orig_name'] ?: basename($abs));

// Определение MIME-типа
$mime = function_exists('mime_content_type') 
    ? (mime_content_type($abs) ?: 'application/octet-stream') 
    : 'application/octet-stream';

// Отдача файла
header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($abs));
header('Content-Disposition: attachment; filename="' . $filename . '"; filename*=UTF-8\'\'' . rawurlencode($filename));
header('X-Content-Type-Options: nosniff');

if (function_exists('set_time_limit')) set_time_limit(0);
$fp = fopen($abs, 'rb');
if ($fp) {
    fpassthru($fp);
    fclose($fp);
} else {
    http_response_code(500);
    exit('Cannot open file');
}
