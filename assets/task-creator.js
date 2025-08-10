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



