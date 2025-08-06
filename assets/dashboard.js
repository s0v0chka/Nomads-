/* =========================================================
   STARFIELD BACKGROUND
   ========================================================= */
const canvas = document.getElementById('stars');
const ctx    = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
function initStars() {
    stars = Array.from({length: 140}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2,
        v: 0.4 + Math.random() * 0.8
    }));
}
function animateStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    stars.forEach(p => {
        ctx.fillRect(p.x, p.y, p.s, p.s);
        p.y -= p.v;
        if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
    });
    requestAnimationFrame(animateStars);
}
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });
resizeCanvas(); initStars(); animateStars();

/* =========================================================
   SIDEBAR COLLAPSE / EXPAND
   ========================================================= */
const sidebar        = document.getElementById('sidebar');
const sidebarToggle  = document.getElementById('sidebarToggle');

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
});

/* =========================================================
   COLLAPSIBLE "Комнаты"
   ========================================================= */
document.querySelectorAll('.menu__collapse').forEach(btn => {
    const targetId = btn.dataset.target;
    const submenu = document.getElementById(targetId);

    // при загрузке страницы — восстановить состояние
    const savedState = localStorage.getItem(`menu_${targetId}`);
    if (savedState === 'open') {
        submenu.classList.add('open');
        btn.classList.add('open');
    }

    btn.addEventListener('click', () => {
        submenu.classList.toggle('open');
        btn.classList.toggle('open');

        // сохранить новое состояние
        const isOpen = submenu.classList.contains('open');
        localStorage.setItem(`menu_${targetId}`, isOpen ? 'open' : 'closed');
    });
});

/* =========================================================
   VIEW SWITCHER (Kanban / List / Grid)
   ========================================================= */
const viewButtons   = document.querySelectorAll('.view-btn');
const placeholder   = document.querySelector('.content__placeholder p');

viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        viewButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Демонстраційний текст (пізніше — завантаження відповідного шаблону)
        const view = btn.dataset.view;
        switch (view) {
            case 'kanban':
                placeholder.textContent = 'Отобразится канбан-доска задач.';
                break;
            case 'list':
                placeholder.textContent = 'Отобразится список задач.';
                break;
            case 'grid':
                placeholder.textContent = 'Отобразится галерея карточек задач.';
                break;
        }
    });
});

/* =========================================================
   NAVIGATION active-state (по желанию)
   ========================================================= */
document.querySelectorAll('.menu__item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu__item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
    });
});


/* =========================================================
   LOAD TASKS
   ========================================================= */

document.querySelector('.baseadd').addEventListener('click', () => {
    document.getElementById('addRoomModal').style.display = 'flex';
});

document.getElementById('saveRoomBtn').addEventListener('click', () => {
    const name = document.getElementById('newRoomName').value.trim();
    const color = document.querySelector('input[name="color"]').value;

    if (!name) {
        alert('Введите имя комнаты');
        return;
    }

    fetch('add-room.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `name=${encodeURIComponent(name)}&color=${encodeURIComponent(color)}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload(); // или можно динамически перерисовать список
        } else {
            alert(data.message || 'Ошибка');
        }
    });
});

document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('addRoomModal').style.display = 'none';
});
const colorInput = document.getElementById('roomColor');
const colorDisplay = document.getElementById('colorDisplay');

colorInput.addEventListener('input', () => {
    colorDisplay.style.backgroundColor = colorInput.value;
});


// Закриття меню по кліку поза ним
document.addEventListener('click', function (e) {
    document.querySelectorAll('.room-menu').forEach(menu => menu.style.display = 'none');
});

// Відкриття меню по кнопці
document.querySelectorAll('.room-options').forEach(button => {
    button.addEventListener('click', function (e) {
        e.stopPropagation(); // щоб не закрилось одразу
        const menu = this.nextElementSibling;
        document.querySelectorAll('.room-menu').forEach(m => m.style.display = 'none');
        menu.style.display = 'block';
    });
});

// Редагування
document.querySelectorAll('.edit-room').forEach(btn => {
    btn.addEventListener('click', function () {
        const li = this.closest('.room-item');
        const roomId = li.dataset.roomId;
        const roomName = li.dataset.roomName;
        const roomColor = li.dataset.roomColor;

        openEditRoomModal(roomId, roomName, roomColor);
    });
});
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.delete-room').forEach(btn => {
    btn.addEventListener('click', () => {
      const li = btn.closest('.room-item');
      const roomId = li.getAttribute('data-room-id');
      openDeleteModal(roomId);
    });
  });
});
// Видалення
function openDeleteModal(roomId) {
  document.getElementById('deleteRoomId').value = roomId;
  document.getElementById('confirmDeleteModal').style.display = 'flex';
}

function closeDeleteModal() {
  document.getElementById('confirmDeleteModal').style.display = 'none';
}

function confirmRoomDeletion() {
  const roomId = document.getElementById('deleteRoomId').value;

  fetch('delete-room.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'room_id=' + encodeURIComponent(roomId)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      location.reload(); 
    } else {
      alert(data.message || 'Ошибка удаления');
    }
  });
}

function openEditRoomModal(roomId, name, color) {
  document.getElementById('editRoomId').value = roomId;
  document.getElementById('editRoomName').value = name;
  document.getElementById('editRoomColor').value = color;
  document.getElementById('editColorDisplay').style.backgroundColor = color;
  document.getElementById('editRoomModal').style.display = 'flex';
}
document.getElementById('editRoomColor').addEventListener('input', function () {
  document.getElementById('editColorDisplay').style.backgroundColor = this.value;
});


document.getElementById('saveEditBtn').addEventListener('click', () => {
  const id = document.getElementById('editRoomId').value;
  const name = document.getElementById('editRoomName').value.trim();
  const color = document.getElementById('editRoomColor').value;

  fetch('update-room.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `room_id=${id}&name=${encodeURIComponent(name)}&color=${encodeURIComponent(color)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      location.reload(); // або вручну оновити DOM
    } else {
      alert(data.message || 'Ошибка редактирования');
    }
  });
});
