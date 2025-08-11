<?php
// task_actions.php
session_start();
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['success'=>false,'error'=>'Unauthorized']);
  exit;
}

require_once __DIR__.'/db.php';

function jexit($ok, $payload = [], $code = 200){
  http_response_code($code);
  echo json_encode(['success'=>$ok] + $payload, JSON_UNESCAPED_UNICODE);
  exit;
}

$uid    = (int)$_SESSION['user_id'];
$action = $_POST['action'] ?? '';

try {
  if ($action === 'set_status') {
    $id     = (int)($_POST['id'] ?? 0);
    $status = $_POST['status'] ?? '';
    $allowed = ['new','in_progress','done','archived'];
    if ($id <= 0 || !in_array($status, $allowed, true)) {
      jexit(false, ['error'=>'Bad params'], 400);
    }

    // доступ: пользователь должен быть участником комнаты задачи
    $sql = "SELECT t.id
            FROM tasks t
            JOIN room_users ru ON ru.room_id = t.room_id
            WHERE t.id = :tid AND ru.user_id = :uid
            LIMIT 1";
    $st = $pdo->prepare($sql);
    $st->execute([':tid'=>$id, ':uid'=>$uid]);
    if (!$st->fetchColumn()) jexit(false, ['error'=>'Forbidden'], 403);

    $upd = $pdo->prepare("UPDATE tasks SET status = :st, updated_at = NOW() WHERE id = :id");
    $upd->execute([':st'=>$status, ':id'=>$id]);

    jexit(true, ['id'=>$id, 'status'=>$status]);
  }

  if ($action === 'delete') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id <= 0) jexit(false, ['error'=>'Bad params'], 400);

    // доступ
    $sql = "SELECT t.id
            FROM tasks t
            JOIN room_users ru ON ru.room_id = t.room_id
            WHERE t.id = :tid AND ru.user_id = :uid
            LIMIT 1";
    $st = $pdo->prepare($sql);
    $st->execute([':tid'=>$id, ':uid'=>$uid]);
    if (!$st->fetchColumn()) jexit(false, ['error'=>'Forbidden'], 403);

    // (опционально: прочитать tasks.files и удалить физически)
    $del = $pdo->prepare("DELETE FROM tasks WHERE id = :id");
    $del->execute([':id'=>$id]);

    jexit(true, ['id'=>$id]);
  }

  jexit(false, ['error'=>'Unknown action'], 400);

} catch (Throwable $e) {
  jexit(false, ['error'=>'Server error','detail'=>$e->getMessage()], 500);
}
