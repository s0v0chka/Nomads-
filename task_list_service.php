<?php
// task_list_service.php
session_start();
require_once __DIR__ . '/db.php';

$AVATAR_BASE = 'assets/avatars/';
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$userId     = (int)$_SESSION['user_id'];
$search     = trim($_GET['search'] ?? '');
$assigneeId = isset($_GET['assignee_id']) ? (int)$_GET['assignee_id'] : null;
$priority   = $_GET['priority'] ?? null; // low|normal|high|urgent|null

// === Задачи только из комнат пользователя ===
$where  = ["t.room_id IN (SELECT ru.room_id FROM room_users ru WHERE ru.user_id = ?)"];
$params = [$userId];

if ($search !== '') {
    $where[] = "(t.title LIKE ? OR t.description LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
}
if ($assigneeId) {
    $where[] = "t.assignee_id = ?";
    $params[] = $assigneeId;
}
if (in_array($priority, ['low','normal','high','urgent'], true)) {
    $where[] = "t.priority = ?";
    $params[] = $priority;
}

/*
 * Нормализуем статус:
 *  - если NULL или пустая строка -> 'new'
 *  - если что-то левое -> тоже 'new' (подстрахуемся)
 */


function buildAvatarUrl(?string $v, string $base): ?string {
    if (!$v) return null;
    $v = trim($v);
    if ($v === '') return null;
    // уже абсолютный URL?
    if (preg_match('~^(https?:)?//~i', $v)) return $v;
    // уже абсолютный путь сайта?
    if ($v[0] === '/') return $v;
    // иначе приклеиваем базовую папку
    return rtrim($base, '/').'/'.ltrim($v, '/');
}

$sql = "
  SELECT
    t.id,
    t.room_id,
    t.title,
    t.description,
    CASE
      WHEN t.status IS NULL OR t.status = '' THEN 'new'
      WHEN t.status IN ('new','in_progress','done','archived') THEN t.status
      ELSE 'new'
    END AS status_norm,
    t.priority,
    t.created_at,
    t.updated_at,
    t.assignee_id,
    t.created_by,
    t.start_date,
    t.due_date,
    u.true_name AS assignee_name,
    u.avatar    AS assignee_avatar_raw
  FROM tasks t
  LEFT JOIN users u ON u.id = t.assignee_id
  WHERE " . implode(' AND ', $where) . "
  ORDER BY
    FIELD(status_norm,'new','in_progress','done','archived'),
    COALESCE(t.due_date,'2999-12-31') ASC,
    FIELD(t.priority,'urgent','high','normal','low') ASC,
    t.id DESC
";


try {
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB error', 'details' => $e->getMessage()]);
    exit;
}

// Группировка по нормализованному статусу
$groups = ['new'=>[], 'in_progress'=>[], 'done'=>[], 'archived'=>[]];
foreach ($rows as $r) {
    $status = $r['status_norm'] ?? 'new';
    $groups[$status][] = [
        'id'          => (int)$r['id'],
        'room_id'     => (int)$r['room_id'],
        'title'       => $r['title'],
        'description' => $r['description'],
        'status'      => $status,
        'priority'    => $r['priority'],
        'created_at'  => $r['created_at'],
        'updated_at'  => $r['updated_at'],
        'assignee_id' => isset($r['assignee_id']) ? (int)$r['assignee_id'] : null,
        'created_by'  => (int)$r['created_by'],
        'start_date'  => $r['start_date'],
        'due_date'    => $r['due_date'],
        'assignee_name'   => $r['assignee_name'] ?? null,
        'assignee_avatar' => buildAvatarUrl($r['assignee_avatar_raw'] ?? null, $AVATAR_BASE),
    ];
}

echo json_encode([
    'scope'    => 'all_rooms',
    'filters'  => [
        'search'      => $search,
        'assignee_id' => $assigneeId,
        'priority'    => $priority
    ],
    'sections' => $groups
], JSON_UNESCAPED_UNICODE);
