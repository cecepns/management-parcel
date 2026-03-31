<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(10, max(1, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;
$q = trim($_GET['q'] ?? '');
$resellerId = isset($_GET['reseller_id']) && $_GET['reseller_id'] !== '' ? (int)$_GET['reseller_id'] : null;

$where = '';
$params = [];
if ($q !== '') {
    $where = " WHERE c.name LIKE ? OR c.phone LIKE ? OR r.name LIKE ? OR DATE_FORMAT(o.order_date, '%Y-%m-%d') LIKE ?";
    $like = '%' . $q . '%';
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
    $params[] = $like;
}
if ($resellerId) {
    $where .= ($where ? ' AND ' : ' WHERE ') . 'o.reseller_id = ?';
    $params[] = $resellerId;
}

$countSql = "SELECT COUNT(*)
        FROM orders o
        JOIN customers c ON c.id=o.customer_id
        LEFT JOIN resellers r ON r.id=o.reseller_id" . $where;
$countStmt = $db->prepare($countSql);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$sql = "SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, r.name AS reseller_name,
        GREATEST(o.total_amount - o.amount_paid, 0) AS remaining_amount
        FROM orders o
        JOIN customers c ON c.id=o.customer_id
        LEFT JOIN resellers r ON r.id=o.reseller_id
        " . $where . " ORDER BY o.id DESC LIMIT ? OFFSET ?";
$stmt = $db->prepare($sql);
foreach ($params as $index => $value) {
    $stmt->bindValue($index + 1, $value, PDO::PARAM_STR);
}
$stmt->bindValue(count($params) + 1, $limit, PDO::PARAM_INT);
$stmt->bindValue(count($params) + 2, $offset, PDO::PARAM_INT);
$stmt->execute();

json_response($stmt->fetchAll(), 200, [
    'page' => $page,
    'limit' => $limit,
    'total' => $total,
    'total_pages' => (int)ceil($total / $limit),
]);
