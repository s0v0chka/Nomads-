function humanFileSize(size) {
    if (size < 1024) return size + ' B';
    if (size < 1048576) return (size / 1024).toFixed(1) + ' KB';
    return (size / 1048576).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    return $('<div>').text(text).html();
}


function renderTelega(tg){
  if (!tg) return '';
  tg = String(tg).trim();
  if (!tg) return '';
  const nick = tg[0] === '@' ? tg.slice(1) : tg;
  return ` <a class="tg_btm" href="https://t.me/${encodeURIComponent(nick)}" target="_blank" rel="noopener noreferrer">@${escapeHtml(nick)}</a>`;
}

function loadTaskComments(taskId) {
  const me = window.CURRENT_USER_ID || 0; // поставь при логине
  $.getJSON('task_viewer_comments_handler.php', { method: 'get', task_id: taskId }, function (data) {
    if (!data.success) return;
    const wrap = $('#tv-comments');
    wrap.empty();

    data.comments.forEach(c => {
      const filesHtml = (c.files && c.files.length)
        ? '<ul class="comment-files">' + c.files.map(f => `
            <li>
              <a href="tv_cfile.php?c=${c.id}&f=${f.id}" download>${escapeHtml(f.orig_name)}</a>
              (${humanFileSize(f.size)})
            </li>
          `).join('') + '</ul>'
        : '';

      const mineClass = (me && c.user_id && Number(c.user_id) === Number(me)) ? ' tv-comment--mine' : '';

      $('#tv-comments').append(`
        <div class="tv-comment${mineClass}" role="listitem" data-cid="${c.id}">
          <div class="author">
            <img src="${c.avatar || 'assets/avatars/user.png'}" class="ava" alt="">
            <span class="name">
  ${escapeHtml(c.username)}${renderTelega(c.telega)}
</span>
            <time datetime="${escapeHtml(c.created_at_iso || c.created_at_utc)}">${escapeHtml(c.created_at_utc)}</time>
          </div>
          <div class="body">${escapeHtml(c.body)}</div>
          ${filesHtml}
        </div>
      `);
    });
  });
}


function submitViewerComment(taskId) {
    const $form = $('#tvAddComment');
    const formData = new FormData($form[0]);
    formData.append('method', 'add');
    formData.append('task_id', taskId);

    $.ajax({
        url: 'task_viewer_comments_handler.php',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function (res) {
            if (res && res.success) {
                $form[0].reset();
                loadTaskComments(taskId);
                const box = document.querySelector('#tv-comments');
                if (box) box.scrollTop = box.scrollHeight;
            } else {
                console.error(res?.error || 'add failed');
            }
        },
        error: function (xhr) {
            console.error('AJAX error:', xhr.responseText);
        }
    });
}
