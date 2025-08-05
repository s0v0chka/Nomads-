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
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const submenu  = document.getElementById(targetId);
        submenu.classList.toggle('open');
        btn.classList.toggle('open');
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
function loadTasks(roomId) {
    fetch('get-tasks.php?room=' + roomId)
        .then(res => res.json())
        .then(data => {
            const content = document.querySelector('.content');
            content.innerHTML = ''; // очищаємо

            if (!Array.isArray(data)) {
                content.innerHTML = '<p class="content__placeholder">Помилка завантаження задач.</p>';
                return;
            }

            if (data.length === 0) {
                content.innerHTML = '<p class="content__placeholder">У цій кімнаті ще немає задач.</p>';
                return;
            }

            const list = document.createElement('ul');
            list.className = 'task-list';

            data.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item';
                li.innerHTML = `
                    <div class="task-header">
                        <span class="task-title">${task.title}</span>
                        <span class="task-status">${task.status}</span>
                    </div>
                    <div class="task-desc">${task.description || ''}</div>
                `;
                list.appendChild(li);
            });

            content.appendChild(list);
        })
        .catch(err => {
            console.error('Помилка:', err);
            document.querySelector('.content').innerHTML = '<p class="content__placeholder">Помилка при завантаженні.</p>';
        });
}



fetch('get-rooms.php')
  .then(res => res.json())
  .then(data => {
    const ul = document.getElementById('roomsList');
    ul.innerHTML = '';

    data.forEach(room => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = room.name;
        a.addEventListener('click', e => {
            e.preventDefault();
            loadTasks(room.id);
        });

        li.appendChild(a);
        ul.appendChild(li);
    });
  });
