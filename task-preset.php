<?php ?>
   

<aside class="tc-panel tc-panel--right" role="dialog" aria-modal="true" aria-labelledby="taskEditorTitle" data-priority="normal">
  <!-- HEADER -->
  <header class="tc-header">
    <button class="tc-close" type="button" aria-label="Закрыть" onclick="closeTaskCreator()">&times;</button>
    <div class="tc-titlewrap">
      <i class="fas fa-rocket tc-titleicon" aria-hidden="true"></i>
      <input id="taskTitle" type="text" class="tc-input tc-title" placeholder="Введите название задачи" />
    </div>
  </header>


  <section class="forscroll">
<div id="taskSuccess" class="success-animation" hidden aria-live="polite">
  <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
    <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
    <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
  </svg>
  <p>Задача успешно поставлена!</p>
</div>
  <section class="tc-body">
    <!-- ISO даты для JS -->
    <input id="taskStart" type="hidden" />
    <input id="taskDue"   type="hidden" />

    <div class="tc-grid">
      <label class="tc-field">
        <span class="tc-label">Комната</span>
        <div class="tc-inputwrap">
          <div class="tc-inputwrap tc-inputwrap--dd">
  <div class="tc-dropdown" id="taskRoomDropdown">
    <div class="tc-dropdown-selected" data-value="">Выберите комнату</div>
    <ul class="tc-dropdown-list"></ul>
  </div>
</div>
        </div>
      </label>

      <label class="tc-field">
        <span class="tc-label">Исполнитель</span>
        <div class="tc-inputwrap">
         <div class="tc-inputwrap tc-inputwrap--dd">
  <div class="tc-dropdown" id="taskAssigneeDropdown">
    <div class="tc-dropdown-selected" data-value="">Выберите исполнителя</div>
    <ul class="tc-dropdown-list"></ul>
  </div>
</div>
        </div>
      </label>

      <label class="tc-field tc-field--full">
        <span class="tc-label">Сроки</span>
        <button id="dateDisplay" type="button" class="date-display tc-input tc-datebtn">
          <i class="far fa-calendar-alt" aria-hidden="true"></i>
          <span id="dateDisplayText">Нет срока</span>
        </button>
      </label>

      <!-- ПРИОРИТЕТ (только сегмент, без дублирующего select) -->
      <fieldset class="tc-field tc-field--full">
        <legend class="tc-label">Приоритет</legend>
    

          <div class="tc-prio-slider">
  <input id="prioRange" type="range" min="0" max="3" step="0.0001" value="0" aria-label="Сменить приоритет">
  <div class="ticks" aria-hidden="true">
    <span data-val="low">Низкий</span>
    <span data-val="normal">Нормальный</span>
    <span data-val="high">Высокий</span>
    <span data-val="urgent">Очень высокий</span>
  </div>
</div>


      </fieldset>
    </div>


    
    <label class="tc-label" style="margin-top:8px">Описание</label>
    <div id="taskDescription" class="task-desc tc-desc" contenteditable="true"
         data-placeholder="Расскажите, что нужно сделать…"></div>

 <div id="fileDropZone" class="tc-file-drop">
  <p>Перетащите файлы сюда или нажмите для выбора</p>
  <input type="file" id="fileInput" multiple hidden>
</div>
<ul id="uploadedFiles"></ul>


  </section>
</section>
 
  <!-- FOOTER -->

  




<footer class="tc-footer">
  <div class="tc-primary-wrap">
    <div id="tcFire" class="tc-fire" aria-hidden="true"></div>
    <button id="createTaskBtn" class="task-save-btn tc-primary" type="button">
      <i class="fas fa-check" aria-hidden="true"></i> Создать задачу
    </button>
  </div>

  <button class="tc-ghost" type="button" onclick="closeTaskCreator()">Отмена</button>
</footer>
</aside>
