<?php
// tv_file.php — скачивание файлов из задач
session_start();
require_once __DIR__ . '/db.php';

if (empty($_SESSION['user_id'])) { http_response_code(401); exit('Auth required'); }

$taskId = isset($_GET['task']) ? (int)$_GET['task'] : 0;
$idx    = isset($_GET['i']) ? (int)$_GET['i'] : -1;
if ($taskId <= 0 || $idx < 0) { http_response_code(400); exit('Bad request'); }

// --- доступ к задаче + список файлов
$sql = "
  SELECT t.files
  FROM tasks t
  WHERE t.id = ?
    AND t.room_id IN (SELECT ru.room_id FROM room_users ru WHERE ru.user_id = ?)
  LIMIT 1";
$st = $pdo->prepare($sql);
$st->execute([$taskId, (int)$_SESSION['user_id']]);
$row = $st->fetch(PDO::FETCH_ASSOC);
if (!$row) { http_response_code(404); exit('Not found'); }

$list = json_decode((string)$row['files'], true);
if (!is_array($list) || !isset($list[$idx])) { http_response_code(404); exit('File not found'); }

$entry = $list[$idx];
$rel   = is_string($entry) ? $entry : (string)($entry['url'] ?? '');
if ($rel === '') { http_response_code(404); exit('Bad file'); }

// внешняя ссылка? — отдадим редиректом
if (preg_match('~^https?://~i', $rel)) {
  header('Location: '.$rel);
  exit;
}

// --- нормализация и поиск файла в нескольких корнях
function starts_with(string $hay, string $needle): bool {
  return strncmp($hay, $needle, strlen($needle)) === 0;
}
$roots = array_filter([
  realpath($_SERVER['DOCUMENT_ROOT'] ?? ''),
  realpath(__DIR__),                 // где лежит этот файл
  realpath(dirname(__DIR__)),        // на случай структуры /app/public и т.п.
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

if (!$abs) { http_response_code(404); exit('File missing'); }

$filename = is_array($entry) && !empty($entry['name']) ? (string)$entry['name'] : basename($abs);
$mime = function_exists('mime_content_type') ? (mime_content_type($abs) ?: 'application/octet-stream') : 'application/octet-stream';

header('Content-Type: '.$mime);
header('Content-Length: '.filesize($abs));
header('Content-Disposition: attachment; filename="'.$filename.'"; filename*=UTF-8\'\''.rawurlencode($filename));
header('X-Content-Type-Options: nosniff');
readfile($abs);
