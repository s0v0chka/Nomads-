<?php
require_once 'authcheck.php';

?>

<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <title>Dashboard — Task Manager</title>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        crossorigin="anonymous" referrerpolicy="no-referrer" />
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
    <!-- Styles (додамо пізніше) -->
    <link rel="stylesheet" href="assets/dashboard-style.css">
    <link rel="stylesheet" href="assets/task-creator.css">
    <link rel="stylesheet" href="assets/settings.css">
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
            <a class="menu__item active" href="#homepage" id="home"><i class="fas fa-house"></i><span>Главная</span></a>
            <a class="menu__item" href="#"><i class="fas fa-clipboard-list"></i><span>Задачи</span></a>

            <div class="menu__section">
                <button class="menu__collapse" data-target="roomsList">
                    <i class="fas fa-layer-group"></i><span>Комнаты</span>
                    <i class="fas fa-chevron-down chevron"></i>
                </button>


                <ul id="roomsList" class="submenu">
                    <li class="addroom"><a class="baseadd">Добавить комнату <i class="fas fa-plus"></i></a></li>
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
            <a class="menu__item " id=menusers href="#users_manager"><i
                    class="fas fa-users"></i><span>Пользователи</span></a>
            <a class="menu__item" href="#settings" id="settings"><i class="fas fa-cog"></i><span>Профиль</span></a>
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

                <button id="openTaskCreatorBtn" class="create-task-btn">
                    <i class="fas fa-plus"></i> Добавить задачу
                </button>

                <!-- Переключатель видов задач -->
                <div class="view-switch" id="viewSwitch">
                    <button class="view-btn active" data-view="kanban"><i
                            class="fas fa-columns"></i><span>Канбан</span></button>
                    <button class="view-btn" data-view="list"><i class="fas fa-list"></i><span>Список</span></button>
                    <button class="view-btn" data-view="grid"><i
                            class="fas fa-table-cells-large"></i><span>Галерея</span></button>
                </div>
            </div>

            <div class="topbar__right">
                <button class="icon-btn" title="Поиск"><i class="fas fa-search"></i></button>
                <button class="icon-btn" title="Уведомления"><i class="fas fa-bell"></i></button>
            </div>
        </header>

        <!-- Модальне вікно -->
        <div id="editUserModal" class="moduser_modal">
            <div class="moduser_modal-content">
                <button id="closeModal" class="moduser_close-button">×</button>
                <h3 class="moduser_title">Редактировать пользователя</h3>

                <input type="text" id="editUsername" class="moduser_input" placeholder="Логін" />

                <select id="editRole" class="moduser_select">
                    <option value="">Выберите роль</option>
                    <option value="user">Пользователь</option>
                    <option value="admin">Админ</option>
                </select>

                <input type="password" id="editPassword" class="moduser_input" placeholder="Новый пароль" />

                <input type="text" id="editTelegram" class="moduser_input" placeholder="Новый telegram" />
                
                <input type="text" id="editTrueName" class="moduser_input" placeholder="Новое Имя" />

                <input type="text" id="editPosada" class="moduser_input" placeholder="Новая должность" />

                <div class="moduser_modal-buttons">
                    <button id="saveUserBtn" class="moduser_btn moduser_save">Сохранить</button>
                    <button id="cancelUserBtn" class="moduser_btn moduser_cancel">Отмениь</button>
                </div>
            </div>
        </div>


        <div class="trbls_dv" id="trbls_dv_id">
            <div id="createUserMessage" class="createUserMessageclass"></div>
        </div>





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
                    <button class="modal-close" title="Закрыть"
                        onclick="document.getElementById('editRoomModal').style.display='none'">&times;</button>
                    <h3 class="modal-title">Редактирование комнаты</h3>

                    <div>
                        <div class="modal-group">
                            <label for="editRoomName">Название:</label>
                            <input type="text" id="editRoomName" placeholder="Введите новое название комнаты">



                            <div class="color-picker-wrap">
                                <div id="editColorDisplay" class="color-display"></div>
                                <input type="color" id="editRoomColor" name="color" value="#ff3b3b">
                            </div>


                        </div>


                    </div>
                    <input type="hidden" id="editRoomId">

                    <div class="modal-group">
                        <label>Участники:</label>
                        <div id="roomUsersList" class="user-tags"></div>
                    </div>

                    <div class="modal-group">
                        <label for="addUserInput">Добавить пользователя:</label>
                        <div class="user-input-wrap">
                            <input type="text" id="addUserInput" placeholder="Введите имя пользователя">
                            <ul id="userSuggestions" class="suggestions-list"></ul>
                        </div>
                    </div>




                    <button id="saveEditBtn" class="modal-submit">Сохранить</button>
                </div>
            </div>



            <div id="confirmDeleteModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <button class="modal-close" title="Закрыть" onclick="closeDeleteModal()">&times;</button>
                    <h3 class="modal-title">Удалить комнату?</h3>
                    <p style="margin-top: 10px;">Вы уверены, что хотите удалить эту комнату? Это действие необратимо.
                    </p>

                    <input type="hidden" id="deleteRoomId">

                    <div style="display: flex; gap: 7px; justify-content: space-between; margin-top: 20px;">
                        <button class="modal-submit"
                            style="background: var(--bg2); color: var(--white); border: 1px solid var(--border);"
                            onclick="closeDeleteModal()">Отмена</button>
                        <button class="modal-submit" style="background: red;"
                            onclick="confirmRoomDeletion()">Удалить</button>
                    </div>
                </div>
            </div>





