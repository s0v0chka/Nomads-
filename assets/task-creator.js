/* Кнопка «+ Добавить задачу» уже есть в топбаре */
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
      pane.classList.add('task-slide-in');
      initTaskCreator();
    });
});

function closeTaskCreator () {
  const p = document.getElementById('taskCreatorWrapper');
  if (p) p.classList.remove('task-slide-in');
}
async function initTaskCreator() {
  /* ===== 1. flatpickr + RU ===== */
  if (typeof flatpickr === 'undefined') {
    const [
      { default: fpCore },
      rangeMod,
      _ru
    ] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js'),
      import('https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/plugins/rangePlugin.js?module'),
      import('https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/ru.js')
    ]);
    window.flatpickr = fpCore;
    window.rangePlugin = rangeMod.rangePlugin;
    fpCore.localize(flatpickr.l10ns.ru);
  }

  /* ===== 2. helper подписи ===== */
  const MONTH = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nice = d => {
    const diff = (d - today) / 864e5 | 0;
    if (diff === 0) return { s: 'Сегодня', c: 'due-today' };
    if (diff === 1) return { s: 'Завтра', c: 'due-range' };
    if (diff === -1) return { s: 'Вчера', c: 'due-past' };
    return { s: `${d.getDate()} ${MONTH[d.getMonth()]}`, c: 'due-range' };
  };

  /* ===== 3. DOM ===== */
  const startISO = document.getElementById('taskStart');
  const dueISO = document.getElementById('taskDue');
  const dispBtn = document.getElementById('dateDisplay');
  const dispTxt = document.getElementById('dateDisplayText');

  /* якорный input (невидимый) */
  const anchor = document.createElement('input');
  anchor.type = 'text';
  anchor.className = 'fp-anchor';
  dispBtn.after(anchor);

  /* ===== 4. состояние ===== */
  let startDate = null,
    dueDate = null,
    activeTab = 'due'; // 'start' | 'due'

  /* ===== 5. flatpickr ===== */
  const picker = flatpickr(anchor, {
    locale: 'ru',
    altInput: true,
    altFormat: '',
    disableMobile: true,
    plugins: [rangePlugin({ input: '#taskStart' })],
    mode: 'single',

    /* кастом-header */
    onReady(_sel, _str, inst) {
      const head = document.createElement('div');
      head.className = 'fp-header';

      const btnStart = document.createElement('button');
      btnStart.className = 'fp-tab';
      btnStart.textContent = '+ Start date';

      const btnDue = document.createElement('button');
      btnDue.className = 'fp-tab active';
      btnDue.textContent = 'Due date';

      // Створюємо кнопку очищення
      const clearBtn = document.createElement('button');
      clearBtn.className = 'fp-clear-btn';
      clearBtn.innerHTML = '&times;';
      clearBtn.title = 'Очистити дати';
      clearBtn.style.display = 'none'; // Спочатку прихована

      head.append(btnStart, btnDue);
      inst.calendarContainer.prepend(head);
      inst.calendarContainer.appendChild(clearBtn); // Додаємо кнопку в контейнер календаря

      // Обробник кліку для кнопки очищення
      clearBtn.addEventListener('click', () => {
        startDate = null;
        dueDate = null;
        startISO.value = '';
        dueISO.value = '';
        updateDateDisplay();
        picker.clear();
      });

      btnStart.onclick = () => {
        if (activeTab === 'start') return;
        activeTab = 'start';
        btnStart.classList.add('active');
        btnDue.classList.remove('active');
        picker.clear();
      };

      btnDue.onclick = () => {
        if (activeTab === 'due') return;
        activeTab = 'due';
        btnDue.classList.add('active');
        btnStart.classList.remove('active');
      };
    },

    onOpen: () => {
      dispBtn.classList.add('active');
      const clearBtn = document.querySelector('.fp-clear-btn');
      if (clearBtn) clearBtn.style.display = 'flex';
      // При открытии всегда активен due date
      if (activeTab === 'start') {
        document.querySelector('.fp-header .fp-tab:last-child').click();
      }
    },

    onClose: () => {
      dispBtn.classList.remove('active');
      const clearBtn = document.querySelector('.fp-clear-btn');
      if (clearBtn) clearBtn.style.display = 'none';
    },

    /* выбор даты */
    onChange(sel, dateStr, inst) {
      if (!sel.length) return; // клик «Clear»

      const selectedDate = sel[0];

      if (activeTab === 'start') {
        // Сохраняем start date
        startDate = selectedDate;
        startISO.value = startDate.toISOString().slice(0, 10);

        // Визуально переключаемся на due date
        activeTab = 'due';
        const btnDue = document.querySelector('.fp-header .fp-tab:last-child');
        if (btnDue) {
          btnDue.classList.add('active');
          document.querySelector('.fp-header .fp-tab:first-child').classList.remove('active');
        }

        // Обновляем отображение
        updateDateDisplay();

        // Очищаем выбор в календаре
        setTimeout(() => {
          inst.clear();
          inst.setDate(null);
        }, 0);
      }
      else if (activeTab === 'due') {
        // Сохраняем due date
        dueDate = selectedDate;
        dueISO.value = dueDate.toISOString().slice(0, 10);

        // Если есть start date - закрываем календарь
        if (startDate) {
          // Корректируем порядок дат если нужно
          if (startDate > dueDate) {
            [startDate, dueDate] = [dueDate, startDate];
            startISO.value = startDate.toISOString().slice(0, 10);
            dueISO.value = dueDate.toISOString().slice(0, 10);
          }
          picker.close();
        }

        updateDateDisplay();
      }
    }
  });

  function updateDateDisplay() {
    dispTxt.className = '';

    if (dueDate && !startDate) {
      // Только due date
      const p = nice(dueDate);
      dispTxt.textContent = p.s;
      dispTxt.classList.add(p.c);
    }
    else if (startDate && dueDate) {
      // Диапазон дат
      dispTxt.textContent = `${nice(startDate).s} – ${nice(dueDate).s}`;
      dispTxt.classList.add('due-range');
    }
    else if (startDate && !dueDate) {
      // Только start date (временное состояние)
      const p = nice(startDate);
      dispTxt.textContent = p.s;
      dispTxt.classList.add(p.c);
    }
    else {
      // Нет дат
      dispTxt.textContent = 'Нет срока';
    }
  }

  /* открытие календаря */
  dispBtn.onclick = () => {
    // Сбрасываем в due date при открытии
    if (activeTab === 'start') {
      document.querySelector('.fp-header .fp-tab:last-child').click();
    }
    picker.open();
  };

  /* ===== 6. пример submit ===== */
  createTaskBtn.onclick = () => {
    console.log('ISO start', startISO.value, 'ISO due', dueISO.value);
    /* здесь отправка на сервер */
  };
}
