<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

require_once __DIR__ . '/db.php';

/** helpers */
function jexit($payload, int $code = 200) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}
function safe_filename($name) {
    return preg_replace('/[^a-zA-Z0-9_\.-]/', '_', basename($name));
}
function ensure_dir($dir) {
    return is_dir($dir) || mkdir($dir, 0777, true);
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

try {
    switch ($action) {

        /** 1) Текущий пользователь (для фронта — имя, аватар, роль) */
        case 'current_user':
            jexit([
                'id'        => $_SESSION['user_id'],
                'username'  => $_SESSION['username'] ?? '',
                'true_name' => $_SESSION['true_name'] ?? '',
                'avatar'    => $_SESSION['avatar'] ?? null,
                'role'      => $_SESSION['role'] ?? ''
            ]);
            break;

        /** 2) Комнаты, где состоит юзер */
        case 'rooms_for_me': {
            $sql = "
                SELECT r.id, r.name, r.color
                FROM room_users ru
                INNER JOIN rooms r ON r.id = ru.room_id
                WHERE ru.user_id = :uid
                ORDER BY r.name
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':uid' => $_SESSION['user_id']]);
            jexit(['rooms' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }

        /** 3) Пользователи в комнате (проверяем доступ юзера к комнате) */
        case 'users_in_room': {
            $roomId = (int)($_GET['room_id'] ?? 0);
            if ($roomId <= 0) jexit(['error' => 'room_id required'], 400);

            $chk = $pdo->prepare("SELECT 1 FROM room_users WHERE room_id = :rid AND user_id = :uid LIMIT 1");
            $chk->execute([':rid' => $roomId, ':uid' => $_SESSION['user_id']]);
            if (!$chk->fetchColumn()) jexit(['error' => 'Forbidden'], 403);

            $sql = "
                SELECT u.id, u.username, u.true_name, u.avatar, u.role
                FROM room_users ru
                INNER JOIN users u ON u.id = ru.user_id
                WHERE ru.room_id = :rid
                ORDER BY u.username
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([':rid' => $roomId]);
            jexit(['users' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }

        /** 4) Начать батч загрузок: выдаём batch_id и создаём временную папку */
        case 'start_upload_batch': {
            $username = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $_SESSION['username'] ?? 'user');
            $batchId  = 'tmp_' . date('Ymd_His') . '_' . $username . '_' . bin2hex(random_bytes(4));
            $dir      = __DIR__ . "/task_uploads/$batchId";
            if (!ensure_dir($dir)) jexit(['error' => 'Cannot create batch dir'], 500);
            jexit(['success' => true, 'batch_id' => $batchId]);
        }

        /** 5) Загрузка файла в батч */
        case 'upload_file': {
            if (!isset($_FILES['file'])) jexit(['error' => 'No file uploaded'], 400);
            $file = $_FILES['file'];
            if ($file['error'] !== UPLOAD_ERR_OK) jexit(['error' => 'Upload error'], 400);

            // простые валидации
            $maxSize = 25 * 1024 * 1024; // 25 MB
            if ($file['size'] > $maxSize) jexit(['error' => 'File too large'], 400);

            $batchId = $_POST['batch_id'] ?? '';
            if (!preg_match('/^tmp_[A-Za-z0-9_\-\.]+$/', $batchId)) {
                // если фронт не прислал — создаём новый
                $username = preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $_SESSION['username'] ?? 'user');
                $batchId  = 'tmp_' . date('Ymd_His') . '_' . $username . '_' . bin2hex(random_bytes(4));
            }

            $uploadDir = __DIR__ . "/task_uploads/$batchId";
            if (!ensure_dir($uploadDir)) jexit(['error' => 'Cannot create upload dir'], 500);

            $filename = safe_filename($file['name']);
            $destPath = $uploadDir . '/' . $filename;

            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                jexit(['error' => 'Cannot save file'], 500);
            }

            // (опционально) определяем mime
            $mime = mime_content_type($destPath) ?: null;

            jexit([
                'success'  => true,
                'batch_id' => $batchId,
                'file'     => [
                    'name' => $filename,
                    'path' => "task_uploads/$batchId/$filename",
                    'size' => (int)filesize($destPath),
                    'mime' => $mime
                ]
            ]);
        }

        /** 6) Создать задачу и прикрепить файлы из батча */
case 'create_task': {
    $title       = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $roomId      = (int)($_POST['room_id'] ?? 0);
    $assigneeId  = (int)($_POST['assignee_id'] ?? 0);
    $priorityIdx = (int)round((float)($_POST['priority'] ?? 1));
$priorityIdx = max(0, min(3, $priorityIdx));
$prioMap     = ['low','normal','high','urgent'];
$priority    = $prioMap[$priorityIdx];
    $startDate   = ($_POST['start_at'] ?? null) ?: null; // из формы приходит start_at
    $dueDate     = ($_POST['due_at']  ?? null) ?: null;  // из формы приходит due_at
    $batchId     = trim($_POST['batch_id'] ?? '');

    if ($title === '' || $roomId <= 0) {
        jexit(['error' => 'title and room_id required'], 400);
    }

    // доступ к комнате
    $chk = $pdo->prepare("SELECT 1 FROM room_users WHERE room_id = :rid AND user_id = :uid LIMIT 1");
    $chk->execute([':rid' => $roomId, ':uid' => $_SESSION['user_id']]);
    if (!$chk->fetchColumn()) jexit(['error' => 'Forbidden'], 403);

    // исполнитель тоже в комнате
    if ($assigneeId > 0) {
        $chk2 = $pdo->prepare("SELECT 1 FROM room_users WHERE room_id = :rid AND user_id = :aid LIMIT 1");
        $chk2->execute([':rid' => $roomId, ':aid' => $assigneeId]);
        if (!$chk2->fetchColumn()) jexit(['error' => 'Assignee is not in room'], 400);
    }

    // 1) сначала вставляем задачу (имена КОЛОНОК как в твоей БД!)
    $filesJson = json_encode([], JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    $ins = $pdo->prepare("
        INSERT INTO tasks
          (room_id, title, description, status, priority, created_at, updated_at,
           assignee_id, created_by, start_date, due_date, files)
        VALUES
          (:room_id, :title, :description, 'open', :priority, NOW(), NOW(),
           :assignee_id, :created_by, :start_date, :due_date, :files)
    ");
    $ins->execute([
        ':room_id'     => $roomId,
        ':title'       => $title,
        ':description' => $description,
        ':priority'    => $priority,
        ':assignee_id' => $assigneeId ?: null,
        ':created_by'  => $_SESSION['user_id'],
        ':start_date'  => $startDate ?: null,
        ':due_date'    => $dueDate ?: null,
        ':files'       => $filesJson,
    ]);
    $taskId = (int)$pdo->lastInsertId();

    // 2) если был batch — переносим файлы в task_{id} и обновляем поле files
    if ($batchId !== '' && preg_match('/^tmp_[A-Za-z0-9_\-\.]+$/', $batchId)) {
        $srcDir = __DIR__ . "/task_uploads/$batchId";
if ($batchId !== '' && preg_match('/^tmp_[A-Za-z0-9_\-\.]+$/', $batchId)) {
    $creatorUsername = safe_filename($_SESSION['username'] ?? 'user');
    $dateStr         = date('dmY');
    $dstDirName      = "task_{$taskId}_{$creatorUsername}_{$dateStr}";
    $dstDir          = __DIR__ . "/task_uploads/$dstDirName";
    ensure_dir($dstDir);

    // префикс без рандомного хвоста: tmp_YYYYMMDD_HHMMSS_username_
    $prefix = preg_replace('/_[0-9a-f]{8}$/i', '_', $batchId);

    $moved = 0;
    $filesArr = [];

    foreach (glob(__DIR__ . "/task_uploads/{$prefix}*") as $srcDir) {
        if (!is_dir($srcDir)) continue;

        foreach (scandir($srcDir) as $f) {
            if ($f === '.' || $f === '..') continue;
            $src = "$srcDir/$f";
            if (!is_file($src)) continue;

            // уникализируем имя, если уже есть
            $dst = "$dstDir/$f";
            if (file_exists($dst)) {
                $pi  = pathinfo($f);
                $base = $pi['filename'];
                $ext  = isset($pi['extension']) ? ('.'.$pi['extension']) : '';
                $dst  = "$dstDir/{$base}_" . uniqid() . $ext;
            }
            @rename($src, $dst) || @copy($src, $dst);

            $rel = "task_uploads/$dstDirName/" . basename($dst);
            $filesArr[] = $rel;
            $moved++;
        }
        // попытаться убрать пустую tmp-диру
        @rmdir($srcDir);
    }

    // сохранить список файлов
    $upd = $pdo->prepare("UPDATE tasks SET files = :files, updated_at = NOW() WHERE id = :id");
    $upd->execute([
        ':files' => json_encode($filesArr, JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE),
        ':id'    => $taskId
    ]);
}
    }

    jexit(['success' => true, 'task_id' => $taskId]);
}


        /** default */
        default:
            jexit(['error' => 'Unknown action'], 400);
    }

} catch (Throwable $e) {
    jexit(['error' => 'Server error', 'detail' => $e->getMessage()], 500);
}