<!-- CONFIRM + FIRE (one-drop snippet) -->






           <div class="tc-overlay" onclick="closeTaskCreator()"></div>


















            <!-- IVAN-END-AREA -->
            <!-- DIMA-AREA -->

<div style="z-index:66; position:relative;" class="users-management" id="users_manager">
  <!-- фоновые акценты -->
  <div class="trbls_dv" id="trbls_dv_id" aria-hidden="true">
    <div class="um-bg-blob um-bg-blob--one"></div>
    <div class="um-bg-blob um-bg-blob--two"></div>
    <div class="um-bg-grid"></div>
  </div>

  <!-- шапка секции -->
  <div class="um-header">
    <div class="um-header__titles">
      <h2 class="um-title">Управление пользователями</h2>
      <p class="um-subtitle">Создавай, редактируй и контролируй доступ — быстро и красиво.</p>
    </div>
    <div class="um-actions">
      <button type="button" class="btn btn-secondary um-ghost" onclick="loadUsers()">
        <span class="um-icn" aria-hidden="true">⟳</span> Обновить
      </button>
    </div>
  </div>

  <!-- зона тостов -->
  <div id="createUserMessage" class="um-toast" role="status" aria-live="polite"></div>

  <!-- сетка: форма + таблица -->
  <div class="um-grid">
    <!-- Форма добавления -->
    <div class="create-user-form um-card">
      <h3>Добавить пользователя</h3>

      <form id="createUserForm" method="POST" autocomplete="off">
        <div class="form-group um-field">
          <label>Логин:</label>
          <div class="um-inputwrap">
            <span class="um-icn" aria-hidden="true">👤</span>
            <input type="text" autocomplete="off" name="username" required>
            <input style="display:none" aria-hidden="true" type="password" name="fakepass" autocomplete="current-password">
          </div>
        </div>

        <div class="form-group um-field">
          <label>Пароль:</label>
          <div class="um-inputwrap">
            <span class="um-icn" aria-hidden="true">🔒</span>
            <input type="password" autocomplete="off" name="password" required>
            <input style="display:none" aria-hidden="true" type="text" name="fakeuser" autocomplete="username">
          </div>
        </div>

        <div class="form-group um-field">
          <label>Роль:</label>
          <div class="um-inputwrap">
            <span class="um-icn" aria-hidden="true">⚙️</span>
            <select name="role" required>
              <option value="user">Пользователь</option>
              <option value="admin">Админ</option>
            </select>
          </div>
        </div>

        <button type="submit" name="create_user" class="btn btn-primary um-primary">
          Создать
        </button>
      </form>
    </div>

    <!-- Таблица пользователей -->
    <div class="users-list um-card">
      <div class="um-list-head">
        <h3>Список пользователей</h3>
      </div>
      <div class="um-table-wrap">
        <table id="users_table" class="um-table">
          <thead>
            <tr>
              <th style="width:72px;">ID</th>
              <th>Логин</th>
              <th>Роль</th>
              <th>Аватар</th>
              <th>Телеграм</th>
              <th>Имя</th>
              <th>Должность</th>
              <th style="min-width:180px;">Действия</th>
            </tr>
          </thead>
          <tbody>
            <!-- строки добавляет JS -->
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<!-- Модалка редактирования (ID/поля сохранены для твоего JS) -->
<div class="moduser_modal" id="editUserModal" aria-hidden="true">
  <div class="moduser_modal-content um-card um-card--modal" role="dialog" aria-modal="true" aria-labelledby="moduser_title">
    <button class="moduser_close-button" id="closeModal" aria-label="Закрыть">×</button>
    <h3 class="moduser_title" id="moduser_title">Редактировать пользователя</h3>

    <label class="um-label" for="editUsername">Логин</label>
    <input class="moduser_input" id="editUsername" type="text" placeholder="Логин">

    <label class="um-label" for="editRole">Роль</label>
    <select class="moduser_select" id="editRole">
      <option value="user">Пользователь</option>
      <option value="admin">Админ</option>
    </select>

    <label class="um-label" for="editPassword">Новый пароль (необязательно)</label>
    <input class="moduser_input" id="editPassword" type="password" placeholder="Оставь пустым, если без изменения">

    <label class="um-label" for="editTelegram">Телеграм</label>
    <input class="moduser_input" id="editTelegram" type="text" placeholder="@nickname">

    <label class="um-label" for="editTrueName">Имя</label>
    <input class="moduser_input" id="editTrueName" type="text" placeholder="Имя пользователя">

    <label class="um-label" for="editPosada">Должность</label>
    <input class="moduser_input" id="editPosada" type="text" placeholder="Должность">

    <div class="moduser_modal-buttons">
      <button class="moduser_btn moduser_cancel" id="cancelUserBtn" type="button">Отмена</button>
      <button class="moduser_btn moduser_save" id="saveUserBtn" type="button">Сохранить</button>
    </div>
  </div>
