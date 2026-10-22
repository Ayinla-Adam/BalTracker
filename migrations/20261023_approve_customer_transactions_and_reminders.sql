-- BalTracker: atomically approve a customer request, record the financial transaction,
-- and optionally save a payment reminder. Existing records are not deleted or rewritten.
ALTER TABLE public.customer_transaction_requests
  ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS reminder_date date,
  ADD COLUMN IF NOT EXISTS reminder_dismissed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS customer_transaction_requests_due_reminders_idx
  ON public.customer_transaction_requests(reminder_date)
  WHERE status = 'approved' AND reminder_date IS NOT NULL AND reminder_dismissed = false;

DROP FUNCTION IF EXISTS public.review_customer_transaction_request(uuid, text, text);
CREATE OR REPLACE FUNCTION public.review_customer_transaction_request(
  p_request_id uuid,
  p_decision text,
  p_owner_note text DEFAULT NULL,
  p_due_date date DEFAULT NULL,
  p_reminder_date date DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_request public.customer_transaction_requests%ROWTYPE;
  v_customer_id uuid;
  v_transaction_id uuid;
  v_app_id text;
  v_owner_id uuid := auth.uid();
  v_type text;
BEGIN
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Sign in is required'; END IF;
  IF p_decision NOT IN ('approved','declined') THEN RAISE EXCEPTION 'Invalid decision'; END IF;

  SELECT r.* INTO v_request
  FROM public.customer_transaction_requests r
  JOIN public.businesses b ON b.id = r.business_id
  WHERE r.id = p_request_id AND b.owner_user_id = v_owner_id AND r.status = 'pending'
  FOR UPDATE OF r;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pending request not found for this business'; END IF;

  IF p_decision = 'approved' THEN
    -- Keep one customer contact for this customer account, for both sales and credit.
    INSERT INTO public.customers (user_id, app_id, name, phone, email, notes)
    VALUES (v_owner_id, 'customer_user_' || v_request.customer_user_id::text, v_request.customer_name, NULL, NULL, NULL)
    ON CONFLICT (user_id, app_id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_customer_id;

    IF v_request.payment_type = 'pay_later' THEN
      IF p_reminder_date IS NOT NULL AND p_due_date IS NULL THEN
        RAISE EXCEPTION 'A due date is required when adding a payment reminder';
      END IF;
      IF p_reminder_date IS NOT NULL AND p_reminder_date > p_due_date THEN
        RAISE EXCEPTION 'Reminder date must be on or before the due date';
      END IF;
      IF p_due_date IS NOT NULL AND p_due_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Due date cannot be in the past';
      END IF;
      IF p_reminder_date IS NOT NULL AND p_reminder_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Reminder date cannot be in the past';
      END IF;
      v_type := 'owed_to_me';
    ELSE
      v_type := 'sales';
      p_due_date := NULL;
      p_reminder_date := NULL;
    END IF;

    v_app_id := 'customer_request_' || v_request.id::text;
    INSERT INTO public.transactions (
      user_id, app_id, transaction_type, amount, description, transaction_date,
      due_date, party_name, party_type, customer_id
    ) VALUES (
      v_owner_id, v_app_id, v_type, v_request.amount, v_request.description,
      (v_request.created_at AT TIME ZONE 'UTC')::date, p_due_date,
      v_request.customer_name, 'customer', v_customer_id
    )
    ON CONFLICT (user_id, app_id) DO UPDATE SET
      transaction_type = EXCLUDED.transaction_type,
      amount = EXCLUDED.amount,
      description = EXCLUDED.description,
      due_date = EXCLUDED.due_date,
      party_name = EXCLUDED.party_name,
      party_type = EXCLUDED.party_type,
      customer_id = EXCLUDED.customer_id
    RETURNING id INTO v_transaction_id;
  END IF;

  UPDATE public.customer_transaction_requests
  SET status = p_decision,
      owner_note = nullif(pg_catalog.btrim(p_owner_note), ''),
      reviewed_at = pg_catalog.now(),
      transaction_id = v_transaction_id,
      due_date = CASE WHEN p_decision = 'approved' AND v_request.payment_type = 'pay_later' THEN p_due_date ELSE NULL END,
      reminder_date = CASE WHEN p_decision = 'approved' AND v_request.payment_type = 'pay_later' THEN p_reminder_date ELSE NULL END,
      reminder_dismissed = false
  WHERE id = p_request_id;

  RETURN p_decision;
END;
$function$;

REVOKE ALL ON FUNCTION public.review_customer_transaction_request(uuid, text, text, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_customer_transaction_request(uuid, text, text, date, date) TO authenticated;
