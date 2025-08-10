/* Открыть панель */
document.getElementById('openTaskCreatorBtn').addEventListener('click', () => {
  fetch('task-preset.php')
    .then(r => r.text())
    .then(html => {
      let pane = document.getElementById('taskCreatorWrapper');
      if (!pane) {
        pane = document.createElement('div');
        pane.id = 'taskCreatorWrapper';
        document.body.appendChild(pane);
      }
      pane.innerHTML = html;
const panel = pane.querySelector('.tc-panel');
if (panel) panel.classList.add('tc-panel--right'); // или tc-panel--left, если нужно слева

// 1) даём браузеру применить стартовый transform (translateX(110%))
panel && panel.getBoundingClientRect(); // форсируем reflow

// 2) на следующий кадр добавляем класс, чтобы анимация сработала
requestAnimationFrame(() => {
  pane.classList.add('task-slide-in'); // поедет из translateX(110%) в 0
  initTaskCreator();
});

    });
});

/* Закрыть панель с очисткой и снятием хендлеров */
function closeTaskCreator () {
  const p = document.getElementById('taskCreatorWrapper');
  if (!p) return;

  p.classList.remove('task-slide-in');
  if (p.__onKeydown) document.removeEventListener('keydown', p.__onKeydown);

  const panel = p.querySelector('.tc-panel');
  if (panel) {
    panel.addEventListener('transitionend', () => { p.innerHTML = ''; }, { once: true });
  } else {
    p.innerHTML = '';
  }
}

