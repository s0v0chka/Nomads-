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
             <?php
                require_once 'db.php';

                $userId = $_SESSION['user_id'];
                $stmt = $pdo->prepare("SELECT r.id, r.name FROM rooms r
                    JOIN room_users ru ON ru.room_id = r.id
                    WHERE ru.user_id = ?");
                $stmt->execute([$userId]);
                $rooms = $stmt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($rooms as $room) {
                    echo '<li><a href="#" data-room-id="' . $room['id'] . '">' . htmlspecialchars($room['name']) . '</a></li>';
                }
                ?>
                </ul>
            </div>

            <?php if ($role === 'admin'): ?>
                <a class="menu__item" href="#"><i class="fas fa-users"></i><span>Пользователи</span></a>
                <a class="menu__item" href="#"><i class="fas fa-cog"></i><span>Настройки</span></a>
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
