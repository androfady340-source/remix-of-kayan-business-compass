CREATE OR REPLACE FUNCTION public.validate_business_links()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $function$
DECLARE r jsonb := to_jsonb(NEW);
BEGIN
 IF TG_OP='UPDATE' AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN RAISE EXCEPTION 'company cannot change'; END IF;
 IF TG_TABLE_NAME='invoices' THEN
   IF r->>'client_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.clients WHERE id=(r->>'client_id')::uuid AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'invalid client'; END IF;
 ELSIF TG_TABLE_NAME='invoice_items' THEN
   IF NOT EXISTS(SELECT 1 FROM public.invoices WHERE id=(r->>'invoice_id')::uuid AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'invalid invoice'; END IF;
 ELSIF TG_TABLE_NAME='tasks' THEN
   IF r->>'assignee_id' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.company_members WHERE user_id=(r->>'assignee_id')::uuid AND company_id=NEW.company_id) THEN RAISE EXCEPTION 'invalid assignee'; END IF;
 END IF;
 RETURN NEW;
END $function$;