/* ===================== INIT ===================== */
async function initTaskCreator() {
  // 1) flatpickr + RU
  if (typeof flatpickr === 'undefined') {
    const [{ default: fpCore }, _ru] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js'),
      import('https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/ru.js')
    ]);
    window.flatpickr = fpCore;
    fpCore.localize(flatpickr.l10ns.ru);
  }

  // 2) nice labels
  const MONTH = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nice = d => {
    const diff = (d - today) / 864e5 | 0;
    if (diff === 0) return { s: 'Сегодня', c: 'due-today' };
    if (diff === 1) return { s: 'Завтра', c: 'due-range' };
    if (diff === -1) return { s: 'Вчера', c: 'due-past' }; // фикс опечатки
    return { s: `${d.getDate()} ${MONTH[d.getMonth()]}`, c: 'due-range' };
  };

  // 3) DOM
  const wrapper  = document.getElementById('taskCreatorWrapper');
  const panel    = wrapper.querySelector('.tc-panel');
  const startISO = document.getElementById('taskStart');
  const dueISO   = document.getElementById('taskDue');
  const dispBtn  = document.getElementById('dateDisplay');
  const dispTxt  = document.getElementById('dateDisplayText');
  const createTaskBtn = document.getElementById('createTaskBtn');


  // === FIRE OVER PRIMARY BTN (инициализация частиц один раз) ===
  const fireBox = panel.querySelector('#tcFire');
  if (fireBox && !fireBox.__inited) {
    const frag = document.createDocumentFragment();
    const num = 50, spread = 50;
    for (let i = 0; i < num; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = `calc((100% - 0.1em) * ${i / spread})`;
      p.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
      frag.appendChild(p);
    }
    fireBox.appendChild(frag);
    fireBox.__inited = true;
  }



  // focus trap + ESC
  const focusables = panel.querySelectorAll('button, [href], input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])');
  const firstF = focusables[0], lastF = focusables[focusables.length - 1];
  const onKey = (e) => {
    if (e.key === 'Escape') return closeTaskCreator();
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === firstF) { e.preventDefault(); lastF.focus(); }
    else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); firstF.focus(); }
  };
  document.addEventListener('keydown', onKey);
  wrapper.__onKeydown = onKey;
  setTimeout(() => (panel.querySelector('#taskTitle')?.focus()), 60);

  // 4) якорный input для календаря
  const anchor = document.createElement('input');
  anchor.type = 'text';
  anchor.className = 'fp-anchor';
  dispBtn.after(anchor);

  // 5) состояние дат
  let startDate = null, dueDate = null;
  let activeTab = 'due';          // 'start' | 'due' (визуальная подсказка в хедере)
  let expectRange = false;        // включаем ТОЛЬКО после клика по "Start date"
  let picker = null;

  // === помощники для UI ===
  function updateDateDisplay() {
    dispTxt.className = '';
    if (dueDate && !startDate) {
      const p = nice(dueDate);
      dispTxt.textContent = p.s;
      dispTxt.classList.add(p.c);
    } else if (startDate && dueDate) {
      dispTxt.textContent = `${nice(startDate).s} – ${nice(dueDate).s}`;
      dispTxt.classList.add('due-range');
    } else if (startDate && !dueDate) {
      const p = nice(startDate);
      dispTxt.textContent = p.s;
      dispTxt.classList.add(p.c);
    } else {
      dispTxt.textContent = 'Нет срока';
    }
  }

  function setHeaderState(calEl) {
    const [tabStart, tabDue] = calEl.querySelectorAll('.fp-header .fp-tab');
    if (!tabStart || !tabDue) return;
    if (activeTab === 'start') {
      tabStart.classList.add('active');  tabDue.classList.remove('active');
    } else {
      tabDue.classList.add('active');    tabStart.classList.remove('active');
    }
  }

  // === построение пикера под режим single/range ===
  function buildPicker(mode /* 'single' | 'range' */) {
    if (picker) { try { picker.destroy(); } catch(e){} }

    picker = flatpickr(anchor, {
      locale: 'ru',
      altInput: false,            // без лишнего «белого» поля
      disableMobile: true,
      mode,                       // переключаем режим

      // ВАЖНО: показываем текущий выбор при открытии
      defaultDate: mode === 'range'
        ? (startDate ? (dueDate ? [startDate, dueDate] : [startDate]) : null)
        : (dueDate || null),

      onReady(_sel, _str, inst) {
        const cal = inst.calendarContainer;
        cal.classList.add('tc-flatpickr');

        // кастом-хедер
        const head = document.createElement('div');
        head.className = 'fp-header';

        const btnStart = document.createElement('button');
        btnStart.className = 'fp-tab';
        btnStart.textContent = '+ Start date';

        const btnDue = document.createElement('button');
        btnDue.className = 'fp-tab';
        btnDue.textContent = 'Due date';

        head.append(btnStart, btnDue);
        cal.prepend(head);

        // начальное состояние вкладок
        setHeaderState(cal);

        // поведение кнопок
        btnStart.onclick = () => {
          // если были старые даты — начинаем диапазон с нуля
          expectRange = true;
          activeTab = 'start';
          startDate = null; dueDate = null;
          startISO.value = ''; dueISO.value = '';
          updateDateDisplay();

          if (inst.config.mode !== 'range') {
            buildPicker('range');
            picker.open();
            return;
          }
          setHeaderState(cal);
        };

        btnDue.onclick = () => {
          activeTab = 'due';
          if (inst.config.mode !== 'range') {
            // одиночный режим — просто визуал
            setHeaderState(cal);
            return;
          }
          // в range подсказка, что ждём конец
          setHeaderState(cal);
        };

        // если в range и старт уже выбран — сразу подсветим, что ждём due
        if (mode === 'range' && startDate && !dueDate) {
          activeTab = 'due';
          setHeaderState(cal);
        }
      },

      onOpen: (_sel, _str, inst) => {
        dispBtn.classList.add('active');

        // Если ранее уже выбран ПОЛНЫЙ диапазон — показываем его целиком
        if (startDate && dueDate) {
          if (inst.config.mode !== 'range') {
            buildPicker('range');
            picker.open();
            return;
          }
          activeTab = 'due';
          setHeaderState(inst.calendarContainer);
          inst.setDate([startDate, dueDate], false);
          return;
        }

        // Обычный сценарий: одиночный due, если юзер не нажимал Start
        if (!expectRange) {
          activeTab = 'due';
          if (inst.config.mode !== 'single') {
            buildPicker('single');
            picker.open();
            return;
          }
          if (dueDate) inst.setDate(dueDate, false);
          setHeaderState(inst.calendarContainer);
        } else {
          // Пользователь хотел диапазон — убедимся, что мы в range
          if (inst.config.mode !== 'range') {
            buildPicker('range');
            picker.open();
            return;
          }
          setHeaderState(inst.calendarContainer);
        }
      },

      onClose: () => {
        dispBtn.classList.remove('active');
        // Сессия выбора завершена — по умолчанию вернёмся к одиночному сценарию
        expectRange = false;
      },

      onChange(sel, _dateStr, inst) {
        // SINGLE: сразу ставим due, закрываем
        if (inst.config.mode === 'single') {
          if (!sel.length) return;
          startDate = null; startISO.value = '';
          dueDate = sel[0]; dueISO.value = dueDate.toISOString().slice(0,10);
          updateDateDisplay();
          picker.close();
          return;
        }

        // RANGE:
        if (sel.length === 1) {
          // выбран старт — остаёмся открытыми, есть видимая подсветка
          startDate = sel[0];
          startISO.value = startDate.toISOString().slice(0,10);
          dueDate = null; dueISO.value = '';
          activeTab = 'due';
          updateDateDisplay();
          setHeaderState(inst.calendarContainer);
        } else if (sel.length === 2) {
          // выбран конец — закрываем
          startDate = sel[0];
          dueDate   = sel[1];
          if (startDate > dueDate) [startDate, dueDate] = [dueDate, startDate];
          startISO.value = startDate.toISOString().slice(0,10);
          dueISO.value   = dueDate.toISOString().slice(0,10);
          updateDateDisplay();
          picker.close();
        }
      }
    });
  }

  // стартуем в single
  buildPicker('single');

  // открыть календарь кнопкой
  dispBtn.onclick = () => { picker.open(); };

  /* 7) ПРИОРИТЕТ */
 // === PRIORITY SLIDER (плавно + live-подсветка + снэп) ===
