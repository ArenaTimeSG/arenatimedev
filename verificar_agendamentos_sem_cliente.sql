-- Verificar agendamentos sem cliente ou com client_id nulo
SELECT 
    a.id,
    a.user_id,
    a.client_id,
    a.date,
    a.status,
    a.modality,
    a.booking_source,
    a.created_at,
    bc.name as client_name,
    bc.email as client_email
FROM appointments a
LEFT JOIN booking_clients bc ON a.client_id = bc.id
WHERE a.client_id IS NULL 
   OR bc.id IS NULL
   OR bc.name IS NULL
ORDER BY a.created_at DESC
LIMIT 10;
