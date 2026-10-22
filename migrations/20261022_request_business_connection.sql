-- BalTracker: submit a customer request to connect to a business by Business ID.
-- Requires migrations/20261021_business_customer_connections.sql to be run first.
-- The function only creates/reopens a connection request; it does not create a purchase or payment.

CREATE OR REPLACE FUNCTION public.request_business_connection(p_business_id text)
RETURNS TABLE (status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    signed_in_user uuid := auth.uid();
    requested_id text;
    target_business uuid;
    resulting_status text;
BEGIN
    IF signed_in_user IS NULL THEN
        RAISE EXCEPTION 'Please sign in to request a business connection';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.user_id = signed_in_user
          AND p.role = 'customer'
    ) THEN
        RAISE EXCEPTION 'Only customer accounts can request a business connection';
    END IF;

    requested_id := pg_catalog.upper(
        pg_catalog.btrim(COALESCE(p_business_id, ''))
    );

    IF requested_id = '' THEN
        RAISE EXCEPTION 'Enter a Business ID';
    END IF;

    SELECT b.id
    INTO target_business
    FROM public.businesses AS b
    WHERE b.business_id = requested_id
    LIMIT 1;

    IF target_business IS NULL THEN
        RAISE EXCEPTION 'Business not found';
    END IF;

    INSERT INTO public.business_customer_links AS existing_link (
        business_id,
        customer_user_id,
        status,
        requested_at,
        reviewed_at
    )
    VALUES (
        target_business,
        signed_in_user,
        'pending',
        pg_catalog.now(),
        NULL
    )
    ON CONFLICT (business_id, customer_user_id)
    DO UPDATE SET
        status = CASE
            WHEN existing_link.status = 'declined' THEN 'pending'
            ELSE existing_link.status
        END,
        requested_at = CASE
            WHEN existing_link.status = 'declined' THEN pg_catalog.now()
            ELSE existing_link.requested_at
        END,
        reviewed_at = CASE
            WHEN existing_link.status = 'declined' THEN NULL
            ELSE existing_link.reviewed_at
        END
    RETURNING existing_link.status INTO resulting_status;

    RETURN QUERY SELECT resulting_status;
END;
$function$;

REVOKE ALL ON FUNCTION public.request_business_connection(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_business_connection(text) TO authenticated;
