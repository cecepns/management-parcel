<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$page = max(1, (int)($_GET['page'] ?? 1));
$limit = min(10, max(1, (int)($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;
$q = trim($_GET['q'] ?? '');

$where = '';
$params = [];
if ($q !== '') {
    $where = ' WHERE name LIKE ? OR description LIKE ?';
    $like = '%' . $q . '%';
    $params[] = $like;
    $params[] = $like;
}

$countStmt = $db->prepare('SELECT COUNT(*) FROM products' . $where);
$countStmt->execute($params);
$total = (int)$countStmt->fetchColumn();

$stmt = $db->prepare('SELECT * FROM products' . $where . ' ORDER BY id DESC LIMIT ? OFFSET ?');
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
