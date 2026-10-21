-- BalTracker: safely register or update the signed-in business owner's business.
-- Run this migration once in Supabase SQL Editor before using Business Registration in the app.
-- This function updates the profile and businesses row in one database transaction.
-- It does not change account roles or modify any financial records.

CREATE OR REPLACE FUNCTION public.register_my_business(p_business_name text)
RETURNS TABLE (business_id text, business_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    signed_in_user uuid := auth.uid();
    clean_name text;
    registered_id text;
BEGIN
    IF signed_in_user IS NULL THEN
        RAISE EXCEPTION 'You must be signed in to register a business';
    END IF;

    clean_name := pg_catalog.regexp_replace(
        pg_catalog.btrim(COALESCE(p_business_name, '')),
        '\s+',
        ' ',
        'g'
    );

    IF clean_name = '' THEN
        RAISE EXCEPTION 'Please enter a business name';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.user_id = signed_in_user
          AND p.role = 'business_owner'
    ) THEN
        RAISE EXCEPTION 'Only business-owner accounts can register a business';
    END IF;

    UPDATE public.profiles
    SET business_name = clean_name,
        updated_at = pg_catalog.now()
    WHERE user_id = signed_in_user;

    INSERT INTO public.businesses (owner_user_id, business_name)
    VALUES (signed_in_user, clean_name)
    ON CONFLICT (owner_user_id)
    DO UPDATE SET
        business_name = EXCLUDED.business_name,
        updated_at = pg_catalog.now()
    RETURNING public.businesses.business_id INTO registered_id;

    RETURN QUERY SELECT registered_id, clean_name;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_my_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_my_business(text) TO authenticated;
