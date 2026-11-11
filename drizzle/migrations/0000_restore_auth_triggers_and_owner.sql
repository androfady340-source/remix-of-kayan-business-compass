DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
DROP TRIGGER IF EXISTS on_auth_user_access ON auth.users;
CREATE TRIGGER on_auth_user_access AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.register_account_access();

INSERT INTO public.app_settings(id, billing_enabled, site_owner_email) VALUES (1, true, 'androfady340@gmail.com') ON CONFLICT (id) DO UPDATE SET site_owner_email = EXCLUDED.site_owner_email;

INSERT INTO public.profiles(id, email, full_name, language)
SELECT u.id, u.email, u.raw_user_meta_data->>'full_name', coalesce(u.raw_user_meta_data->>'language','ar') FROM auth.users u ON CONFLICT (id) DO NOTHING;
INSERT INTO public.account_access(user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;
INSERT INTO public.user_roles(user_id, role)
SELECT u.id, 'super_admin' FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL AND lower(u.email) = 'androfady340@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'super_admin');
UPDATE public.account_access a SET approval_status='approved', plan='annual', subscription_ends_at = now() + interval '100 years', reviewed_at = now()
FROM auth.users u WHERE u.id = a.user_id AND lower(u.email) = 'androfady340@gmail.com';