(()=>{
  const PRIO_ORDER = ['low','normal','high','urgent'];
  const PALETTE = {
    low:    ['#22c55e', '#2dd4bf'],
    normal: ['var(--neon1)', 'var(--neon2)'],
    high:   ['#f5be0bff', '#fa4d0eff'],
    urgent: ['#ff2e55ff', '#f70b0bff']
  };

  const prioRange = panel.querySelector('#prioRange');
  const prioTicks = Array.from(panel.querySelectorAll('.tc-prio-slider .ticks span'));

  const clamp = (v,min,max)=>Math.min(max,Math.max(min,v));
  const idxToKey = (i)=>PRIO_ORDER[i];

  const setFill = (valOrIdx)=>{
    const v = typeof valOrIdx==='number' ? valOrIdx : 0;
    prioRange?.style.setProperty('--fill', (v/3).toString());
  };
  const setActiveTick = (idx)=>{
    prioTicks.forEach((el,i)=>el.classList.toggle('active', i===idx));
  };
  const applyIdxCommit = (idx)=>{ // коммит: дата-атрибут, убираем превью-цвета
    const key = idxToKey(idx);
    panel.setAttribute('data-priority', key);
    panel.style.removeProperty('--accent1');
    panel.style.removeProperty('--accent2');
    setActiveTick(idx);
  };
  const applyIdxPreview = (idx)=>{ // превью: ставим временные акценты (без data-priority)
    const key = idxToKey(idx);
    const [a1,a2] = PALETTE[key];
    panel.style.setProperty('--accent1', a1);
    panel.style.setProperty('--accent2', a2);
    setActiveTick(idx);
  };

  // инициализация
  const initIdx = Math.max(0, PRIO_ORDER.indexOf(panel.getAttribute('data-priority') || 'low'));
  if (prioRange) {
    prioRange.value = String(initIdx);
    setFill(initIdx);
  }
  setActiveTick(initIdx);

  // пока тянем: обновляем заливку и ПРЕВЬЮ цветов панели (но не коммитим)
  const onInput = ()=>{
    const v = clamp(parseFloat(prioRange.value)||0, 0, 3);
    setFill(v);
    // пороги превью, чтобы цвет менялся «раньше», ещё до отпускания
    const previewIdx = (v < 0.6) ? 0 : (v < 1.6) ? 1 : (v < 2.4) ? 2 : 3;
    applyIdxPreview(previewIdx);
  };

  // отпустили: снэпим к ближайшему шагу, коммитим data-priority
  const onRelease = ()=>{
    const raw = clamp(parseFloat(prioRange.value)||0, 0, 3);
    const idx = Math.round(raw);
    prioRange.value = String(idx);
    setFill(idx);
    applyIdxCommit(idx);
  };

  prioRange?.addEventListener('input', onInput, {passive:true});
  prioRange?.addEventListener('change', onRelease);
  prioRange?.addEventListener('pointerup', onRelease);
  prioRange?.addEventListener('keyup', e=>{
    if (e.key==='Enter' || e.key===' ') onRelease();
  });

  // клики по подписям
  prioTicks.forEach((el,i)=>{
    el.addEventListener('click', ()=>{
      if (prioRange) { prioRange.value = String(i); setFill(i); }
      applyIdxCommit(i);
    });
  });
})();


  /* 8) Submit (пример) */
  createTaskBtn.onclick = () => {
    const payload = {
      title: document.getElementById('taskTitle')?.value?.trim() || '',
      room_id: document.getElementById('taskRoom')?.value || null,
      assignee_id: document.getElementById('taskAssignee')?.value || null,
      start_iso: startISO.value || null,
      due_iso: dueISO.value || null,
      priority: (prioRadios.find(r => r.checked)?.value) || prioSelect?.value || 'low',
      description: document.getElementById('taskDescription')?.innerHTML?.trim() || ''
    };
    console.log('TASK PAYLOAD →', payload);
    // fetch('/api/tasks/create', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  };
}








