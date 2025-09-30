-- Funções SQL para criação automática de payment_records

-- Função para criar payment_record automaticamente (usada pelo create-payment-preference)
CREATE OR REPLACE FUNCTION public.create_payment_record_auto(
    p_owner_id uuid,
    p_preference_id text,
    p_init_point text,
    p_external_reference text,
    p_amount numeric,
    p_currency text,
    p_status text
)
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.payment_records (
        booking_id,
        owner_id,
        preference_id,
        init_point,
        external_reference,
        amount,
        currency,
        status,
        expires_at
    ) VALUES (
        NULL, -- booking_id is nullable now
        p_owner_id,
        p_preference_id,
        p_init_point,
        p_external_reference,
        p_amount,
        p_currency,
        p_status,
        NOW() + INTERVAL '30 minutes'
    );
END;
$function$;

-- Função para criar payment_record a partir de preference_id (usada pelo frontend)
CREATE OR REPLACE FUNCTION public.create_payment_record_from_preference(
    p_preference_id text,
    p_owner_id uuid,
    p_init_point text
)
RETURNS public.payment_records
LANGUAGE plpgsql
AS $function$
DECLARE
    v_payment_record public.payment_records;
BEGIN
    INSERT INTO public.payment_records (
        booking_id,
        owner_id,
        preference_id,
        init_point,
        external_reference,
        amount,
        currency,
        status,
        expires_at
    ) VALUES (
        NULL, -- booking_id is nullable
        p_owner_id,
        p_preference_id,
        p_init_point,
        'auto_created_' || p_preference_id, -- Gerar um external_reference
        1.00, -- Valor padrão, pode ser ajustado se necessário
        'BRL',
        'pending_payment',
        NOW() + INTERVAL '30 minutes'
    )
    RETURNING * INTO v_payment_record;

    RETURN v_payment_record;
END;
$function$;

