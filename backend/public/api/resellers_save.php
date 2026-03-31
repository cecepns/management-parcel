<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$body = request_body();
$id = (int)($body['id'] ?? 0);
$name = trim($body['name'] ?? '');
$phone = trim($body['phone'] ?? '');
$address = trim($body['address'] ?? '');

if ($id > 0) {
    $stmt = $db->prepare('UPDATE resellers SET name=?, phone=?, address=?, updated_at=NOW() WHERE id=?');
    $stmt->execute([$name, $phone, $address, $id]);
    json_response(['id' => $id]);
}

$stmt = $db->prepare('INSERT INTO resellers(name, phone, address, created_at, updated_at) VALUES(?,?,?,NOW(),NOW())');
$stmt->execute([$name, $phone, $address]);
json_response(['id' => (int)$db->lastInsertId()]);
