<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    json_response(['message' => 'ID tidak valid'], 422);
}

$sql = "SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, r.name AS reseller_name,
        GREATEST(o.total_amount - o.amount_paid, 0) AS remaining_amount
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN resellers r ON r.id = o.reseller_id
        WHERE o.id = ?
        LIMIT 1";
$stmt = $db->prepare($sql);
$stmt->execute([$id]);
$order = $stmt->fetch();

if (!$order) {
    json_response(['message' => 'Order tidak ditemukan'], 404);
}

$itemsStmt = $db->prepare("SELECT oi.*, p.name AS product_name
                           FROM order_items oi
                           JOIN products p ON p.id = oi.product_id
                           WHERE oi.order_id = ?
                           ORDER BY oi.id ASC");
$itemsStmt->execute([$id]);
$order['items'] = $itemsStmt->fetchAll();

json_response($order);
