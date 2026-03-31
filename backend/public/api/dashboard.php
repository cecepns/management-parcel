<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$products = $db->query('SELECT COUNT(*) FROM products')->fetchColumn();
$resellers = $db->query('SELECT COUNT(*) FROM resellers')->fetchColumn();
$orders = $db->query('SELECT COUNT(*) FROM orders')->fetchColumn();
$revenue = $db->query('SELECT COALESCE(SUM(total_amount),0) FROM orders')->fetchColumn();

json_response([
    'products' => (int)$products,
    'resellers' => (int)$resellers,
    'orders' => (int)$orders,
    'revenue' => (float)$revenue,
]);
