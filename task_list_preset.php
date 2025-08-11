<!-- task_list_preset.php -->
<div class="tasklist-wrap" id="tasklistWrap" aria-live="polite">
  <!-- Верхняя панель -->
  <div class="tasklist-filters">
            <div class="tl-left">
            <strong class="tl-room-label">Все мои комнаты</strong>
            <button class="tl-clear-room" type="button" title="Сбросить фильтр" aria-label="Сбросить" hidden>×</button>
            <span class="tl-chip tl-chip--search" hidden></span>
            <span class="tl-chip tl-chip--assignee" hidden></span>
            <span class="tl-chip tl-chip--priority" hidden></span>
            </div>
                <div class="tl-right"></div>
  </div>

  <!-- НЕ НАЧАТЫ -->
  <section class="tasklist-section" data-status="new">
    <header class="tls-head">
      <button class="tls-toggle" type="button" aria-label="Свернуть/развернуть"></button>
      <span class="tls-badge badge--blue">НЕ НАЧАТЫ</span>
      <span class="tls-count">0</span>
    </header>
    <div class="tls-table">
      <div class="tls-row tls-row--head">
        <div class="tls-col tls-col--check"><span class="tl-col-label">Готово</span></div>
        <div class="tls-col tls-col--title">ЗАДАЧА</div>
        <div class="tls-col tls-col--assignee">ИСПОЛНИТЕЛЬ</div>
        <div class="tls-col tls-col--priority">ПРИОРИТЕТ</div>
        <div class="tls-col tls-col--deadline">ДЕДЛАЙН</div>
        <div class="tls-col tls-col--status">СТАТУС</div>
      </div>
      <div class="tls-body" data-body="new"></div>
    </div>
    <footer class="tls-foot">
      <button class="tl-add-btn" type="button">+ Новая задача</button>
    </footer>
  </section>

  <!-- В РАБОТЕ -->
  <section class="tasklist-section" data-status="in_progress">
    <header class="tls-head">
      <button class="tls-toggle" type="button" aria-label="Свернуть/развернуть"></button>
      <span class="tls-badge badge--green">В РАБОТЕ</span>
      <span class="tls-count">0</span>
    </header>
    <div class="tls-table">
      <div class="tls-row tls-row--head">
        <div class="tls-col tls-col--check"><span class="tl-col-label">Готово</span></div>
        <div class="tls-col tls-col--title">ЗАДАЧА</div>
        <div class="tls-col tls-col--assignee">ИСПОЛНИТЕЛЬ</div>
        <div class="tls-col tls-col--priority">ПРИОРИТЕТ</div>
        <div class="tls-col tls-col--deadline">ДЕДЛАЙН</div>
        <div class="tls-col tls-col--status">СТАТУС</div>
      </div>
      <div class="tls-body" data-body="in_progress"></div>
    </div>
    <footer class="tls-foot">
      <button class="tl-add-btn" type="button">+ Новая задача</button>
    </footer>
  </section>

  <!-- НА ПРОВЕРКЕ -->
  <section class="tasklist-section" data-status="done">
    <header class="tls-head">
      <button class="tls-toggle" type="button" aria-label="Свернуть/развернуть"></button>
      <span class="tls-badge badge--yellow">НА ПРОВЕРКЕ</span>
      <span class="tls-count">0</span>
    </header>
    <div class="tls-table">
      <div class="tls-row tls-row--head">
        <div class="tls-col tls-col--check"><span class="tl-col-label">Готово</span></div>
        <div class="tls-col tls-col--title">ЗАДАЧА</div>
        <div class="tls-col tls-col--assignee">ИСПОЛНИТЕЛЬ</div>
        <div class="tls-col tls-col--priority">ПРИОРИТЕТ</div>
        <div class="tls-col tls-col--deadline">ДЕДЛАЙН</div>
        <div class="tls-col tls-col--status">СТАТУС</div>
      </div>
      <div class="tls-body" data-body="done"></div>
    </div>
    <footer class="tls-foot">
      <button class="tl-add-btn" type="button">+ Новая задача</button>
    </footer>
  </section>

  <!-- АРХИВ -->
  <section class="tasklist-section" data-status="archived">
    <header class="tls-head">
      <button class="tls-toggle" type="button" aria-label="Свернуть/развернуть"></button>
      <span class="tls-badge badge--gray">АРХИВ</span>
      <span class="tls-count">0</span>
    </header>
    <div class="tls-table">
      <div class="tls-row tls-row--head">
        <div class="tls-col tls-col--check"><span class="tl-col-label">Готово</span></div>
        <div class="tls-col tls-col--title">ЗАДАЧА</div>
        <div class="tls-col tls-col--assignee">ИСПОЛНИТЕЛЬ</div>
        <div class="tls-col tls-col--priority">ПРИОРИТЕТ</div>
        <div class="tls-col tls-col--deadline">ДЕДЛАЙН</div>
        <div class="tls-col tls-col--status">СТАТУС</div>
      </div>
      <div class="tls-body" data-body="archived"></div>
    </div>
    <footer class="tls-foot">
      <button class="tl-add-btn" type="button">+ Новая задача</button>
    </footer>
  </section>
</div>
