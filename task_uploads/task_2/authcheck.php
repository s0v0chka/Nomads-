<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}
require_once 'helper.php';


$requiredRole = $requiredRole ?? null;

// === DEBUG ===
echo "<pre style='background:#000;color:#0f0;padding:10px;font-size:14px'>";
echo "== AUTH DEBUG ==\n\n";
echo "SESSION:\n";
print_r($_SESSION);

echo "REMOTE_ADDR: " . ($_SERVER['REMOTE_ADDR'] ?? 'null') . "\n";
echo "HTTP_USER_AGENT: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'null') . "\n";
echo "Required role: " . ($requiredRole ?? 'null') . "\n";
echo "Actual role: " . ($_SESSION['role'] ?? 'not set') . "\n\n";

// Флаги для проверки
$flags = [];

if (!isset($_SESSION['user_id'])) $flags[] = '❌ NO user_id';
if (!isset($_SESSION['role'])) $flags[] = '❌ NO role';
if (($_SESSION['ip'] ?? '') !== ($_SERVER['REMOTE_ADDR'] ?? '')) $flags[] = '❌ IP mismatch';
if (($_SESSION['ua'] ?? '') !== ($_SERVER['HTTP_USER_AGENT'] ?? '')) $flags[] = '❌ UA mismatch';
if ($requiredRole !== null && ($_SESSION['role'] ?? '') !== $requiredRole) $flags[] = '❌ ROLE mismatch';

if (empty($flags)) {
    echo "✅ PASSED AUTH ✅";
    echo "</pre>";
} else {
    echo "AUTH FAIL REASONS:\n";
    foreach ($flags as $fail) {
        echo "$fail\n";
    }
    echo "</pre>";

    session_unset();
    session_destroy();
    exit; // временно без редиректа, чтобы ты видел вывод
}