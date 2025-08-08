<?php
session_start();
require_once 'db.php';
require_once 'helper.php';
function normalize_ip($ip) {
    return $ip === '::1' ? '127.0.0.1' : $ip;
}
$_SESSION['ip'] = normalize_ip($_SERVER['REMOTE_ADDR']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['ip'] = $_SERVER['REMOTE_ADDR'];
        $_SESSION['ua'] = $_SERVER['HTTP_USER_AGENT'];
        $_SESSION['created'] = time();
        session_write_close();
        
        header("Location: dashboard.php");
        exit;
    } else {
        echo "Невірний логін або пароль!";
    }
}