/* ======================= UPLOAD BATCH STATE ======================= */
let currentBatchId = null;
let uploadedFiles = [];
let batchPromise = null;
// гарантируем, что есть batch для текущей сессии загрузок
async function ensureBatch() {
  if (currentBatchId) return currentBatchId;
  // если уже создаём — подождём тот же промис
  if (batchPromise) return batchPromise;

  batchPromise = (async () => {
    const r = await fetch('task-creator-handler.php?action=start_upload_batch', { credentials: 'same-origin' });
    const j = await r.json();
    if (!j.success || !j.batch_id) throw new Error('Не удалось создать batch');
    currentBatchId = j.batch_id;
    return currentBatchId;
  })();

  try {
    return await batchPromise;
  } finally {
    // после успешного создания сбрасываем промис
    batchPromise = null;
  }
}

/* ======================= DROPDOWN ======================= */
function initDropdown(dropdownEl, items, placeholder, onChange) {
  const selectedEl = dropdownEl.querySelector('.tc-dropdown-selected');
  const listEl = dropdownEl.querySelector('.tc-dropdown-list');
  const wrap = dropdownEl.closest('.tc-inputwrap');

  // Сброс прежних слушателей на selected
  const newSelectedEl = selectedEl.cloneNode(true);
  selectedEl.parentNode.replaceChild(newSelectedEl, selectedEl);

  // Закрыть все списки в панели
  const closeAll = () => {
    document
      .querySelectorAll('#taskCreatorWrapper .tc-dropdown-list')
      .forEach(el => {
        el.style.display = 'none';
        const dd = el.closest('.tc-dropdown');
        dd?.classList.remove('is-open');
        dd?.closest('.tc-inputwrap')?.classList.remove('is-open');
      });
  };

  const isRoomDD = dropdownEl.id === 'taskRoomDropdown';

  // как рисовать пункт списка / выбранное значение
  const renderItemHTML = (item) => {
    if (isRoomDD) {
      const color = item.color || '#666';
      const label = item.name || item.label;
      return `
        <span class="dd-dot" style="background:${color}"></span>
        <span class="dd-text">${label}</span>
      `;
    } else {
      const ava = item.avatar ? `assets/avatars/${item.avatar}` : 'assets/avatars/user.png';
      const label = item.display || item.label || item.username || item.name;
      return `
        <img class="dd-ava" src="${ava}" alt="">
        <span class="dd-text">${label}</span>
      `;
    }
  };

  const setSelectedContent = (itemOrText) => {
    if (typeof itemOrText === 'string') {
      newSelectedEl.textContent = itemOrText;
      newSelectedEl.dataset.value = '';
      return;
    }
    newSelectedEl.innerHTML = renderItemHTML(itemOrText);
    newSelectedEl.dataset.value = String(itemOrText.id ?? itemOrText.value ?? '');
  };

  // Плейсхолдер
  listEl.innerHTML = '';
  if (!items || !items.length) {
    setSelectedContent(placeholder);
    return;
  }

  // Рендер списка
  const frag = document.createDocumentFragment();
  items.forEach(item => {
    const li = document.createElement('li');
    li.dataset.value = String(item.id ?? item.value);
    li.innerHTML = renderItemHTML(item);
    li.addEventListener('click', () => {
      setSelectedContent(item);
      listEl.style.display = 'none';
      dropdownEl.classList.remove('is-open');
      wrap?.classList.remove('is-open');
      if (typeof onChange === 'function') onChange(item.id ?? item.value, item);
    });
    frag.appendChild(li);
  });
  listEl.appendChild(frag);

  // Открыть/закрыть список
  newSelectedEl.addEventListener('click', () => {
    const isOpen = listEl.style.display === 'block';
    closeAll();
    listEl.style.display = isOpen ? 'none' : 'block';
    dropdownEl.classList.toggle('is-open', !isOpen);
    wrap?.classList.toggle('is-open', !isOpen);
  });

  // Клик вне — закрыть
  document.addEventListener('click', (e) => {
    if (!dropdownEl.contains(e.target)) {
      listEl.style.display = 'none';
      dropdownEl.classList.remove('is-open');
      wrap?.classList.remove('is-open');
    }
  });
}

