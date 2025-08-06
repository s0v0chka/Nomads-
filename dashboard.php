<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}
$username = $_SESSION['username'];
$role     = $_SESSION['role'];            // admin | user
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Dashboard — Task Manager</title>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />

    <!-- Styles (додамо пізніше) -->
    <link rel="stylesheet" href="assets/dashboard-style.css">
</head>
<body>

    <!-- FX-background (canvas + gradients) -->
    <canvas id="stars"></canvas>
    <div class="radial-overlay"></div>

    <!-- ========================================================= -->
    <!-- SIDEBAR -------------------------------------------------- -->
    <!-- ========================================================= -->
    <aside id="sidebar">
        <div class="sidebar__top">
            <div class="logo"><span class="logo-text">Nomads</span><span class="logo-sub"> Task</span></div>

            <button id="sidebarToggle" class="icon-btn"><i class="fas fa-bars"></i></button>
        </div>

        <nav class="menu">
            <a class="menu__item active" href="#"><i class="fas fa-house"></i><span>Главная</span></a>
            <a class="menu__item" href="#"><i class="fas fa-clipboard-list"></i><span>Задачи</span></a>

            <div class="menu__section">
                <button class="menu__collapse" data-target="roomsList">
                    <i class="fas fa-layer-group"></i><span>Комнаты</span>
                    <i class="fas fa-chevron-down chevron"></i>
                </button>
                

                <ul id="roomsList" class="submenu">
                 <li class="addroom"><a class="baseadd">Добавить комнату  <i class="fas fa-plus"></i></a></li>   
<?php
require_once 'db.php';
$userId = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT r.id, r.name, r.color FROM rooms r
    JOIN room_users ru ON ru.room_id = r.id
    WHERE ru.user_id = ?");
$stmt->execute([$userId]);
$rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rooms as $room) {
    $color = htmlspecialchars($room['color'] ?? '#ff3b3b');
    echo '<li class="room-item" data-room-id="' . $room['id'] . '" data-room-name="' . htmlspecialchars($room['name']) . '" data-room-color="' . $color . '">
        <a href="#">
            <span class="room-dot" style="background-color: ' . $color . ';"></span>
            ' . htmlspecialchars($room['name']) . '
        </a>
        <button class="room-options"><i class="fas fa-ellipsis-h"></i></button>
        <div class="room-menu" style="display:none;">
            <div class="menu-option edit-room">Редактировать</div>
            <div class="menu-option delete-room">Удалить</div>
        </div>
    </li>';
}
?>

                </ul>
            </div>

            <?php if ($role === 'admin'): ?>
                <a class="menu__item" href="#"><i class="fas fa-users"></i><span>Пользователи</span></a>
                <a class="menu__item" href="#"><i class="fas fa-cog"></i><span>Settings3</span></a>
            <?php endif; ?>
        </nav>

        <div class="sidebar__profile">
            <div class="avatar"><i class="fas fa-user"></i></div>
            <div class="info">
                <div class="name"><?= htmlspecialchars($username) ?></div>
                <div class="role"><?= $role === 'admin' ? 'Администратор' : 'Пользователь' ?></div>
            </div>
            <a href="logout.php" class="logout icon-btn" title="Выйти"><i class="fas fa-sign-out-alt"></i></a>
        </div>
    </aside>

    <!-- ========================================================= -->
    <!-- MAIN-WRAP (Topbar + Content) ----------------------------- -->
    <!-- ========================================================= -->
    <div id="main">

        <!-- TOPBAR -->
        <header class="topbar">
            <div class="topbar__left">
                <!-- Переключатель видов задач -->
                <div class="view-switch" id="viewSwitch">
                    <button class="view-btn active" data-view="kanban"><i class="fas fa-columns"></i><span>Канбан</span></button>
                    <button class="view-btn" data-view="list"><i class="fas fa-list"></i><span>Список</span></button>
                    <button class="view-btn" data-view="grid"><i class="fas fa-table-cells-large"></i><span>Галерея</span></button>
                </div>
            </div>

            <div class="topbar__right">
                <button class="icon-btn" title="Поиск"><i class="fas fa-search"></i></button>
                <button class="icon-btn" title="Уведомления"><i class="fas fa-bell"></i></button>
            </div>
        </header>

        <!-- CONTENT-AREA -->
        <main class="content">
         
            <!-- IVAN-AREA -->

<div id="addRoomModal" class="modal" style="display: none;">
  <div class="modal-content">
    <button class="modal-close" title="Закрыть">&times;</button>
    <h3 class="modal-title">Создание новой комнаты</h3>

    <div class="modal-group">
      <label for="newRoomName">Название:</label>
      <input type="text" id="newRoomName" placeholder="Введите название комнаты">
    </div>

<div class="modal-group">
  <label>Цвет комнаты:</label>
  <div class="color-picker-wrap">
    <div id="colorDisplay" class="color-display"></div>
    <input type="color" id="roomColor" name="color" value="#ff3b3b">
  </div>
</div>


    <button id="saveRoomBtn" class="modal-submit">Создать</button>
  </div>
</div>



<div id="editRoomModal" class="modal" style="display: none;">
  <div class="modal-content">
    <button class="modal-close" title="Закрыть" onclick="document.getElementById('editRoomModal').style.display='none'">&times;</button>
    <h3 class="modal-title">Редактирование комнаты</h3>

    <div class="modal-group">
      <label for="editRoomName">Название:</label>
      <input type="text" id="editRoomName" placeholder="Введите новое название комнаты">
    </div>

    <div class="modal-group">
      <label>Цвет комнаты:</label>
      <div class="color-picker-wrap">
        <div id="editColorDisplay" class="color-display"></div>
        <input type="color" id="editRoomColor" name="color" value="#ff3b3b">
      </div>
    </div>

    <input type="hidden" id="editRoomId">

    <button id="saveEditBtn" class="modal-submit">Сохранить</button>
  </div>
</div>



<div id="confirmDeleteModal" class="modal" style="display: none;">
  <div class="modal-content">
    <button class="modal-close" title="Закрыть" onclick="closeDeleteModal()">&times;</button>
    <h3 class="modal-title">Удалить комнату?</h3>
    <p style="margin-top: 10px;">Вы уверены, что хотите удалить эту комнату? Это действие необратимо.</p>

    <input type="hidden" id="deleteRoomId">

    <div style="display: flex; gap: 7px; justify-content: space-between; margin-top: 20px;">
      <button class="modal-submit" style="background: var(--bg2); color: var(--white); border: 1px solid var(--border);" onclick="closeDeleteModal()">Отмена</button>
      <button class="modal-submit" style="background: red;" onclick="confirmRoomDeletion()">Удалить</button>
    </div>
  </div>
</div>


















<div>asdsadasdasd</div>











            <!-- IVAN-END-AREA -->
            <!-- DIMA-AREA -->

























        <!-- DIMA-END-AREA -->
            <div class="content__placeholder">
                <p>Выберите комнату или создайте новую, чтобы начать работать с задачами.</p>
            </div>
        </main>
    </div>

    <!-- Scripts (додамо потім) -->
    <script src="assets/dashboard.js"></script>
</body>
</html>
