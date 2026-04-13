<?php
require_once __DIR__ . '/_bootstrap.php';

try {
    $actor = auth_roles(['admin', 'reseller']);

    $year = max(2000, (int)($_GET['year'] ?? date('Y')));
    $start = $year . '-01-01';
    $end = $year . '-12-31';

    if ($actor['role'] === 'reseller') {
        $resellerId = (int)$actor['id'];
    } else {
        $resellerId = isset($_GET['reseller_id']) && $_GET['reseller_id'] !== '' ? (int)$_GET['reseller_id'] : null;
    }

    $q = trim($_GET['q'] ?? '');

    $conditions = ['o.order_date BETWEEN ? AND ?'];
    $params = [$start, $end];

    if ($resellerId) {
        $conditions[] = 'o.reseller_id = ?';
        $params[] = $resellerId;
    }
    if ($q !== '') {
        $conditions[] = 'c.name LIKE ?';
        $params[] = '%' . $q . '%';
    }

    $whereSql = 'WHERE ' . implode(' AND ', $conditions);

    $sql = "SELECT
            p.id AS product_id,
            p.name AS product_name,
            o.id AS order_id,
            o.order_date,
            oi.qty,
            c.name AS customer_name,
            c.phone AS customer_phone,
            r.name AS reseller_name
        FROM order_items oi
        INNER JOIN orders o ON o.id = oi.order_id
        INNER JOIN products p ON p.id = oi.product_id
        INNER JOIN customers c ON c.id = o.customer_id
        LEFT JOIN resellers r ON r.id = o.reseller_id
        {$whereSql}
        ORDER BY p.name ASC, o.order_date DESC, o.id DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $flat = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $byProduct = [];
    foreach ($flat as $row) {
        $pid = (int)$row['product_id'];
        if (!isset($byProduct[$pid])) {
            $byProduct[$pid] = [
                'product_id' => $pid,
                'product_name' => $row['product_name'],
                'total_qty' => 0,
                'lines' => [],
            ];
        }
        $qty = (int)$row['qty'];
        $byProduct[$pid]['total_qty'] += $qty;
        $byProduct[$pid]['lines'][] = [
            'order_id' => (int)$row['order_id'],
            'order_date' => $row['order_date'],
            'qty' => $qty,
            'customer_name' => $row['customer_name'],
            'customer_phone' => $row['customer_phone'] ?? '',
            'reseller_name' => $row['reseller_name'] ?? '',
        ];
    }

    json_response(array_values($byProduct), 200, ['year' => $year]);
} catch (Throwable $e) {
    error_log('REPORTS_BY_PRODUCT ERROR: ' . $e->getMessage());
    json_response(['message' => 'Gagal memuat agregasi paket'], 500);
}
