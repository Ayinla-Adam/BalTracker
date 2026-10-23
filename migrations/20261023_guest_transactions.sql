-- BalTracker guest transactions: no account required.
-- Additive migration; existing customer requests and transactions are preserved.
ALTER TABLE public.customer_transaction_requests
  ALTER COLUMN customer_user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS guest_reference text;

ALTER TABLE public.customer_transaction_requests
  DROP CONSTRAINT IF EXISTS customer_transaction_requests_guest_identity_check;
ALTER TABLE public.customer_transaction_requests
  ADD CONSTRAINT customer_transaction_requests_guest_identity_check
  CHECK ((customer_user_id IS NOT NULL AND guest_reference IS NULL) OR
         (customer_user_id IS NULL AND guest_reference IS NOT NULL)) NOT VALID;
ALTER TABLE public.customer_transaction_requests
  VALIDATE CONSTRAINT customer_transaction_requests_guest_identity_check;
CREATE UNIQUE INDEX IF NOT EXISTS customer_transaction_requests_guest_reference_uidx
 ON public.customer_transaction_requests(guest_reference) WHERE guest_reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.find_public_business(p_business_id text)
RETURNS TABLE(business_id text,business_name text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_user uuid:=auth.uid(); v_id text;
BEGIN
 IF v_user IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=v_user AND p.role='customer') THEN
  RAISE EXCEPTION 'Only customer accounts can search for businesses';
 END IF;
 v_id:=pg_catalog.upper(pg_catalog.btrim(COALESCE(p_business_id,'')));
 IF v_id='' THEN RAISE EXCEPTION 'Enter a Business ID'; END IF;
 RETURN QUERY SELECT b.business_id,b.business_name FROM public.businesses b WHERE b.business_id=v_id LIMIT 1;
END;
$function$;
REVOKE ALL ON FUNCTION public.find_public_business(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_public_business(text) TO authenticated,anon;

CREATE OR REPLACE FUNCTION public.submit_guest_transaction_request(
 p_business_id text,p_customer_name text,p_description text,p_amount numeric,
 p_payment_type text,p_honeypot text DEFAULT NULL
) RETURNS TABLE(guest_reference text,business_name text,request_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_business public.businesses%ROWTYPE; v_reference text; v_name text;
BEGIN
 IF nullif(pg_catalog.btrim(COALESCE(p_honeypot,'')),'') IS NOT NULL THEN RAISE EXCEPTION 'Request could not be submitted'; END IF;
 v_name:=pg_catalog.regexp_replace(pg_catalog.btrim(COALESCE(p_customer_name,'')),'\s+',' ','g');
 IF pg_catalog.char_length(v_name) NOT BETWEEN 1 AND 120 THEN RAISE EXCEPTION 'Enter a valid name'; END IF;
 IF pg_catalog.char_length(pg_catalog.btrim(COALESCE(p_description,''))) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Enter a transaction description'; END IF;
 IF p_amount IS NULL OR p_amount<=0 OR p_amount>1000000000000 THEN RAISE EXCEPTION 'Enter a valid amount'; END IF;
 IF p_payment_type NOT IN ('pay_now','pay_later') THEN RAISE EXCEPTION 'Choose a valid payment arrangement'; END IF;
 SELECT b.* INTO v_business FROM public.businesses b WHERE b.business_id=pg_catalog.upper(pg_catalog.btrim(COALESCE(p_business_id,''))) LIMIT 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Business not found'; END IF;
 v_reference:='BTG-'||pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(gen_random_uuid()::text,'-',''),1,10));
 INSERT INTO public.customer_transaction_requests
  (business_id,customer_user_id,customer_name,item_name,quantity,amount,payment_type,description,status,guest_reference)
 VALUES(v_business.id,NULL,v_name,pg_catalog.left(pg_catalog.btrim(p_description),160),1,p_amount,p_payment_type,pg_catalog.btrim(p_description),'pending',v_reference);
 RETURN QUERY SELECT v_reference,v_business.business_name,'pending'::text;
END;
$function$;
REVOKE ALL ON FUNCTION public.submit_guest_transaction_request(text,text,text,numeric,text,text) FROM PUBLIC,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_guest_transaction_request(text,text,text,numeric,text,text) TO anon;

