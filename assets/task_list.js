// task_list.js
(function () {
  const WRAPPER_SELECTOR = '#taskListWrapper'; // контейнер панели
  const PANEL_CONTAINER  = '#tasksView';       // сюда грузим пресет

  // Клик по кнопке "Список"
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.view-btn[data-view="list"]');
    if (!btn) return;

    const wrapper   = document.querySelector(WRAPPER_SELECTOR);
    const container = document.querySelector(PANEL_CONTAINER);
    if (!wrapper || !container) return;

    // Показываем оверлей
    container.innerHTML = '<div class="tl-loading">Loading…</div>';
    wrapper.style.display = 'block';
    requestAnimationFrame(() => wrapper.classList.add('show'));

    // Грузим HTML-пресет
    fetch('task_list_preset.php', { credentials: 'same-origin' })
      .then(r => r.text())
      .then(html => {
        container.innerHTML = html;
        loadData(container);
        initToggles(container);
      })
      .catch(() => container.innerHTML = '<div class="alert alert-danger">Load error</div>');
  });

  // Закрытие панели
  window.closeTaskList = function() {
    const wrapper = document.querySelector(WRAPPER_SELECTOR);
    if (!wrapper) return;
    wrapper.classList.remove('show');
    setTimeout(() => wrapper.style.display = 'none', 300);
  };

  // Загружаем JSON с задачами
  function loadData(root) {
    fetch('task_list_service.php', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => renderData(root, data))
      .catch(() => root.querySelector('#tasklistWrap')?.insertAdjacentHTML('afterbegin',
        '<div class="alert alert-danger">Data error</div>'
      ));
  }

  // Заполняем пресет задачами
  function renderData(root, data) {
    const wrap = root.querySelector('#tasklistWrap');
    if (!wrap || !data || !data.sections) return;

    wrap.querySelector('.tl-room-label').textContent = 'All my rooms';

    ['new','in_progress','done','archived'].forEach(key => {
      const section = wrap.querySelector(`.tasklist-section[data-status="${key}"]`);
      if (!section) return;

      const body  = section.querySelector('.tls-body');
      const items = data.sections[key] || [];

      section.querySelector('.tls-count').textContent = String(items.length);
      body.innerHTML = items.length ? items.map(rowHTML).join('') :
        '<div class="tls-row tls-row--empty"><div class="tls-col tls-col--empty">Нет задач</div></div>';

      const checkAll = section.querySelector('.tl-check-all');
      if (checkAll) {
        checkAll.checked = false;
        checkAll.onchange = () => {
          body.querySelectorAll('.tl-check').forEach(ch => ch.checked = checkAll.checked);
        };
      }
    });
  }

  // HTML одной задачи
function rowHTML(t) {
  return `
    <div class="tls-row" data-task-id="${escapeHTML(t.id)}">
      <div class="tls-col tls-col--check">
        <input type="checkbox" class="tl-check" value="${escapeHTML(t.id)}">
      </div>
      <div class="tls-col tls-col--title">
        <div class="tl-title">
          ${escapeHTML(t.title || ('Задача #' + t.id))}
          <span class="tl-chip tl-chip--room">Комната #${escapeHTML(t.room_id)}</span>
        </div>
        ${t.description ? `<div class="tl-desc">${escapeHTML(t.description)}</div>` : ``}
      </div>
      <div class="tls-col tls-col--assignee">${assigneeHTML(t)}</div>
      <div class="tls-col tls-col--priority">${priorityDot(t.priority)}</div>
      <div class="tls-col tls-col--deadline">${fmtDate(t.due_date)}</div>
      <div class="tls-col tls-col--status">${statusBadge(t.status)}</div>
    </div>
  `;
}

function assigneeHTML(t){
  const name = t.assignee_name || '';
  const ava  = t.assignee_avatar || '';
  if (!name && !ava) return '<span class="tl-muted">—</span>';
  if (ava) {
    return `
      <span class="assignee">
        <img class="assignee-ava" src="${escapeHTML(ava)}" alt="${escapeHTML(name)}" loading="lazy">
        <span class="name">${escapeHTML(name || 'Без имени')}</span>
      </span>
    `;
  }
  return `<span class="assignee"><span class="name">${escapeHTML(name)}</span></span>`;
}



  // Сворачивание секций
  function initToggles(root){
    root.querySelectorAll('.tasklist-section .tls-head').forEach(head=>{
      head.addEventListener('click', ()=>{
        head.closest('.tasklist-section').classList.toggle('is-collapsed');
      });
    });
  }

  // helpers
  function escapeHTML(s){ return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
  function fmtDate(d){
    if(!d) return '';
    const dt = new Date(String(d).replace(' ','T'));
    if (isNaN(dt)) return '';
    return dt.toLocaleString('en-US', { month:'short', day:'2-digit' });
  }
function statusBadge(s){
  switch(s){
    case 'new':         return '<span class="badge badge--blue">НЕ НАЧАТА</span>';
    case 'in_progress': return '<span class="badge badge--green">В РАБОТЕ</span>';
    case 'done':        return '<span class="badge badge--yellow">НА ПРОВЕРКЕ</span>';
    case 'archived':    return '<span class="badge badge--gray">АРХИВ</span>';
    default:            return `<span class="badge">${escapeHTML(s || '')}</span>`;
  }
}
  function priorityDot(p){
    const up = (p||'normal').toLowerCase();
    return `<span class="prio-dot prio-${escapeHTML(up)}"></span> ${up[0].toUpperCase()+up.slice(1)}`;
  }
})();
