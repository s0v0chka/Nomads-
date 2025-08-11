<?php /** @var array $view */ ?>



  <aside id="taskViewerPanel"
         class="tv-panel tv-panel--right tv-flat"
         role="dialog" aria-modal="true"
         aria-labelledby="tvTitle"
         data-priority="<?= htmlspecialchars($view['priority']) ?>"
         data-task-id="<?= (int)$view['id'] ?>">

    <!-- HEADER -->
    <header class="tv-header">
      <div class="tv-titlewrap">
        <i class="fas fa-clipboard-check tv-titleicon" aria-hidden="true"></i>
        <div class="tv-titleblock">
          <h2 id="tvTitle" class="tv-title"><?= htmlspecialchars($view['title']) ?></h2>

          <!-- Чипы: статус / приоритет / проект / дедлайн -->
          <div class="tv-summary">
            <span class="tv-badge <?= htmlspecialchars($view['status_class']) ?>">
              <?= htmlspecialchars($view['status_text']) ?>
            </span>
            <span class="tv-stat">
              <i class="prio-dot prio-<?= htmlspecialchars($view['priority']) ?>" aria-hidden="true"></i>
              <?= htmlspecialchars($view['priority_text']) ?>
            </span>
            <span class="tv-chip tv-chip--room" style="--room-color:<?= htmlspecialchars($view['room_color']) ?>">
              <i class="room-dot" aria-hidden="true"></i><?= htmlspecialchars($view['room_name']) ?>
            </span>
        
          </div>
        </div>
      </div>

      <button class="tv-close" type="button" aria-label="Закрыть" onclick="closeTaskViewer()">&times;</button>
    </header>

    <!-- Мета-строка без дублей -->
    <div class="tv-metabar">
      <span class="meta">#<?= (int)$view['id'] ?></span>
      <span class="dotsep"></span><span class="meta">Создана <?= htmlspecialchars($view['created']) ?></span>
      <span class="dotsep"></span><span class="meta">Обновлена <?= htmlspecialchars($view['updated']) ?></span>
    </div>

    <!-- BODY: ОДИН СТОЛБЕЦ -->
    <section class="tv-body">
      <div class="tv-layout tv-layout--onecol">

        <!-- Строки как в белой форме -->
        <section class="tv-section">
          <dl class="tv-rows">
            <dt>Assignee</dt>
            <dd>
              <?php if (!empty($view['assignee_id'])): ?>
                <span class="assignee">
                  <?php if (!empty($view['assignee_ava'])): ?>
                    <img class="assignee-ava" src="<?= htmlspecialchars($view['assignee_ava']) ?>" alt="<?= htmlspecialchars($view['assignee_name']) ?>" loading="lazy">
                  <?php else: ?>
                    <span class="assignee-ava gen"><?= htmlspecialchars(mb_strtoupper(mb_substr($view['assignee_name'] ?? '—', 0, 1))) ?></span>
                  <?php endif; ?>
                  <span class="name"><?= htmlspecialchars($view['assignee_name'] ?? '—') ?></span>
                </span>
              <?php else: ?><span class="tv-muted">—</span><?php endif; ?>
            </dd>

            <dt>Due date</dt>
            <dd>
              <span class="tv-pill <?= !empty($view['due_overdue']) ? 'is-overdue' : '' ?>">
                <i class="far fa-calendar-alt" aria-hidden="true"></i>
                <?= htmlspecialchars($view['due'] ?: '—') ?>
              </span>
            </dd>

            <dt>Projects</dt>
            <dd>
              <?php if (!empty($view['projects']) && is_array($view['projects'])): ?>
                <ul class="tv-tags">
                  <?php foreach ($view['projects'] as $p): ?>
                    <li class="tv-tag">
                      <span class="dot" style="--room-color:<?= htmlspecialchars($p['color'] ?? '#7aa5ff') ?>"></span>
                      <?= htmlspecialchars($p['name']) ?>
                    </li>
                  <?php endforeach; ?>
                </ul>
              <?php else: ?>
                <span class="tv-tag" style="--room-color:<?= htmlspecialchars($view['room_color']) ?>">
                  <span class="dot"></span><?= htmlspecialchars($view['room_name']) ?>
                </span>
              <?php endif; ?>
            </dd>
          </dl>
        </section>

        <!-- Описание -->
        <section class="tv-section">
          <h3 class="tv-section-title">Описание</h3>
          <div class="tv-box">
            <?php if (!empty($view['description_html'])): ?>
              <div class="tv-prose"><?= $view['description_html'] ?></div>
            <?php elseif (!empty($view['description'])): ?>
              <div class="tv-plaintext"><?= nl2br(htmlspecialchars($view['description'])) ?></div>
            <?php else: ?>
              <span class="tv-muted">Нет описания</span>
            <?php endif; ?>
          </div>
        </section>

        <!-- Файлы -->
        <?php if (!empty($view['files'])): ?>
          <section class="tv-section">
            <h3 class="tv-section-title">Файлы</h3>
            <ul class="tv-filelist">
              <?php foreach ($view['files'] as $f): ?>
                <li>
  <i class="far fa-file" aria-hidden="true"></i>
  <a href="<?= e($f['url']) ?>" class="name" download><?= e($f['name']) ?></a>
  <?php if (!empty($f['sizeLabel'])): ?><span class="size"><?= e($f['sizeLabel']) ?></span><?php endif; ?>
</li>
              <?php endforeach; ?>
            </ul>
          </section>
        <?php endif; ?>

        <!-- Отступ под композер -->
        <div class="tv-bottompad" aria-hidden="true"></div>
      </div>

<section class="tv-section">
  <h3 class="tv-section-title dz">Комментарии</h3>
  <div id="tv-comments" class="tv-comments-list" role="list"></div>
</section>
 
    </section>

    <!-- Кнопка внизу оставил, но без дублей информации -->
    <footer class="tv-footer">
             <div class="tv-composer">
<form id="tvAddComment" class="tv-composer-form" onsubmit="return false" data-prevent-viewer="1">
  <div id="tvDropZone" class="tv-dropzone">
    <textarea name="body" class="tv-composer-input" placeholder="Add a comment"></textarea>

    <!-- панель действий справа -->
    <div class="tv-composer-actions">
      <input id="tvComposerFiles" type="file" name="files[]" multiple hidden>
      <button type="button" class="tv-attach" title="Прикрепить файлы" data-prevent-viewer="1">
        <img src="assets/system_images/add.png" alt="">
      </button>

      <button class="tv-send" type="button" data-prevent-viewer="1"
              onclick="typeof submitViewerComment==='function' && submitViewerComment(<?= (int)$view['id'] ?>)">
        Отправить
      </button>
    </div>
  </div>

  <!-- предпросмотр прикреплений -->
  <div id="tvComposerPreview" class="tv-composer-preview" hidden></div>
</form>
      </div>
    
    </footer>
  </aside>