CREATE OR REPLACE FUNCTION public.lookup_guest_transaction_request(p_guest_reference text)
RETURNS TABLE(guest_reference text,business_name text,request_status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO ''
AS $function$
 SELECT r.guest_reference,b.business_name,r.status FROM public.customer_transaction_requests r
 JOIN public.businesses b ON b.id=r.business_id
 WHERE r.guest_reference=pg_catalog.upper(pg_catalog.btrim(COALESCE(p_guest_reference,''))) LIMIT 1
$function$;
REVOKE ALL ON FUNCTION public.lookup_guest_transaction_request(text) FROM PUBLIC,authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_guest_transaction_request(text) TO anon;

CREATE OR REPLACE FUNCTION public.review_customer_transaction_request(
 p_request_id uuid,p_decision text,p_owner_note text DEFAULT NULL,
 p_due_date date DEFAULT NULL,p_reminder_date date DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $function$
DECLARE v_request public.customer_transaction_requests%ROWTYPE;
 v_customer_id uuid; v_transaction_id uuid; v_app_id text; v_owner_id uuid:=auth.uid(); v_type text;
BEGIN
 IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Sign in is required'; END IF;
 IF p_decision NOT IN ('approved','declined') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 SELECT r.* INTO v_request FROM public.customer_transaction_requests r
 JOIN public.businesses b ON b.id=r.business_id
 WHERE r.id=p_request_id AND b.owner_user_id=v_owner_id AND r.status='pending' FOR UPDATE OF r;
 IF NOT FOUND THEN RAISE EXCEPTION 'Pending request not found for this business'; END IF;
 IF p_decision='approved' THEN
  IF v_request.customer_user_id IS NOT NULL THEN
   INSERT INTO public.customers(user_id,app_id,name,phone,email,notes)
   VALUES(v_owner_id,'customer_user_'||v_request.customer_user_id::text,v_request.customer_name,NULL,NULL,NULL)
   ON CONFLICT(user_id,app_id) DO UPDATE SET name=EXCLUDED.name RETURNING id INTO v_customer_id;
  END IF;
  IF v_request.payment_type='pay_later' THEN
   IF p_reminder_date IS NOT NULL AND p_due_date IS NULL THEN RAISE EXCEPTION 'A due date is required when adding a payment reminder'; END IF;
   IF p_reminder_date IS NOT NULL AND p_reminder_date>p_due_date THEN RAISE EXCEPTION 'Reminder date must be on or before the due date'; END IF;
   IF p_due_date IS NOT NULL AND p_due_date<CURRENT_DATE THEN RAISE EXCEPTION 'Due date cannot be in the past'; END IF;
   IF p_reminder_date IS NOT NULL AND p_reminder_date<CURRENT_DATE THEN RAISE EXCEPTION 'Reminder date cannot be in the past'; END IF;
   v_type:='owed_to_me';
  ELSE v_type:='sales'; p_due_date:=NULL;p_reminder_date:=NULL; END IF;
  v_app_id:='customer_request_'||v_request.id::text;
  INSERT INTO public.transactions(user_id,app_id,transaction_type,amount,description,transaction_date,due_date,party_name,party_type,customer_id)
  VALUES(v_owner_id,v_app_id,v_type,v_request.amount,v_request.description,(v_request.created_at AT TIME ZONE 'UTC')::date,p_due_date,v_request.customer_name,'customer',v_customer_id)
  ON CONFLICT(user_id,app_id) DO UPDATE SET transaction_type=EXCLUDED.transaction_type,amount=EXCLUDED.amount,description=EXCLUDED.description,due_date=EXCLUDED.due_date,party_name=EXCLUDED.party_name,party_type=EXCLUDED.party_type,customer_id=EXCLUDED.customer_id
  RETURNING id INTO v_transaction_id;
 END IF;
 UPDATE public.customer_transaction_requests SET status=p_decision,owner_note=nullif(pg_catalog.btrim(p_owner_note),''),reviewed_at=pg_catalog.now(),
 transaction_id=v_transaction_id,
 due_date=CASE WHEN p_decision='approved' AND v_request.payment_type='pay_later' THEN p_due_date ELSE NULL END,
 reminder_date=CASE WHEN p_decision='approved' AND v_request.payment_type='pay_later' THEN p_reminder_date ELSE NULL END,
 reminder_dismissed=false WHERE id=p_request_id;
 RETURN p_decision;
END;
$function$;
REVOKE ALL ON FUNCTION public.review_customer_transaction_request(uuid,text,text,date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.review_customer_transaction_request(uuid,text,text,date,date) TO authenticated;
