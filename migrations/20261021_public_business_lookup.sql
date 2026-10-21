-- BalTracker: public business discovery by Business ID.
-- Customers can view a business's public name and Business ID without owner approval.
-- This function intentionally returns no transactions, debts, contact records, or profile data.

CREATE OR REPLACE FUNCTION public.find_public_business(p_business_id text)
RETURNS TABLE (
    business_id text,
    business_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    signed_in_user uuid := auth.uid();
    requested_id text;
BEGIN
    IF signed_in_user IS NULL THEN
        RAISE EXCEPTION 'Please sign in to search for a business';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = signed_in_user
          AND p.role = 'customer'
    ) THEN
        RAISE EXCEPTION 'Only customer accounts can search for businesses';
    END IF;

    requested_id := pg_catalog.upper(
        pg_catalog.btrim(COALESCE(p_business_id, ''))
    );

    IF requested_id = '' THEN
        RAISE EXCEPTION 'Enter a Business ID';
    END IF;

    RETURN QUERY
    SELECT b.business_id, b.business_name
    FROM public.businesses AS b
    WHERE b.business_id = requested_id
    LIMIT 1;
END;
$function$;

REVOKE ALL ON FUNCTION public.find_public_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_public_business(text) TO authenticated;
