import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const PLANS = [
  { key: 'monthly', en: 'Monthly', ar: 'شهري', amount: 499, months: 1 },
  { key: 'quarterly', en: 'Quarterly', ar: 'ربع سنوي', amount: 1299, months: 3 },
  { key: 'semi_annual', en: 'Semi-Annual', ar: 'نصف سنوي', amount: 2399, months: 6 },
  { key: 'annual', en: 'Annual', ar: 'سنوي', amount: 4499, months: 12 },
] as const;
export const INSTAPAY_NUMBER = '01208744830';
export function hasActiveAccess(approval: string, ends: string | null, now: number) {
  return approval === 'approved' && ends !== null && new Date(ends).getTime() > now;
}

export const accessQuery = queryOptions({
  queryKey: ['site-access'],
  staleTime: 0,
  queryFn: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('Not signed in');
    const [role, access, payments, active] = await Promise.all([
      supabase.rpc('is_super_admin'),
      supabase.from('account_access').select('*').eq('user_id', data.user.id).maybeSingle(),
      supabase.from('subscription_payments').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }),
      supabase.rpc('has_site_access'),
    ]);
    for (const result of [role, access, payments, active]) if (result.error) throw result.error;
    return { userId: data.user.id, email: data.user.email ?? '', isAdmin: !!role.data, active: !!active.data, account: access.data, payments: payments.data ?? [] };
  },
});