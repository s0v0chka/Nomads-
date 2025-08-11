<?php
// task_viewer_handler.php
session_start();
require_once __DIR__ . '/db.php';

header('Content-Type: text/html; charset=utf-8');

// --- guard ---
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo '<div class="tv-error">Auth required</div>';
  exit;
}

$taskId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($taskId <= 0) {
  http_response_code(400);
  echo '<div class="tv-error">Bad request</div>';
  exit;
}

$userId = (int)$_SESSION['user_id'];

// --- helpers ---
function e($s){ return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

function buildAvatarUrl(?string $v, string $base = 'assets/avatars/'): ?string {
  if (!$v) return null;
  $v = trim($v);
  if ($v === '') return null;
  if (preg_match('~^(https?:)?//~i', $v)) return $v;
  if ($v[0] === '/') return $v;
  return rtrim($base, '/').'/'.ltrim($v, '/');
}

function fmtDT(?string $dt): string {
  if (!$dt) return '—';
  $ts = strtotime($dt);
  if ($ts === false) return '—';
  static $m = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  return date('d', $ts).' '.$m[(int)date('n', $ts)-1].' '.date('Y, H:i', $ts);
}

function formatBytes(int $bytes): string {
  if ($bytes <= 0) return '';
  $u = ['Б','КБ','МБ','ГБ'];
  $i = (int)floor(log($bytes, 1024));
  $i = max(0, min($i, count($u)-1));
  return round($bytes / (1024 ** $i), 1).' '.$u[$i];
}

// --- fetch (с проверкой доступа по комнатам) ---
$sql = "
  SELECT
    t.*,
    ass.true_name  AS assignee_name,
    ass.avatar     AS assignee_avatar,
    cr.true_name   AS creator_name,
    r.name         AS room_name,
    r.color        AS room_color
  FROM tasks t
    LEFT JOIN users ass ON ass.id = t.assignee_id
    LEFT JOIN users cr  ON cr.id  = t.created_by
    LEFT JOIN rooms r   ON r.id   = t.room_id
  WHERE t.id = ?
    AND t.room_id IN (SELECT ru.room_id FROM room_users ru WHERE ru.user_id = ?)
  LIMIT 1
";

try {
  $st = $pdo->prepare($sql);
  $st->execute([$taskId, $userId]);
  $t = $st->fetch(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
  http_response_code(500);
  echo '<div class="tv-error">DB error</div>';
  exit;
}

if (!$t) {
  http_response_code(404);
  echo '<div class="tv-error">Задача не найдена или нет доступа</div>';
  exit;
}

// --- view model ---
$priority = $t['priority'] ?? 'normal';
$prioMap  = ['low'=>'Низкий','normal'=>'Обычный','high'=>'Высокий','urgent'=>'Срочно'];

$status  = $t['status'] ?? 'new';
$statMap = [
  'new'         => ['НЕ НАЧАТА', 'tv-badge--blue'],
  'in_progress' => ['В РАБОТЕ',  'tv-badge--green'],
  'done'        => ['ВЫПОЛНЕНО', 'tv-badge--yellow'],
  'archived'    => ['АРХИВ',     'tv-badge--gray'],
];
[$statusText, $statusClass] = $statMap[$status] ?? ['СТАТУС', ''];

$roomColor = preg_match('/^#([0-9a-f]{3,8})$/i', (string)($t['room_color'] ?? '')) ? $t['room_color'] : '#999';
$assAva    = buildAvatarUrl($t['assignee_avatar'] ?? null);

// files
// files
// files
$files = [];
if (!empty($t['files'])) {
  $decoded = json_decode($t['files'], true);
  if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {

    // абсолютный путь к скачивальщику от корня сайта
    $tvFileWeb = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/'); // папка, где лежит handler и tv_file.php
    $tvFileWeb = ($tvFileWeb === '') ? '/tv_file.php' : ($tvFileWeb.'/tv_file.php');

    foreach ($decoded as $i => $f) {
      if (is_string($f)) {
        $rel  = $f;
        $name = basename($rel);
        $abs  = realpath(rtrim($_SERVER['DOCUMENT_ROOT'],'/').'/'.ltrim($rel,'/'));
        $size = ($abs && is_file($abs)) ? filesize($abs) : 0;
      } else {
        $rel  = (string)($f['url'] ?? '');
        $name = (string)($f['name'] ?? basename($rel));
        $size = (int)($f['size'] ?? 0);
        if (!$size && $rel && !preg_match('~^https?://~i', $rel)) {
          $abs  = realpath(rtrim($_SERVER['DOCUMENT_ROOT'],'/').'/'.ltrim($rel,'/'));
          $size = ($abs && is_file($abs)) ? filesize($abs) : 0;
        }
      }
      if (!$rel) continue;

      $files[] = [
        'name'      => $name ?: 'file',
        'url'       => $tvFileWeb.'?task='.$taskId.'&i='.$i, // абсолютная ссылка
        'sizeLabel' => $size ? formatBytes((int)$size) : '',
      ];
    }
  }
}



// dates
$dueTs     = $t['due_date'] ? strtotime($t['due_date']) : false;
$isOverdue = $dueTs && $dueTs < time();

// description: если есть теги — считаем HTML (санитизация должна быть при сохранении),
// иначе — обычный текст (экранируем в шаблоне)
$descRaw   = (string)($t['description'] ?? '');
$descHtml  = '';
$descPlain = '';
if ($descRaw !== '' && $descRaw !== strip_tags($descRaw)) {
  $descHtml = $descRaw;                 // уже готовый/санитизированный HTML
} elseif ($descRaw !== '') {
  $descPlain = $descRaw;                // чистый текст
}

$view = [
  'id'              => (int)$t['id'],
  'title'           => $t['title'] ?: ('Задача #'.$t['id']),
  'room_name'       => $t['room_name'] ?: ('Комната #'.$t['room_id']),
  'room_color'      => $roomColor,

  'status'          => $status,
  'status_text'     => $statusText,
  'status_class'    => $statusClass,

  'priority'        => $priority,
  'priority_text'   => $prioMap[$priority] ?? $priority,

  'assignee_id'     => $t['assignee_id'],
  'assignee_name'   => $t['assignee_name'] ?: ($t['assignee_id'] ? ('ID '.$t['assignee_id']) : null),
  'assignee_ava'    => $assAva,

  'creator_name'    => $t['creator_name'] ?: ('ID '.$t['created_by']),

  'start'           => fmtDT($t['start_date']),
  'due'             => fmtDT($t['due_date']),
  'due_overdue'     => (bool)$isOverdue,
  'created'         => fmtDT($t['created_at']),
  'updated'         => fmtDT($t['updated_at']),

  // описание
  'description'     => $descPlain,
  'description_html'=> $descHtml,

  // файлы
  'files'           => $files,
];

// отрисовываем чисто вёрстку
include __DIR__ . '/task_viewer.php';
