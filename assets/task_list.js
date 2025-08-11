// task_list.js
(function () {
  const WRAPPER_SELECTOR = '#taskListWrapper'; // контейнер панели
  const PANEL_CONTAINER  = '#tasksView';       // сюда грузим пресет
const FILTERS = window.TL_FILTERS || (window.TL_FILTERS = {
  search: '',
  assignee_id: null,
  priority: null // 'low' | 'normal' | 'high' | 'urgent' | null
});
  // Клик по кнопке "Список"
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.view-btn[data-view="list"]');
    if (!btn) return;

    const wrapper   = document.querySelector(WRAPPER_SELECTOR);
    const container = document.querySelector(PANEL_CONTAINER);
    if (!wrapper || !container) return;

    container.innerHTML = '<div class="tl-loading">Loading…</div>';
    wrapper.style.display = 'block';
    requestAnimationFrame(() => wrapper.classList.add('show'));

    // Грузим HTML-пресет
    fetch('task_list_preset.php', { credentials: 'same-origin' })
      .then(r => r.text())
      .then(html => {
        container.innerHTML = html;

        // Заголовок комнаты
setRoomHeading(container, (window.ACTIVE_ROOM_NAME || 'Все мои комнаты'), window.ACTIVE_ROOM_ID || null);

        // Данные: если комнаты нет — тянем все
        loadData(window.ACTIVE_ROOM_ID || '', container);
        initToggles(container);
        mountFiltersUI(container);
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

  // === API загрузки ===
 function loadData(roomId, root) {
  const qs = new URLSearchParams();
  if (roomId) qs.set('room_id', roomId);
  if (FILTERS.search) qs.set('search', FILTERS.search);
  if (FILTERS.assignee_id) qs.set('assignee_id', FILTERS.assignee_id);
  if (FILTERS.priority) qs.set('priority', FILTERS.priority);

  const url = 'task_list_service.php' + (qs.toString() ? ('?' + qs.toString()) : '');
  fetch(url, { credentials: 'same-origin' })
    .then(r => r.json())
    .then(data => {
      renderData(root, data);
      collectAssigneesFromData(root, data); // заполняем дропдаун исполнителей
      updateFilterChips(root);              // обновляем чипы под заголовком
    })
    .catch(() => root.querySelector('#tasklistWrap')?.insertAdjacentHTML(
      'afterbegin',
      '<div class="alert alert-danger">Data error</div>'
    ));
}

  // Отрисовка данных
  function renderData(root, data) {
    const wrap = root.querySelector('#tasklistWrap');
    if (!wrap || !data || !data.sections) return;

    // НЕ перезатираем заголовок тут, он уже выставлен выше
    // wrap.querySelector('.tl-room-label').textContent = 'Все мои комнаты';

    ['new','in_progress','done','archived'].forEach(key => {
      const section = wrap.querySelector(`.tasklist-section[data-status="${key}"]`);
      if (!section) return;

      const body  = section.querySelector('.tls-body');
      const items = data.sections[key] || [];

      section.querySelector('.tls-count').textContent = String(items.length);
      body.innerHTML = items.length ? items.map(rowHTML).join('') :
        '<div class="tls-row tls-row--empty"><div class="tls-col tls-col--empty">Нет задач</div></div>';

    });
  }

  // HTML одной задачи
function rowHTML(t) {
  return `
    <div class="tls-row" data-task-id="${escapeHTML(t.id)}" data-status="${escapeHTML(t.status)}">

      <div class="tls-col tls-col--check">
  ${completeCellHTML(t.status)}
</div>

      <div class="tls-col tls-col--title">
        <div class="tl-title">
          <span class="tl-title-text">
            ${escapeHTML(t.title || ('Задача #' + t.id))}
          </span>
          ${roomChip(t)}
        </div>

        ${t.description ? `<div class="tl-desc">${escapeHTML(t.description)}</div>` : ``}
      </div>

      <div class="tls-col tls-col--assignee">${assigneeHTML(t)}</div>
      <div class="tls-col tls-col--priority">${priorityDot(t.priority)}</div>
      <div class="tls-col tls-col--deadline">${fmtDate(t.due_date)}</div>
    <div class="tls-col tls-col--status">${statusCellHTML(t.status)}</div>
</div>
    </div>
  `;
}
function statusCellHTML(status){
  let primary = '';
  if (status === 'new') {
    primary = `<button class="tl-act tl-act--start"   type="button" title="Начать"><i class="fas fa-play"></i></button>`;
  } else if (status === 'in_progress') {
    primary = `<button class="tl-act tl-act--done"    type="button" title="Завершить"><i class="fas fa-check"></i></button>`;
  } else if (status === 'done') {
    primary = `<button class="tl-act tl-act--restore" type="button" title="Восстановить"><i class="fas fa-undo"></i></button>`;
  } else if (status === 'archived') { // ← ДОБАВЬ ЭТО
    primary = `<button class="tl-act tl-act--restore" type="button" title="Восстановить"><i class="fas fa-undo"></i></button>`;
  }

  return `
    <span class="tl-status">
      ${statusBadge(status)}
      <span class="tl-status-actions" role="group" aria-label="Действия со статусом">
        ${primary}
        <button class="tl-act tl-act--archive" type="button" title="Архивировать"><i class="fas fa-archive"></i></button>
        <button class="tl-act tl-act--delete"  type="button" title="Удалить"><i class="fas fa-trash"></i></button>
      </span>
    </span>
  `;
}


function completeCellHTML(status){
  // если уже выполнено — показываем «заполненную» (неактивную) кнопку
  if (status === 'done') {
    return `<button class="tl-complete is-done" type="button" title="Выполнено" disabled>
              <i class="fas fa-check"></i>
            </button>`;
  }
  // иначе — обычная «Завершить»
  return `<button class="tl-complete" type="button" title="Завершить">
            <i class="fas fa-check"></i>
          </button>`;
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
function roomChip(t){
  const name  = t.room_name || (t.room_id ? `Комната #${t.room_id}` : 'Без комнаты');
  // Приведём цвет к чему-то безопасному, по умолчанию серый
  let color = (t.room_color || '').trim();
  if (!/^#([0-9a-f]{3,8})$/i.test(color)) color = '#999';
  // Используем CSS-переменную, чтобы не лить инлайн-цвет на саму точку
  return `
    <span class="tl-chip tl-chip--room" style="--room-color:${escapeHTML(color)}">
      <i class="room-dot"></i>${escapeHTML(name)}
    </span>
  `;
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
    return dt.toLocaleString('ru-RU', { month:'short', day:'2-digit' });
  }
  function statusBadge(s){
    switch(s){
      case 'new':         return '<span class="badge badge--blue">НЕ НАЧАТА</span>';
      case 'in_progress': return '<span class="badge badge--green">В РАБОТЕ</span>';
      case 'done':        return '<span class="badge badge--yellow">ВЫПОЛНЕНО</span>';
      case 'archived':    return '<span class="badge badge--gray">АРХИВ</span>';
      default:            return `<span class="badge">${escapeHTML(s || '')}</span>`;
    }
  }
  function priorityDot(p){
    const up = (p||'normal').toLowerCase();
    const map = { low:'Низкий', normal:'Обычный', high:'Высокий', urgent:'Срочно' };
    return `<span class="prio-dot prio-${escapeHTML(up)}"></span> ${map[up] || up}`;
  }

  // === Публичный API (видит PANEL_CONTAINER, loadData, initToggles) ===
  window.TaskList = {
    reloadByRoom(roomId, roomName) {
      const container = document.querySelector(PANEL_CONTAINER);
      if (!container) return;

      // если пресет ещё не подгружен — подгружаем и потом тянем данные
      if (!container.firstElementChild) {
        container.innerHTML = '<div class="tl-loading">Загрузка…</div>';
        fetch('task_list_preset.php', { credentials: 'same-origin' })
          .then(r => r.text())
          .then(html => {
            container.innerHTML = html;
 setRoomHeading(container, roomName || 'Все мои комнаты', roomId || null);
            loadData(roomId || '', container);
            initToggles(container);
            mountFiltersUI(container);
          });
        return;
      }

      // пресет уже есть — просто обновим заголовок и данные
setRoomHeading(container, roomName || 'Все мои комнаты', roomId || null);
loadData(roomId || '', container);
   
    }
  };


// === Клики по кнопкам статуса (делегирование) ===
document.addEventListener('click', async (e) => {
  const btnComplete = e.target.closest('.tl-complete');     
  const btnStart    = e.target.closest('.tl-act--start');
  const btnDone     = e.target.closest('.tl-act--done');
  const btnRestore  = e.target.closest('.tl-act--restore');
  const btnArchive  = e.target.closest('.tl-act--archive');
  const btnDelete   = e.target.closest('.tl-act--delete');
  if (!btnComplete && !btnStart && !btnDone && !btnRestore && !btnArchive && !btnDelete) return;


  const row = e.target.closest('.tls-row');
  if (!row) return;
  const taskId = Number(row.dataset.taskId);

  try {
    if (btnDelete) {
      await taskAction('delete', { id: taskId });
      removeRow(row);
      return;
    }

    if (btnStart) {
      await taskAction('set_status', { id: taskId, status: 'in_progress' });
      moveRowToStatus(row, 'in_progress');
      return;
    }

    if (btnDone) {
      await taskAction('set_status', { id: taskId, status: 'done' });
      moveRowToStatus(row, 'done');
      return;
    }
    if (btnRestore) {
  const from = row.dataset.status;
  const to   = (from === 'archived') ? 'new' : 'in_progress';
  await taskAction('set_status', { id: taskId, status: to });
  moveRowToStatus(row, to);
  return;
}
    if (btnArchive) {
      await taskAction('set_status', { id: taskId, status: 'archived' });
      moveRowToStatus(row, 'archived');
      return;
    }
    if (btnComplete && !btnComplete.disabled) {
  await taskAction('set_status', { id: taskId, status: 'done' });
  moveRowToStatus(row, 'done');
  return;
}


  } catch (err) {
    console.warn(err);
    alert(err.message || 'Не удалось выполнить действие');
  }
});

// === API вызов к серверу ===
async function taskAction(action, payload){
  const body = new URLSearchParams({ action, ...payload });
  const res  = await fetch('task_actions.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'same-origin',
    body
  });
  const j = await res.json();
  if (!res.ok || !j.success) throw new Error(j.error || 'Action failed');
  return j;
}

// === Перемещение строки в другой раздел ===
function moveRowToStatus(row, status){
  const fromSection = row.closest('.tasklist-section');
  const toBody = document.querySelector(`#tasksView .tasklist-section[data-status="${status}"] .tls-body`);
  if (!toBody) return;

  // обновить содержимое ячейки статуса и data-status
  const cell = row.querySelector('.tls-col--status');
  if (cell) cell.innerHTML = statusCellHTML(status);
  row.dataset.status = status;
    const left = row.querySelector('.tls-col--check');
if (left) left.innerHTML = completeCellHTML(status);
  // если в целевой секции был плейсхолдер — убрать
  const empty = toBody.querySelector('.tls-row--empty');
  if (empty) empty.remove();

  // перенести строку (наверх)
  toBody.prepend(row);

  // пересчитать счётчики
  recomputeCounts(fromSection);
  recomputeCounts(toBody.closest('.tasklist-section'));
}

// === Удаление строки и пересчёт ===
function removeRow(row){
  const section = row.closest('.tasklist-section');
  const body    = row.parentElement;
  row.remove();

  if (!body.querySelector('.tls-row')) {
    body.innerHTML = '<div class="tls-row tls-row--empty"><div class="tls-col tls-col--empty">Нет задач</div></div>';
  }
  recomputeCounts(section);
}

// === Пересчёт количества задач в секции ===
function recomputeCounts(section){
  if (!section) return;
  const countEl = section.querySelector('.tls-count');
  const n = section.querySelectorAll('.tls-body .tls-row:not(.tls-row--empty)').length;
  if (countEl) countEl.textContent = String(n);
}












function debounce(fn, ms=300){
  let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); };
}




// ——— простой кастомный dropdown для фильтров ———
function initFilterDropdown(ddEl, items, { value = '', placeholder = 'Выбрать…', onChange } = {}) {
  if (!ddEl) return;

  // базовая разметка
  ddEl.innerHTML = `
    <button type="button" class="tlf-dd-selected">
      <span class="dd-text">${placeholder}</span>
    </button>
    <ul class="tlf-dd-list" hidden></ul>
  `;

  const btn  = ddEl.querySelector('.tlf-dd-selected');
  const list = ddEl.querySelector('.tlf-dd-list');

  // рендер списка
  const renderList = () => {
    list.innerHTML = '';
    const frag = document.createDocumentFragment();
    items.forEach(it => {
      const li = document.createElement('li');
      li.className = 'tlf-dd-item';
      li.dataset.value = String(it.value ?? '');
      // если есть .dot (для приоритета) — рисуем точку
      const dot = it.dot ? `<span class="dd-dot ${it.dot}"></span>` : '';
      li.innerHTML = `${dot}<span class="dd-label">${it.label}</span>`;
      li.onclick = () => {
        value = (it.value ?? '');
        btn.querySelector('.dd-text').innerHTML = it.label || placeholder;
        close();
        if (typeof onChange === 'function') onChange(value, it);
      };
      frag.appendChild(li);
    });
    list.appendChild(frag);
  };

  // открыть / закрыть
  const open  = () => { ddEl.classList.add('open'); list.hidden = false; };
  const close = () => { ddEl.classList.remove('open'); list.hidden = true; };

  btn.onclick = () => ddEl.classList.contains('open') ? close() : open();
  document.addEventListener('click', (e) => {
    if (!ddEl.contains(e.target)) close();
  });

  // первичная отрисовка
  renderList();

  // установим текущую подпись
  const cur = items.find(i => String(i.value ?? '') === String(value));
  btn.querySelector('.dd-text').innerHTML = cur ? cur.label : placeholder;

  // отдаём API наружу (для обновления ассигни)
  ddEl.__setItems = (nextItems, nextValue = '') => {
    items = nextItems || [];
    value = nextValue;
    renderList();
    const cur2 = items.find(i => String(i.value ?? '') === String(value));
    btn.querySelector('.dd-text').innerHTML = cur2 ? cur2.label : placeholder;
  };
}













// ——— смонтировать контролы справа в .tasklist-filters .tl-right ———
function mountFiltersUI(root){
  const bar = root.querySelector('.tasklist-filters .tl-right');
  if (!bar || bar.__mounted) return; // чтобы не дублировать
  bar.__mounted = true;

  const wrap = document.createElement('div');
  wrap.className = 'tl-filters-ui';

  // поиск
  const sWrap = document.createElement('div');
  sWrap.className = 'tlf tlf--search';
  sWrap.innerHTML = `
    <input class="tlf-input tl-filter-search" type="search"
           placeholder="Поиск…" value="${FILTERS.search || ''}">
  `;

  // приоритет
const pWrap = document.createElement('div');
pWrap.className = 'tlf tlf--prio';
pWrap.innerHTML = `<div class="tlf-dd tlf-dd--prio"></div>`;

  // исполнитель (заполним из данных)
const aWrap = document.createElement('div');
aWrap.className = 'tlf tlf--assignee';
aWrap.innerHTML = `<div class="tlf-dd tlf-dd--assignee"></div>`;

  wrap.append(sWrap, pWrap, aWrap);
  bar.appendChild(wrap);

  


    const searchInput = sWrap.querySelector('.tl-filter-search');
searchInput.addEventListener('input', debounce(() => {
  FILTERS.search = searchInput.value.trim();
  applyFilters(root);
}, 300));

// init dropdown: PRIORITY
const prioDD = pWrap.querySelector('.tlf-dd--prio');
initFilterDropdown(
  prioDD,
  [
    { value: '',       label: 'Приоритет — любой' },
    { value: 'urgent', label: 'Срочно',  dot: 'prio-urgent' },
    { value: 'high',   label: 'Высокий', dot: 'prio-high'   },
    { value: 'normal', label: 'Обычный', dot: 'prio-normal' },
    { value: 'low',    label: 'Низкий',  dot: 'prio-low'    }
  ],
  {
    value: FILTERS.priority || '',
    placeholder: 'Приоритет — любой',
    onChange: (val) => {
      FILTERS.priority = val || null;
      applyFilters(root);
    }
  }
);

// init dropdown: ASSIGNEE (пока пустой; заполним после loadData)
const asgDD = aWrap.querySelector('.tlf-dd--assignee');
initFilterDropdown(
  asgDD,
  [{ value: '', label: 'Исполнитель — любой' }],
  {
    value: FILTERS.assignee_id ? String(FILTERS.assignee_id) : '',
    placeholder: 'Исполнитель — любой',
    onChange: (val) => {
      FILTERS.assignee_id = val ? Number(val) : null;
      applyFilters(root);
    }
  }
);

// сохраним ссылку, чтобы пополнять список после загрузки данных
root.__assigneeDD = asgDD;









}

// ——— применить фильтры: перезагрузить с текущей комнатой ———
function applyFilters(root){
  const wrap = root.querySelector('#tasklistWrap');
  if (!wrap) return;
  wrap.querySelectorAll('.tls-body').forEach(b=>{
    b.innerHTML = '<div class="tls-row tls-row--empty"><div class="tls-col tls-col--empty">Фильтрация…</div></div>';
  });
  loadData(window.ACTIVE_ROOM_ID || '', root);
}

// ——— чипы под заголовком ———
function updateFilterChips(root){
  const chipS = root.querySelector('.tl-chip--search');
  const chipA = root.querySelector('.tl-chip--assignee');
  const chipP = root.querySelector('.tl-chip--priority');

  // поиск
  if (FILTERS.search) {
    chipS.hidden = false;
    chipS.innerHTML = `Поиск: <b>${escapeHTML(FILTERS.search)}</b> <button class="chip-x" aria-label="Сбросить">×</button>`;
    chipS.querySelector('.chip-x').onclick = ()=>{ FILTERS.search=''; applyFilters(root); };
  } else chipS.hidden = true;

  // исполнитель
  if (FILTERS.assignee_id) {
    const name = (root.__assigneesMap?.get(FILTERS.assignee_id) || `ID ${FILTERS.assignee_id}`);
    chipA.hidden = false;
    chipA.innerHTML = `Исполнитель: <b>${escapeHTML(name)}</b> <button class="chip-x" aria-label="Сбросить">×</button>`;
    chipA.querySelector('.chip-x').onclick = ()=>{ FILTERS.assignee_id=null; applyFilters(root); };
  } else chipA.hidden = true;

  // приоритет
  if (FILTERS.priority) {
    const map = {urgent:'Срочно', high:'Высокий', normal:'Обычный', low:'Низкий'};
    chipP.hidden = false;
    chipP.innerHTML = `Приоритет: <b>${map[FILTERS.priority]||FILTERS.priority}</b> <button class="chip-x" aria-label="Сбросить">×</button>`;
    chipP.querySelector('.chip-x').onclick = ()=>{ FILTERS.priority=null; applyFilters(root); };
  } else chipP.hidden = true;
}


function collectAssigneesFromData(root, data){
  const m = new Map(); // id -> name
  ['new','in_progress','done','archived'].forEach(k=>{
    (data.sections?.[k]||[]).forEach(t=>{
      if (t.assignee_id) {
        const name = (t.assignee_name && t.assignee_name.trim()) ? t.assignee_name : `ID ${t.assignee_id}`;
        m.set(t.assignee_id, name);
      }
    });
  });

  root.__assigneesMap = m;

  // обновляем items кастом-дропдауна, если он смонтирован
  if (root.__assigneeDD && typeof root.__assigneeDD.__setItems === 'function') {
    const items = [{ value: '', label: 'Исполнитель — любой' }]
      .concat(Array.from(m.entries()).map(([id, name]) => ({
        value: String(id),
        label: name
      })));

    const curVal = FILTERS.assignee_id ? String(FILTERS.assignee_id) : '';
    root.__assigneeDD.__setItems(items, curVal);
  }
}











})(); // <— ВАЖНО: TaskList объявлен ВНУТРИ этого IIFE



// Клик по комнате (оставляем снаружи)
(function(){
  document.addEventListener('click', function(e){
    const a = e.target.closest('.room-item > a');
    if (!a) return;
    e.preventDefault();

    const li   = a.closest('.room-item');
    const id   = li.getAttribute('data-room-id'); // "" для "Все комнаты"
    const name = li.getAttribute('data-room-name') || (id ? ('Комната #' + id) : 'Все мои комнаты');

    // подсветка активной комнаты
    document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
    li.classList.add('active');

    // сохранить выбор и перерисовать список задач
    window.ACTIVE_ROOM_ID   = id || null;
    window.ACTIVE_ROOM_NAME = name;
    TaskList.reloadByRoom(window.ACTIVE_ROOM_ID, window.ACTIVE_ROOM_NAME);
  });
})();



function setRoomHeading(container, name, roomId){
  const lbl   = container.querySelector('.tl-room-label');
  const clear = container.querySelector('.tl-clear-room');

  if (lbl)   lbl.textContent = name || 'Все мои комнаты';
  if (!clear) return;

  // показать крестик только если выбран конкретный roomId
  clear.hidden = !roomId;

  // каждый раз переопределяем обработчик (без утечек)
clear.onclick = () => {
  window.ACTIVE_ROOM_ID   = null;
  window.ACTIVE_ROOM_NAME = null;
  setRoomHeading(container, 'Все мои комнаты', null);
  TaskList.reloadByRoom(null, 'Все мои комнаты'); // <— без обращения к приватной loadData
  document.querySelectorAll('.room-item').forEach(el => el.classList.remove('active'));
};
}