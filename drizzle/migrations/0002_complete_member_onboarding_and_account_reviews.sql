CREATE OR REPLACE FUNCTION public.complete_account_onboarding()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); em text; code text; cid uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
 SELECT email, upper(trim(coalesce(raw_user_meta_data->>'join_code',''))) INTO em, code FROM auth.users WHERE id=uid AND email_confirmed_at IS NOT NULL;
 IF em IS NULL THEN RAISE EXCEPTION 'email confirmation required'; END IF;
 INSERT INTO public.account_access(user_id) VALUES(uid) ON CONFLICT DO NOTHING;
 IF EXISTS(SELECT 1 FROM public.company_members WHERE user_id=uid) THEN RETURN NULL; END IF;
 IF code='' THEN RETURN NULL; END IF;
 SELECT id INTO cid FROM public.companies WHERE join_code=code AND public.company_is_active(id);
 IF cid IS NULL THEN RAISE EXCEPTION 'invalid or inactive company code'; END IF;
 PERFORM public.join_company(code);
 RETURN cid;
END $$;
REVOKE ALL ON FUNCTION public.complete_account_onboarding() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_account_onboarding() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_site_accounts()
RETURNS TABLE(user_id uuid, email text, full_name text, created_at timestamptz, approval_status text, plan text, subscription_ends_at timestamptz, team_company text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
 RETURN QUERY SELECT u.id,u.email::text,p.full_name,u.created_at,coalesce(a.approval_status,'pending'),
 coalesce(a.plan,(SELECT sp.plan FROM public.subscription_payments sp WHERE sp.user_id=u.id ORDER BY sp.created_at DESC LIMIT 1)),a.subscription_ends_at,
 (SELECT c.name FROM public.companies c WHERE c.owner_id=u.id ORDER BY c.created_at LIMIT 1)::text
 FROM auth.users u LEFT JOIN public.account_access a ON a.user_id=u.id LEFT JOIN public.profiles p ON p.id=u.id
 WHERE NOT EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=u.id AND r.role='super_admin')
 AND NOT EXISTS(SELECT 1 FROM public.company_members m JOIN public.companies c ON c.id=m.company_id WHERE m.user_id=u.id AND c.owner_id<>u.id)
 ORDER BY u.created_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.admin_site_accounts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_site_accounts() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_review_account(_user uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.is_super_admin() THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role='super_admin') THEN RAISE EXCEPTION 'cannot change administrator'; END IF;
 IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=_user) THEN RAISE EXCEPTION 'account missing'; END IF;
 INSERT INTO public.account_access(user_id,approval_status,reviewed_at)
 VALUES(_user,CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,now())
 ON CONFLICT(user_id) DO UPDATE SET approval_status=excluded.approval_status,reviewed_at=excluded.reviewed_at;
END $$;
REVOKE ALL ON FUNCTION public.admin_review_account(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_account(uuid,boolean) TO authenticated, service_role;