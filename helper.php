<?php 
if (!function_exists('normalize_ip')) {
    function normalize_ip($ip) {
        return $ip === '::1' ? '127.0.0.1' : $ip;
    }
}
?>