<?php

function make_token(int $userId): string
{
    $env = require __DIR__ . '/../config/env.php';
    return base64_encode($userId . '|' . hash('sha256', $userId . '|' . $env['app_key']));
}

function auth_user_id(): int
{
    $auth = '';

    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $auth = trim((string)$value);
                break;
            }
        }
    }

    if ($auth === '') {
        $auth = trim((string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    }

    if ($auth === '' && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = trim((string)$_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $matches)) {
        json_response(['message' => 'Unauthorized'], 401);
    }

    $token = trim($matches[1]);
    $decoded = base64_decode($token);
    if (!$decoded || !str_contains($decoded, '|')) {
        json_response(['message' => 'Invalid token'], 401);
    }
    [$uid, $hash] = explode('|', $decoded);
    $env = require __DIR__ . '/../config/env.php';
    $expected = hash('sha256', $uid . '|' . $env['app_key']);
    if (!hash_equals($expected, $hash)) {
        json_response(['message' => 'Invalid token'], 401);
    }
    return (int)$uid;
}
