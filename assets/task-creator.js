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
async function initTaskCreator () {

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
    window.flatpickr   = fpCore;
    window.rangePlugin = rangeMod.rangePlugin;           // << функция-плагин
    fpCore.localize(flatpickr.l10ns.ru);
  }

  /* ===== 2. helper подписи ===== */
  const MONTH = ['января','февраля','марта','апреля','мая','июня',
                 'июля','августа','сентября','октября','ноября','декабря'];
  const today = new Date(); today.setHours(0,0,0,0);
  const nice  = d => {
    const diff = (d - today) / 864e5 | 0;
    if (diff === 0)  return {s:'Сегодня', c:'due-today'};
    if (diff === 1)  return {s:'Завтра',  c:'due-range'};
    if (diff === -1) return {s:'Вчера',   c:'due-past'};
    return {s:`${d.getDate()} ${MONTH[d.getMonth()]}`, c:'due-range'};
  };

  /* ===== 3. DOM ===== */
  const startISO = document.getElementById('taskStart');
  const dueISO   = document.getElementById('taskDue');
  const dispBtn  = document.getElementById('dateDisplay');
  const dispTxt  = document.getElementById('dateDisplayText');

  /* якорный input (невидимый) */
  const anchor   = document.createElement('input');
  anchor.type = 'text';
  anchor.className = 'fp-anchor'; 
  dispBtn.after(anchor);

  /* ===== 4. состояние ===== */
  let startDate = null,
      dueDate   = null,
      activeTab = 'due';            // 'start' | 'due'

  /* ===== 5. flatpickr ===== */
  const picker = flatpickr(anchor, {
    locale: 'ru',
    altInput: true, altFormat: '',
    disableMobile: true,
    plugins: [ rangePlugin({ input: '#taskStart' }) ],

    /* кастом-header */
    onReady(_sel,_str,inst) {
      const head = document.createElement('div');
      head.className = 'fp-header';

      const btnStart = document.createElement('button');
      btnStart.className = 'fp-tab'; btnStart.textContent = '+ Start date';

      const btnDue   = document.createElement('button');
      btnDue.className   = 'fp-tab active'; btnDue.textContent = 'Due date';

      head.append(btnStart, btnDue);
      inst.calendarContainer.prepend(head);

      btnStart.onclick = () => {
        activeTab = 'start';
        btnStart.classList.add('active'); btnDue.classList.remove('active');
      };
      btnDue.onclick = () => {
        activeTab = 'due';
        btnDue.classList.add('active'); btnStart.classList.remove('active');
      };
    },

    onOpen  : () => dispBtn.classList.add('active'),
    onClose : () => dispBtn.classList.remove('active'),

    /* выбор даты */
    onChange(sel){
      if (!sel.length) {        // клик «Clear»
        startDate = dueDate = null;
        startISO.value = dueISO.value = '';
        dispTxt.textContent = 'Нет срока';
        dispTxt.className = '';
        return;
      }

      /* сохраняем в зависимости от активного таба */
      if (activeTab === 'due')   dueDate   = sel[0];
      if (activeTab === 'start') startDate = sel[0];

      /* если есть только due — считаем одиночной */
      if (!startDate) startDate = dueDate;
      if (startDate && dueDate && startDate > dueDate) [startDate, dueDate] = [dueDate, startDate];

      /* ISO -> hidden */
      startISO.value = startDate ? startDate.toISOString().slice(0,10) : '';
      dueISO.value   = dueDate   ? dueDate  .toISOString().slice(0,10) : '';

      /* подпись + цвет */
      dispTxt.className='';
      if (startDate.getTime() === dueDate.getTime()) {
        const p = nice(dueDate);
        dispTxt.textContent = p.s;
        dispTxt.classList.add(p.c);
      } else {
        dispTxt.textContent = `${nice(startDate).s} – ${nice(dueDate).s}`;
        dispTxt.classList.add('due-range');
      }
    }
  });

  /* открытие календаря */
  dispBtn.onclick = () => picker.open();

  /* ===== 6. пример submit ===== */
  createTaskBtn.onclick = () => {
    console.log('ISO start', startISO.value, 'ISO due', dueISO.value);
    /* здесь отправка на сервер */
  };
}
