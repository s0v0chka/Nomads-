<?php
session_start();
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <title>Log In — NomadsTasks</title>

    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap" rel="stylesheet">

    <!-- Styles -->
    <link rel="stylesheet" href="assets/login-style.css">
</head>
<body>

    <!-- FX background -->
    <canvas id="stars"></canvas>
    <div class="radial-overlay"></div>

    <!-- LOGIN CARD -->
    <div class="login-card" id="card">
        <form method="post" action="login-handler.php" class="login-form" autocomplete="off">
            <h2 class="title">Nomads<span>Task</span></h2>

            <div class="field">
                <input type="text" required name="username">
       
            </div>

            <div class="field">
                <input type="password" required name="password">
               
            </div>

            <button type="submit" class="btn-neon">
                <span class="glow"></span><span>Войти</span>
            </button>
        </form>
    </div>

    <script src="assets/login.js"></script>
</body>
</html>