/* ======================= META WIRING ======================= */
async function wireTaskMeta(panelEl) {
  const roomDropdown = panelEl.querySelector('#taskRoomDropdown');
  const userDropdown = panelEl.querySelector('#taskAssigneeDropdown');
  if (!roomDropdown || !userDropdown) return;

  // 1) Комнаты текущего пользователя
  let rooms = [];
  try {
    const r = await fetch('task-creator-handler.php?action=rooms_for_me', { credentials: 'same-origin' });
    const j = await r.json();
    rooms = j.rooms || [];
  } catch (e) {
    console.warn('rooms_for_me failed', e);
  }

  const roomItems = rooms.map(r => ({ id: r.id, name: r.name, color: r.color }));

  // При выборе комнаты — грузим исполнителей и сбрасываем выбранного
  initDropdown(roomDropdown, roomItems, 'Выберите комнату', (roomId) => {
    loadAssignees(roomId);
  });

  // Если одна комната — сразу её показываем красиво и грузим пользователей
  if (rooms.length === 1) {
    const item = { id: rooms[0].id, name: rooms[0].name, color: rooms[0].color };
    const sel = roomDropdown.querySelector('.tc-dropdown-selected');
    sel.innerHTML = `
      <span class="dd-dot" style="background:${item.color || '#666'}"></span>
      <span class="dd-text">${item.name}</span>
    `;
    sel.dataset.value = String(item.id);
    loadAssignees(item.id);
  } else {
    // при первом показе — чистим исполнителей
    initDropdown(userDropdown, [], 'Выберите исполнителя');
  }

  // 2) Загрузка исполнителей выбранной комнаты
  async function loadAssignees(roomId) {
    initDropdown(userDropdown, [], 'Выберите исполнителя'); // мгновенный сброс

    let users = [];
    try {
      const r = await fetch(
        'task-creator-handler.php?action=users_in_room&room_id=' + encodeURIComponent(roomId),
        { credentials: 'same-origin' }
      );
      const j = await r.json();
      users = j.users || [];
    } catch (e) {
      console.warn('users_in_room failed', e);
    }

    const userItems = users.map(u => ({
      id: u.id,
      display: u.true_name?.trim() ? `${u.true_name} (${u.username})` : u.username,
      avatar: u.avatar || null,
      username: u.username
    }));
    initDropdown(userDropdown, userItems, 'Выберите исполнителя');
  }
}

// перехватываем initTaskCreator, чтобы после него заполнять дропдауны
(function attachMetaHook() {
  const origInit = window.initTaskCreator || (async () => {});
  window.initTaskCreator = async function () {
    const res = await origInit.apply(this, arguments);
    const panel = document.querySelector('#taskCreatorWrapper .tc-panel') 
               || document.querySelector('.tc-panel'); // на всякий случай
    if (panel) {
      wireTaskMeta(panel);        // комнаты/исполнители
      bindFileUploads(panel);
     
    }
    return res;
  };
})();

/* ======================= FILE DROP / UPLOAD ======================= */
/* ======================= FILE DROP / UPLOAD (bind per panel) ======================= */

