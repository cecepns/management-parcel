<?php
require_once __DIR__ . '/_bootstrap.php';
auth_user_id();

$id = (int)($_POST['id'] ?? 0);
$name = trim($_POST['name'] ?? '');
$price = (float)($_POST['price'] ?? 0);
$stock = (int)($_POST['stock'] ?? 0);
$description = trim($_POST['description'] ?? '');
$newImage = upload_product_image($_FILES['image'] ?? []);

if ($id > 0) {
    $old = $db->prepare('SELECT image_path FROM products WHERE id = ?');
    $old->execute([$id]);
    $oldImage = $old->fetchColumn();

    $imagePath = $newImage ?: $oldImage;
    $stmt = $db->prepare('UPDATE products SET name=?, price=?, stock=?, description=?, image_path=?, updated_at=NOW() WHERE id=?');
    $stmt->execute([$name, $price, $stock, $description, $imagePath, $id]);

    if ($newImage && $oldImage && $oldImage !== $newImage) {
        unlink_product_image($oldImage);
    }
    json_response(['id' => $id]);
}

$stmt = $db->prepare('INSERT INTO products(name, price, stock, description, image_path, created_at, updated_at) VALUES(?,?,?,?,?,NOW(),NOW())');
$stmt->execute([$name, $price, $stock, $description, $newImage]);
json_response(['id' => (int)$db->lastInsertId()]);
