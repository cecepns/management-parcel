<?php

function product_upload_dir(): string
{
    return __DIR__ . '/../public/uploads/products';
}

function upload_product_image(array $file): ?string
{
    if (!isset($file['tmp_name']) || !$file['tmp_name']) {
        return null;
    }
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $name = uniqid('product_', true) . '.' . ($ext ?: 'jpg');
    $dir = product_upload_dir();
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    $target = $dir . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $target)) {
        return null;
    }
    return '/uploads/products/' . $name;
}

function unlink_product_image(?string $path): void
{
    if (!$path) {
        return;
    }

    $cleanPath = ltrim($path, '/');
    $publicPath = __DIR__ . '/../public/' . $cleanPath;
    $legacyPath = __DIR__ . '/../' . $cleanPath;

    if (is_file($publicPath)) {
        unlink($publicPath);
    }

    if (is_file($legacyPath)) {
        unlink($legacyPath);
    }
}
