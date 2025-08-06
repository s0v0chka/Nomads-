<?php /* форма-панель создания/редактирования задачи */ ?>
<div class="task-editor">

  <div class="task-editor__header">
    <input id="taskTitle" type="text" class="task-title"
           placeholder="Введите название задачи">
    <button class="task-editor__close" onclick="closeTaskCreator()">&times;</button>
  </div>

  <div class="task-meta">

<div class="meta-row">
  <span class="meta-label">Комната</span>
  <select id="taskRoom" class="meta-control custom-select"></select>
</div>


<div class="meta-row">
  <span class="meta-label">Исполнитель</span>
  <select id="taskAssignee" class="meta-control custom-select"></select>
</div>
<input id="taskStart" type="hidden">
<input id="taskDue"   type="hidden">

<div class="meta-row">
  <span class="meta-label">Сроки</span>

  <!-- видимая «строка» -->
  <button id="dateDisplay" type="button" class="date-display">
    <i class="far fa-calendar-alt"></i>
    <span id="dateDisplayText">Нет срока</span>
  </button>
</div>





  </div>

  <label class="meta-label" style="margin-top:18px">Описание</label>
  <div id="taskDescription" class="task-desc" contenteditable="true"
       data-placeholder="Расскажите, что нужно сделать…"></div>

  <button id="createTaskBtn" class="task-save-btn">
    <i class="fas fa-check"></i> Создать задачу
  </button>

</div>
