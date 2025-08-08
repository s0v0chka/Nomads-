$(document).ready(function () {
  // Показываем #users_manager при клике на #menusers
  $('#menusers').on('click', function () {
    $('#users_manager').css('display', 'flex');
    loadUsers();
  });

  // Проверка на изменение URL
  $(window).on('hashchange', function () {
    if (window.location.hash !== '#users_manager') {
      $('#users_manager').css('display', 'none'); // Скрываем #users_manager, если хеш не #users_manager
    }
  });

  // Инициализируем проверку при первой загрузке
  if (window.location.hash !== '#users_manager') {
    $('#users_manager').css('display', 'none'); // Скрываем, если хеш не #users_manager
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
                    <td>
                        <button class="btn btn-primary" onclick="editUser(${user.id})">Редагувати</button>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})">Видалити</button>
                    </td>
                `;
                tableBody.appendChild(row);  // Додаємо кожного користувача в таблицю
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="4">Немає користувачів</td></tr>';  // Якщо немає користувачів
        }
    })
    .catch(error => {
        console.error('Помилка при завантаженні користувачів:', error);
        alert('Щось пішло не так, спробуйте ще раз');
    });
}

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

        // Валідація: хоча б одне поле має бути змінене
        const formData = new URLSearchParams();
        formData.append('edit_user', true);
        formData.append('id', id);
        
        // Додаємо тільки змінені поля
        if (username) formData.append('username', username);
        if (role) formData.append('role', role);
        if (password) formData.append('password', password);

        // Якщо нічого не змінено
        if (!username && !role && !password) {
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