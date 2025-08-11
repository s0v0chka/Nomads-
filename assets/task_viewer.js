// task_viewer.js (tv-namespace)
(function () {
  const WRAP_ID = 'taskViewerWrapper';

  window.openTaskViewer = openTaskViewer;
  window.closeTaskViewer = closeTaskViewer;

  // Открываем viewer по клику на строку (игнорим кнопки/ссылки)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.tl-act, .tl-complete, button, a, input, select, textarea')) return;
    const row = e.target.closest('.tls-row');
    if (!row || row.classList.contains('tls-row--head') || row.classList.contains('tls-row--empty')) return;
    const id = Number(row.dataset.taskId);
    if (id > 0) openTaskViewer(id);
  });

  // ESC – закрыть
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTaskViewer();
  });

  function ensureWrapper() {
    let wrap = document.getElementById(WRAP_ID);
    if (wrap) return wrap;

    wrap = document.createElement('div');
    wrap.id = WRAP_ID;
    wrap.innerHTML = `
      <div class="tv-overlay" onclick="closeTaskViewer()"></div>
      <div id="taskViewerHost"></div>
    `;
    document.body.appendChild(wrap);
    return wrap;
  }

  async function openTaskViewer(taskId) {
    const wrap = ensureWrapper();
    const host = wrap.querySelector('#taskViewerHost');

    // skeleton (заглушка)
    host.innerHTML = `
      <aside class="tv-panel tv-panel--right" role="dialog" aria-modal="true">
        <header class="tv-header"><div class="tv-loading">Загрузка…</div></header>
        <section class="tv-body"><div class="tv-loading">Подгружаем задачу #${taskId}</div></section>
        <footer class="tv-footer"><button class="tv-ghost" type="button" onclick="closeTaskViewer()">Закрыть</button></footer>
      </aside>
    `;

    // показать слайд-ин
    requestAnimationFrame(() => wrap.classList.add('tv-open'));

    try {
      const url = 'task_viewer_handler.php?' + new URLSearchParams({ id: taskId });
const html = await fetch(url, { credentials: 'same-origin' }).then(r=>r.text());
host.innerHTML = html;

// подгружаем комментарии
const panelTask = host.querySelector('#taskViewerPanel');
const tid = Number(panelTask?.dataset.taskId || taskId);
if (tid && typeof loadTaskComments === 'function') loadTaskComments(tid);

// инициализируем новый композер
setupTvComposer(host);

// фокус в панель
const panel = host.querySelector('.tv-panel');
panel?.focus?.();

// прокрутка тела вверх
host.querySelector('.tv-body')?.scrollTo({ top: 0 });

    } catch (err) {
      host.innerHTML = `
        <aside class="tv-panel tv-panel--right" role="dialog" aria-modal="true">
          <header class="tv-header">
            <button class="tv-close" type="button" onclick="closeTaskViewer()" aria-label="Закрыть">&times;</button>
            <strong>Ошибка</strong>
          </header>
          <section class="tv-body"><div class="tv-loading">Не удалось загрузить задачу</div></section>
          <footer class="tv-footer"><button class="tv-ghost" type="button" onclick="closeTaskViewer()">Закрыть</button></footer>
        </aside>
      `;
      console.warn(err);
    }
  }

  function closeTaskViewer() {
    const wrap = document.getElementById(WRAP_ID);
    if (!wrap) return;
    wrap.classList.remove('tv-open');
    setTimeout(() => wrap.remove(), 450); // дождаться анимации
  }
})();








function setupTvComposer(host){
  const drop = host.querySelector('#tvDropZone');
  const input = host.querySelector('#tvComposerFiles');
  const attachBtn = host.querySelector('.tv-attach');
  const preview = host.querySelector('#tvComposerPreview');
  if (!drop || !input || !attachBtn || !preview) return;

  // локальный список файлов (чтобы можно было удалять)
  let files = [];

  const refreshPreview = () => {
    if (!files.length){ preview.hidden = true; preview.innerHTML = ''; return; }
    preview.hidden = false;
    preview.innerHTML = files.map((f, i) => `
      <span class="tv-chipfile" data-i="${i}">
        <i class="far fa-file"></i>
        ${f.name} <small>(${(f.size/1024).toFixed(1)} KB)</small>
        <button type="button" class="rm" title="Убрать">×</button>
      </span>
    `).join('');
  };

  const syncToInput = () => {
    const dt = new DataTransfer();
    files.forEach(f => dt.items.add(f));
    input.files = dt.files;
  };

  const addFiles = (list) => {
    // можешь добавить фильтры по типу/размеру тут
    for (const f of list){ files.push(f); }
    refreshPreview();
    syncToInput();
  };

  // скрепочка -> открыть выбор
  attachBtn.addEventListener('click', () => input.click());

  // выбор через диалог
  input.addEventListener('change', (e) => {
    if (input.files?.length) addFiles(input.files);
    // input.files уже синхронизируем через DataTransfer, так что очищать не надо
  });

  // удалить один файл из предпросмотра
  preview.addEventListener('click', (e) => {
    const btn = e.target.closest('.rm');
    if (!btn) return;
    const chip = btn.closest('.tv-chipfile');
    const idx = Number(chip?.dataset.i);
    if (idx >= 0){
      files.splice(idx, 1);
      refreshPreview();
      syncToInput();
    }
  });

  // drag & drop
  ['dragenter','dragover'].forEach(ev =>
    drop.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); drop.classList.add('is-dragover'); })
  );
  ['dragleave','dragend'].forEach(ev =>
    drop.addEventListener(ev, (e)=>{ e.preventDefault(); e.stopPropagation(); drop.classList.remove('is-dragover'); })
  );
  drop.addEventListener('drop', (e)=>{
    e.preventDefault(); e.stopPropagation(); drop.classList.remove('is-dragover');
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });
  drop.addEventListener('tv-composer-reset', () => {
  files = [];
  refreshPreview();
  syncToInput();
});
}