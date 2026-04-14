<?php

/**
 * Target hari cicilan: Σ (qty × products.payment_days_total) untuk order ini,
 * mengikuti master produk terbaru (mengatasi order lama yang kolom payment_days_target-nya masih 0).
 *
 * @param string $orderAlias alias tabel orders di query luar, huruf/angka/underscore saja
 */
function sql_order_payment_days_target(string $orderAlias = 'o'): string
{
    if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $orderAlias)) {
        $orderAlias = 'o';
    }
    return "(SELECT COALESCE(SUM(oi.qty * COALESCE(p.payment_days_total, 0)), 0)
        FROM order_items oi
        INNER JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = {$orderAlias}.id)";
}
