<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$year = max(2000, (int)($_GET['year'] ?? date('Y')));
$start = $year . '-01-01';
$end = $year . '-12-31';
$resellerId = isset($_GET['reseller_id']) && $_GET['reseller_id'] !== '' ? (int)$_GET['reseller_id'] : null;
$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(500, max(1, (int)($_GET['limit'] ?? 500)));
$offset = ($page - 1) * $limit;

$whereReseller = $resellerId ? ' AND o.reseller_id = ?' : '';
$countSql = "SELECT COUNT(*)
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN resellers r ON r.id = o.reseller_id
        WHERE o.order_date BETWEEN ? AND ?" . $whereReseller;
$countStmt = $db->prepare($countSql);
$countParams = [$start, $end];
if ($resellerId) {
    $countParams[] = $resellerId;
}
$countStmt->execute($countParams);
$total = (int)$countStmt->fetchColumn();

$sql = "SELECT o.id, o.order_date, o.total_amount, o.amount_paid, o.payment_days_total, o.payment_status,
               GREATEST(o.total_amount - o.amount_paid, 0) AS remaining_amount,
               c.name AS customer_name, r.name AS reseller_name
        FROM orders o
        JOIN customers c ON c.id = o.customer_id
        LEFT JOIN resellers r ON r.id = o.reseller_id
        WHERE o.order_date BETWEEN ? AND ?" . $whereReseller . "
        ORDER BY o.order_date DESC, o.id DESC
        LIMIT ? OFFSET ?";
$stmt = $db->prepare($sql);
$params = [$start, $end];
if ($resellerId) {
    $params[] = $resellerId;
}
$params[] = $limit;
$params[] = $offset;
$stmt->execute($params);

json_response($stmt->fetchAll(), 200, [
    'page' => $page,
    'limit' => $limit,
    'total' => $total,
    'total_pages' => (int)ceil($total / $limit),
    'year' => $year,
]);
