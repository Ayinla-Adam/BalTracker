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


-- Customer sends a transaction for the business owner to authorize.
-- No separate "connection request" is required for this workflow.
CREATE TABLE IF NOT EXISTS public.customer_transaction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL CHECK (char_length(btrim(customer_name)) BETWEEN 1 AND 120),
  item_name text NOT NULL CHECK (char_length(btrim(item_name)) BETWEEN 1 AND 160),
  quantity numeric(12,2) NOT NULL CHECK (quantity > 0 AND quantity <= 1000000),
  amount numeric(12,2) NOT NULL CHECK (amount > 0 AND amount <= 1000000000000),
  payment_type text NOT NULL CHECK (payment_type IN ('pay_now','pay_later')),
  description text NOT NULL CHECK (char_length(btrim(description)) BETWEEN 1 AND 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined')),
  owner_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS customer_transaction_requests_customer_idx
 ON public.customer_transaction_requests(customer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customer_transaction_requests_business_idx
 ON public.customer_transaction_requests(business_id, status, created_at DESC);
ALTER TABLE public.customer_transaction_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.customer_transaction_requests FROM PUBLIC, anon;
GRANT SELECT, INSERT ON TABLE public.customer_transaction_requests TO authenticated;
GRANT UPDATE (status, owner_note, reviewed_at) ON TABLE public.customer_transaction_requests TO authenticated;

DROP POLICY IF EXISTS customer_transaction_requests_customer_select ON public.customer_transaction_requests;
CREATE POLICY customer_transaction_requests_customer_select ON public.customer_transaction_requests
 FOR SELECT TO authenticated USING (customer_user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS customer_transaction_requests_customer_insert ON public.customer_transaction_requests;
CREATE POLICY customer_transaction_requests_customer_insert ON public.customer_transaction_requests
 FOR INSERT TO authenticated WITH CHECK (
   customer_user_id = (SELECT auth.uid()) AND status = 'pending' AND reviewed_at IS NULL
   AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = (SELECT auth.uid()) AND p.role = 'customer')
 );
DROP POLICY IF EXISTS customer_transaction_requests_owner_select ON public.customer_transaction_requests;
CREATE POLICY customer_transaction_requests_owner_select ON public.customer_transaction_requests
 FOR SELECT TO authenticated USING (
   EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = customer_transaction_requests.business_id AND b.owner_user_id = (SELECT auth.uid()))
 );
DROP POLICY IF EXISTS customer_transaction_requests_owner_update ON public.customer_transaction_requests;
CREATE POLICY customer_transaction_requests_owner_update ON public.customer_transaction_requests
 FOR UPDATE TO authenticated USING (
   status = 'pending' AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = customer_transaction_requests.business_id AND b.owner_user_id = (SELECT auth.uid()))
 ) WITH CHECK (
   status IN ('approved','declined') AND reviewed_at IS NOT NULL
   AND EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = customer_transaction_requests.business_id AND b.owner_user_id = (SELECT auth.uid()))
 );

CREATE OR REPLACE FUNCTION public.submit_customer_transaction_request(
 p_business_id text, p_item_name text, p_quantity numeric, p_amount numeric,
 p_payment_type text, p_description text
) RETURNS TABLE(request_id uuid, business_name text, request_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_business public.businesses%ROWTYPE; v_name text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in is required'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='customer') THEN
   RAISE EXCEPTION 'Only customer accounts can submit transaction requests';
 END IF;
 SELECT b.* INTO v_business FROM public.businesses b
 WHERE upper(b.business_id)=upper(btrim(p_business_id)) LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Business not found'; END IF;
 SELECT p.display_name INTO v_name FROM public.profiles p WHERE p.user_id=auth.uid();
 IF nullif(btrim(v_name),'') IS NULL THEN RAISE EXCEPTION 'Add your name to your profile before sending a request'; END IF;
 IF nullif(btrim(p_item_name),'') IS NULL OR nullif(btrim(p_description),'') IS NULL THEN
   RAISE EXCEPTION 'Item and description are required';
 END IF;
 IF p_quantity IS NULL OR p_quantity<=0 OR p_amount IS NULL OR p_amount<=0 THEN
   RAISE EXCEPTION 'Quantity and amount must be greater than zero';
 END IF;
 IF p_payment_type NOT IN ('pay_now','pay_later') THEN RAISE EXCEPTION 'Choose pay now or pay later'; END IF;
 RETURN QUERY INSERT INTO public.customer_transaction_requests
 (business_id,customer_user_id,customer_name,item_name,quantity,amount,payment_type,description)
 VALUES (v_business.id,auth.uid(),btrim(v_name),btrim(p_item_name),p_quantity,p_amount,p_payment_type,btrim(p_description))
 RETURNING id,v_business.business_name,status;
END;
$function$;
REVOKE ALL ON FUNCTION public.submit_customer_transaction_request(text,text,numeric,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_customer_transaction_request(text,text,numeric,numeric,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_customer_transaction_request(
 p_request_id uuid, p_decision text, p_owner_note text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_request public.customer_transaction_requests%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in is required'; END IF;
 IF p_decision NOT IN ('approved','declined') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 SELECT r.* INTO v_request FROM public.customer_transaction_requests r
 JOIN public.businesses b ON b.id=r.business_id
 WHERE r.id=p_request_id AND b.owner_user_id=auth.uid() AND r.status='pending'
 FOR UPDATE OF r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pending request not found for this business'; END IF;
 UPDATE public.customer_transaction_requests
 SET status=p_decision, owner_note=nullif(btrim(p_owner_note),''), reviewed_at=pg_catalog.now()
 WHERE id=p_request_id;
 RETURN p_decision;
END;
$function$;
REVOKE ALL ON FUNCTION public.review_customer_transaction_request(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_customer_transaction_request(uuid,text,text) TO authenticated;