</div>


<section class="usr_stngs_section" id="stngs_sect">
  <!-- ——— LEFT ——— -->
  

  <!-- ——— RIGHT ——— -->
  <div class="profile-main">
    <h3 class="block-title">Настройки</h3>

    <form class="usr_stngs_form" enctype="multipart/form-data" id="setform_id">

      <div class="profile-aside">
        <div class="ava_cont">
        <img id="avatarPreview" src="" class="ava" alt="">
        <!-- скрытый инпут и круглая кнопка-лейбл -->
        <input type="file" id="avatar" name="avatar_file" class="ava_file">
        <label for="avatar" class="ava_btn" title="Змінити фото">
            <i class="fa-solid fa-camera"></i>
        </label>
        </div>

        <div class="user-head">
            <h2 class="user-name" id="dispName">Имя пользователя</h2>
            <span class="user-role" id="dispRole">Должность / Роль</span>
        </div>
    </div>          

      <div class="bedokur">
        <div class="usr_stngs_field">
            <label for="true_name">Настоящее имя</label>
            <input type="text" id="true_name" name="true_name" class="usr_stngs_input">
        </div>

        <div class="usr_stngs_field">
            <label for="telega">Телеграм</label>
            <input type="text" id="telega" name="telega" class="usr_stngs_input">
        </div>

        <div class="usr_stngs_field">
            <label for="posada">Должность</label>
            <input type="text" id="posada" name="posada" class="usr_stngs_input">
        </div>

        <button type="submit" name="save_setings" class="usr_stngs_submit">
            <i class="fa-solid fa-floppy-disk"></i> Сохранить
        </button>
      </div>          

    </form>

    <div class="stats-card">
      <h4 class="stats-title">Час витрачається на…</h4>
      <ul class="stats-list">
        <li>Product Infrastructure</li>
        <li>Network Security</li>
        <li>Security Testing</li>
        <li>Security Audit Outsourcing</li>
        <li>Bugs</li>
      </ul>
    </div>
  </div>
</section>





            <link rel="stylesheet" href="dstyle.css">
            <script src="dscript.js"></script>









            <!-- DIMA-END-AREA -->
            <div class="content__placeholder">
                <p>Выберите комнату или создайте новую, чтобы начать работать с задачами.</p>
            </div>
        </main>
    </div>

    <!-- Scripts (додамо потім) -->
    <script src="assets/dashboard.js"></script>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/plugins/rangePlugin.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ru.js"></script>

    <script src="assets/task-creator.js"></script>
</body>

</html>