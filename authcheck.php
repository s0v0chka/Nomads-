<?php


if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
require_once 'helper.php';

$requiredRole = $requiredRole ?? null;

if (
    !isset($_SESSION['user_id']) ||
    !isset($_SESSION['role']) ||
    ($_SESSION['ip'] ?? '') !== ($_SERVER['REMOTE_ADDR'] ?? '') ||
    ($_SESSION['ua'] ?? '') !== ($_SERVER['HTTP_USER_AGENT'] ?? '') ||
    ($requiredRole !== null && $_SESSION['role'] !== $requiredRole) 
) {
    http_response_code(403);
echo <<<HTML
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>403 Доступ запрещён</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', sans-serif;
      background: radial-gradient(circle at center, #2b2b2b 0%, #000000 100%);
      color: #f44336;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
      text-align: center;
    }
    h1 {
      font-size: 4vw;
      margin: 0;
      color: #ff3b3b;
      text-shadow: 0 0 10px #ff0000;
    }
    p {
      font-size: 1.5vw;
      color: #ccc;
      margin-top: 15px;
    }
    a {
      margin-top: 30px;
      padding: 10px 20px;
      background-color: #ff3b3b;
      color: white;
      text-decoration: none;
      font-weight: bold;
      border-radius: 5px;
      box-shadow: 0 0 10px #ff3b3b;
      transition: 0.3s;
    }
    a:hover {
      background-color: #ff0000;
      box-shadow: 0 0 20px #ff0000;
    }
  </style>
</head>
<body>
  <h1>403 Доступ запрещён</h1>
  <p>У вас нет прав для просмотра этой страницы.</p>
  <a href="login.php">Вернуться на главную</a>
</body>
</html>
HTML;
exit;
    
}
$username = $_SESSION['username'];
$role     = $_SESSION['role'];