// вызывать при каждом открытии панели
function bindFileUploads(panelEl) {
  // отцепим старое (если панель реюзается)
  const oldZone = panelEl.querySelector('#fileDropZone');
  const oldInput = panelEl.querySelector('#fileInput');

  if (!oldZone || !oldInput) return;

  // клонированием убираем старые слушатели
  const newZone  = oldZone.cloneNode(true);
  const newInput = oldInput.cloneNode(true);
  oldZone.parentNode.replaceChild(newZone, oldZone);
  oldInput.parentNode.replaceChild(newInput, oldInput);

  const list = panelEl.querySelector('#uploadedFiles');

  // клик по зоне -> открыть файловый диалог
  newZone.addEventListener('click', () => newInput.click());

  // выбор файлов через диалог
  newInput.addEventListener('change', (e) => {
    [...e.target.files].forEach(file => uploadFile(file, list));
    newInput.value = '';
  });

  // drag-n-drop
  newZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    newZone.classList.add('dragover');
  });
  newZone.addEventListener('dragleave', () => {
    newZone.classList.remove('dragover');
  });
  newZone.addEventListener('drop', (e) => {
    e.preventDefault();
    newZone.classList.remove('dragover');
    [...e.dataTransfer.files].forEach(file => uploadFile(file, list));
  });

  // кнопка "Создать задачу" — биндим тут, чтобы точно была в DOM
  const btn = panelEl.querySelector('#createTaskBtn');
  if (btn) {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async () => {
      newBtn.disabled = true;
      try {
        const title = panelEl.querySelector('#taskTitle').value.trim();
        const desc  = panelEl.querySelector('#taskDescription').innerHTML.trim();

        const roomSel = panelEl.querySelector('#taskRoomDropdown .tc-dropdown-selected');
        const userSel = panelEl.querySelector('#taskAssigneeDropdown .tc-dropdown-selected');

        const roomId     = Number(roomSel?.dataset.value || 0);
        const assigneeId = Number(userSel?.dataset.value || 0);

        const prioEl = panelEl.querySelector('#prioRange');
const priority = Math.max(0, Math.min(3, Math.round(parseFloat(prioEl?.value || '1'))));

        const startAt  = panelEl.querySelector('#taskStart').value || '';
        const dueAt    = panelEl.querySelector('#taskDue').value || '';

        if (!title) return alert('Заполни заголовок');
        if (!roomId) return alert('Выбери комнату');

        if (uploadedFiles.length) await ensureBatch();

        const fd = new FormData();
        fd.append('title', title);
        fd.append('description', desc);
        fd.append('room_id', roomId);
        if (assigneeId) fd.append('assignee_id', assigneeId);
        fd.append('priority', priority);
        if (startAt) fd.append('start_at', startAt);
        if (dueAt)   fd.append('due_at',   dueAt);
        if (currentBatchId) fd.append('batch_id', currentBatchId);

        const res = await fetch('task-creator-handler.php?action=create_task', {
          method: 'POST',
          body: fd,
          credentials: 'same-origin'
        });
        const j = await res.json();

        if (!j.success) {
          alert('Ошибка: ' + (j.error || 'create_task'));
          return;
        }

        // успех — очистка локального состояния формы/списка файлов
        currentBatchId = null;
        batchPromise = null;
        uploadedFiles = [];
        if (list) list.innerHTML = '';
        panelEl.querySelector('#taskTitle').value = '';
        panelEl.querySelector('#taskDescription').innerHTML = '';

        await showTaskSuccess(panelEl);
      } catch (e) {
        console.warn(e);
        alert('Не удалось создать задачу');
      } finally {
        newBtn.disabled = false;
      }
    });
  }
}




async function showTaskSuccess(panelEl) {
  const body    = panelEl.querySelector('.tc-body');
  const footer  = panelEl.querySelector('.tc-footer');
  const success = panelEl.querySelector('#taskSuccess');
  if (!success) { closeTaskCreator(); return; }

  // плавно скрываем тело
  body.classList.add('is-hiding');
  await new Promise(r => setTimeout(r, 260)); // ждём анимацию
  body.setAttribute('hidden', '');
  if (footer) footer.setAttribute('hidden', '');

  // показываем успех
  success.removeAttribute('hidden');

  // 2 секунды — и закрываем панель
  await new Promise(r => setTimeout(r, 2000));
  closeTaskCreator();

  // сброс состояния для следующего открытия
  success.setAttribute('hidden', '');
  body.removeAttribute('hidden');
  body.classList.remove('is-hiding');
  if (footer) footer.removeAttribute('hidden');
}









// аплоад одного файла (вызывается bindFileUploads → uploadFile)
async function uploadFile(file, listEl) {
  try {
    const batchId = await ensureBatch();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('batch_id', batchId);

    const res = await fetch('task-creator-handler.php?action=upload_file', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    });
    const data = await res.json();

    if (data.success) {
      uploadedFiles.push(data.file);
      if (listEl) {
        const li = document.createElement('li');
        li.textContent = data.file.name;
        listEl.appendChild(li);
      }
    } else {
      alert('Ошибка: ' + (data.error || 'upload_file'));
    }
  } catch (e) {
    console.warn(e);
    alert('Не удалось загрузить файл');
  }
}

