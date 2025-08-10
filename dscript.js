$(document).ready(function () {
  // Показываем #users_manager при клике на #menusers
  
 $('#settings').on('click', function () {
    $('#viewSwitch').css('display', 'none');
    $('#stngs_sect').css('display', 'flex');
    $('#users_manager').css('display', 'none');
 });

  $('#menusers').on('click', function () {
    $('#users_manager').css('display', 'flex');
    $('#trbls_dv_id').css('display', 'flex');
    $('#viewSwitch').css('display', 'none');
    $('#stngs_sect').css('display', 'none');
    loadUsers();
  });

  // Проверка на изменение URL
  $(window).on('hashchange', function () {
    if (window.location.hash !== '#users_manager' && window.location.hash !== '#settings') {
      $('#users_manager').css('display', 'none'); // Скрываем #users_manager, если хеш не #users_manager
      $('#trbls_dv_id').css('display', 'none'); 
      $('#viewSwitch').css('display', 'flex');
      $('#stngs_sect').css('display', 'none');
    }
  });

  // Инициализируем проверку при первой загрузке
  if (window.location.hash !== '#users_manager' && window.location.hash !== '#settings') {
    $('#users_manager').css('display', 'none'); // Скрываем, если хеш не #users_manager
    $('#trbls_dv_id').css('display', 'none');
    $('#viewSwitch').css('display', 'flex');
    $('#stngs_sect').css('display', 'none');
  }
});



