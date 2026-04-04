SELECT 
    n.id,
    n.number,
    m.id AS monthly_amount_id,
    SUM(o.amount) AS total
FROM tbl_number n
LEFT JOIN tbl_monthly_amount m 
    ON m.status = true 
    AND m.deleted = false
LEFT JOIN tbl_order o 
    ON o.number_id = n.id
    AND o.monthly_amount_id = m.id
    AND o.deleted = false
GROUP BY n.id, n.number, m.id;