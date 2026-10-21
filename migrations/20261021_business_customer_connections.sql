-- BalTracker: customer requests to connect to businesses.
-- Public business discovery remains separate from connection approval.
-- Customers may view their own connection requests; owners may view requests for their businesses.
-- This migration does not modify existing customers, transactions, repayments, profiles, or businesses.

CREATE TABLE IF NOT EXISTS public.business_customer_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL
        REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_user_id uuid NOT NULL
        REFERENCES auth.users(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'connected', 'declined')),
    requested_at timestamptz NOT NULL DEFAULT now(),
    reviewed_at timestamptz,
    CONSTRAINT business_customer_links_one_per_customer
        UNIQUE (business_id, customer_user_id)
);

CREATE INDEX IF NOT EXISTS business_customer_links_customer_idx
    ON public.business_customer_links (customer_user_id, status);

CREATE INDEX IF NOT EXISTS business_customer_links_business_idx
    ON public.business_customer_links (business_id, status);

ALTER TABLE public.business_customer_links ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.business_customer_links FROM PUBLIC, anon;
GRANT SELECT, INSERT, DELETE ON TABLE public.business_customer_links TO authenticated;
GRANT UPDATE (status, reviewed_at) ON TABLE public.business_customer_links TO authenticated;

DROP POLICY IF EXISTS business_customer_links_customer_select
    ON public.business_customer_links;
CREATE POLICY business_customer_links_customer_select
    ON public.business_customer_links
    FOR SELECT TO authenticated
    USING (customer_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS business_customer_links_customer_insert
    ON public.business_customer_links;
CREATE POLICY business_customer_links_customer_insert
    ON public.business_customer_links
    FOR INSERT TO authenticated
    WITH CHECK (
        customer_user_id = (SELECT auth.uid())
        AND status = 'pending'
        AND reviewed_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.profiles AS p
            WHERE p.user_id = (SELECT auth.uid())
              AND p.role = 'customer'
        )
    );

DROP POLICY IF EXISTS business_customer_links_customer_delete_declined
    ON public.business_customer_links;
CREATE POLICY business_customer_links_customer_delete_declined
    ON public.business_customer_links
    FOR DELETE TO authenticated
    USING (
        customer_user_id = (SELECT auth.uid())
        AND status = 'declined'
    );

DROP POLICY IF EXISTS business_customer_links_owner_select
    ON public.business_customer_links;
CREATE POLICY business_customer_links_owner_select
    ON public.business_customer_links
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_customer_links.business_id
              AND b.owner_user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS business_customer_links_owner_update
    ON public.business_customer_links;
CREATE POLICY business_customer_links_owner_update
    ON public.business_customer_links
    FOR UPDATE TO authenticated
    USING (
        status = 'pending'
        AND EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_customer_links.business_id
              AND b.owner_user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        status IN ('connected', 'declined')
        AND reviewed_at IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.businesses AS b
            WHERE b.id = business_customer_links.business_id
              AND b.owner_user_id = (SELECT auth.uid())
        )
    );

-- Keep the review timestamp aligned with owner decisions.
CREATE OR REPLACE FUNCTION public.set_business_customer_link_reviewed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NEW.status IN ('connected', 'declined') THEN
            NEW.reviewed_at := pg_catalog.now();
        ELSE
            NEW.reviewed_at := NULL;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_business_customer_link_reviewed_at() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS business_customer_links_reviewed_at
    ON public.business_customer_links;
CREATE TRIGGER business_customer_links_reviewed_at
    BEFORE UPDATE OF status ON public.business_customer_links
    FOR EACH ROW
    EXECUTE FUNCTION public.set_business_customer_link_reviewed_at();
