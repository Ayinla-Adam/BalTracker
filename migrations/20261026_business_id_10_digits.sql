-- BalTracker: migrate public business IDs to unique 10-digit numeric strings.
-- Run once in the Supabase SQL Editor. This does not change businesses.id or
-- the foreign-key relationships used by business_customer_links and
-- customer_transaction_requests.
--
-- IDs remain TEXT intentionally so the code is exactly 10 digits and can
-- preserve leading zeroes if the generator ever returns one.

CREATE OR REPLACE FUNCTION public.generate_business_id()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    candidate_id text;
BEGIN
    LOOP
        candidate_id := pg_catalog.lpad(
            pg_catalog.floor(pg_catalog.random() * 10000000000)::bigint::text,
            10,
            '0'
        );

        IF NOT EXISTS (
            SELECT 1
            FROM public.businesses b
            WHERE b.business_id = candidate_id
        ) THEN
            RETURN candidate_id;
        END IF;
    END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION public.generate_business_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_business_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.generate_business_id() TO authenticated, service_role;

-- New businesses will receive a 10-digit ID automatically.
ALTER TABLE public.businesses
    ALTER COLUMN business_id SET DEFAULT public.generate_business_id();

-- Update each existing business separately so every newly generated value is
-- visible to the next iteration's uniqueness check. Foreign keys reference
-- businesses.id, so the existing requests and links remain attached.
DO $migration$
DECLARE
    business_record record;
BEGIN
    FOR business_record IN
        SELECT b.id
        FROM public.businesses b
        ORDER BY b.id
    LOOP
        UPDATE public.businesses
        SET business_id = public.generate_business_id()
        WHERE id = business_record.id;
    END LOOP;
END;
$migration$;

-- Enforce exactly 10 numeric digits for all future public business IDs.
ALTER TABLE public.businesses
    DROP CONSTRAINT IF EXISTS businesses_business_id_ten_digits;

ALTER TABLE public.businesses
    ADD CONSTRAINT businesses_business_id_ten_digits
    CHECK (business_id ~ '^[0-9]{10}$');

-- Verify after running:
-- SELECT business_id, business_name FROM public.businesses ORDER BY business_name;
-- SELECT COUNT(*) FROM public.businesses WHERE business_id !~ '^[0-9]{10}$';