// Завантажуємо список користувачів
function loadUsers() {
    fetch('users-handler.php')  // Відправляємо GET запит на сервер
    .then(response => response.json())  // Очікуємо JSON-відповідь
    .then(data => {
        const tableBody = document.querySelector('#users_table tbody');  // Знаходимо таблицю для користувачів
        tableBody.innerHTML = '';  // Очищаємо таблицю перед заповненням

        if (data.success && data.users) {  // Якщо успішно отримано користувачів
            data.users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td><img src="assets/avatars/${user.avatar}" alt="Аватар користувача" style="width: 14px; height: 14px; border-radius: 50%;"></td>
                    <td>${user.telega}</td>
                    <td>${user.true_name}</td>
                    <td>${user.posada}</td>
                    <td>
             <button class="btn btn-primary" onclick="editUser(${user.id})">
  <i class="fas fa-pencil-alt"></i>
</button>
<button class="btn btn-danger" onclick="deleteUser(${user.id})">
  <i class="fas fa-trash-alt"></i>
</button>
                    </td>
                `;
                tableBody.appendChild(row);  // Додаємо кожного користувача в таблицю
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4">Немає користувачів</td></tr>';  // Якщо немає користувачів
        }
    })
    .catch(error => {
        console.error('Ошибка при загрузке пользователей:', error);
        alert('Что-то пошло не так');
    });
}

//Отримання 

fetch('setting_handler.php', {
    method: 'GET',
})
    .then(res=> res.json())
    .then(data=> {
        if (data.success && data.data) {
            document.getElementById('true_name').value = data.data.true_name || '';
            document.getElementById('telega').value = data.data.telega || '';
            document.getElementById('posada').value = data.data.posada || '';
           if (data.data.avatar) {
            document.getElementById('avatarPreview').src = 'assets/avatars/'+ data.data.avatar;
            }
        }
    })
    .catch(err => {
        console.error ('Ne rabotaet',err);
    });










// Збереження налаштування
document.querySelector("#setform_id").addEventListener("submit", function(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    formData.append('save_setings', 'true');

    fetch('setting_handler.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const messageBox = document.getElementById('createUserMessage');
        if (data.success) {
            messageBox.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
            if (data.avatar) {
                document.getElementById('avatarPreview').src = 'assets/avatars/' + data.avatar + '?=' + Date.now();
            }
        } else {
            messageBox.innerHTML = `<div class="alert alert-danger">${data.error || 'Сталася помилка при збереженні.'}</div>`;
        }
    })
    .catch(err => {
        console.error('Запит не вдався:', err);
        const messageBox = document.getElementById('createUserMessage');
        messageBox.innerHTML = `<div class="alert alert-danger">Помилка мережі. Спробуйте пізніше.</div>`;
    });
});




// Створення користувача
document.querySelector("#createUserForm").addEventListener("submit", function(event) {
    event.preventDefault();  // Запобігаємо стандартному відправленню форми

    const formData = new FormData(event.target);  // Формуємо дані форми
    formData.append('create_user', 'true')
    fetch('users-handler.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())  // Очікуємо JSON-відповідь
    .then(data => {
        console.log("Відповідь від сервера:", data);  // Логування відповіді
        if (data.success) {
            document.getElementById('createUserMessage').innerHTML = `<div class="alert alert-success">${data.message}</div>`;
            event.target.reset();
            loadUsers();  // Оновлюємо список користувачів
        } else {
            document.getElementById('createUserMessage').innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
            event.target.reset();
        }
    })
    .catch(error => {
        console.error('Помилка при відправці запиту:', error);  // Лог помилки
        document.getElementById('createUserMessage').innerHTML = `<div class="alert alert-danger">Помилка при відправці запиту: ${error}</div>`;
    });
});

// Видалення користувача
function deleteUser(id) {
    if (confirm('Ви впевнені?')) {
        fetch('users-handler.php', {
            method: 'POST',
            body: new URLSearchParams({ 'delete_user': true, 'id': id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadUsers();  // Оновлюємо список користувачів
            } else {
                alert('Помилка при видаленні користувача.');
            }
        });
    }
}

// Редагування користувача
function editUser(id) {
    const modal = document.getElementById('editUserModal');
    const usernameInput = document.getElementById('editUsername');
    const roleInput = document.getElementById('editRole');
    const passwordInput = document.getElementById('editPassword');
    const telegramInput = document.getElementById('editTelegram');
    const true_nameInput = document.getElementById('editTrueName');
    const posadaInput = document.getElementById('editPosada');

    // Отримуємо поточні дані користувача перед відкриттям модального вікна
    fetch('users-handler.php')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.users) {
            const user = data.users.find(u => u.id == id);
            if (user) {
                // Заповнюємо поля поточними значеннями
                usernameInput.value = user.username;
                roleInput.value = user.role;
                passwordInput.value = '';
                telegramInput.value = user.telega;
                true_nameInput.value = user.true_name;
                posadaInput.value = user.posada;
            }
        }
    });

    // Показати модалку
    modal.style.display = 'flex';

    // Закриття
    document.getElementById('closeModal').onclick = closeModal;
    document.getElementById('cancelUserBtn').onclick = closeModal;

    function closeModal() {
        modal.style.display = 'none';
    }

    // Обробка кнопки "Зберегти"
    document.getElementById('saveUserBtn').onclick = () => {
        const username = usernameInput.value.trim();
        const role = roleInput.value.trim();
        const password = passwordInput.value;
        const telega = telegramInput.value.trim();
        const true_name = true_nameInput.value.trim();
        const posada = posadaInput.value.trim();

        // Валідація: хоча б одне поле має бути змінене
        const formData = new URLSearchParams();
        formData.append('edit_user', true);
        formData.append('id', id);
        
        // Додаємо тільки змінені поля
        if (username) formData.append('username', username);
        if (role) formData.append('role', role);
        if (password) formData.append('password', password);
        if (telega) formData.append('telega', telega);
        if (true_name) formData.append('true_name', true_name);
        if (posada) formData.append('posada', posada);

        // Якщо нічого не змінено
        if (!username && !role && !password && !telega && !true_name && !posada) {
            alert("Будь ласка, змініть хоча б одне поле!");
            return;
        }

        fetch('users-handler.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeModal();
                loadUsers(); // оновлення списку
            } else {
                alert(data.error || 'Помилка при редагуванні користувача.');
            }
        })
        .catch(() => alert('Помилка з\'єднання із сервером.'));
    };
}





















