import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/lib/i18n';
import { PLANS } from '@/lib/subscriptions';

const siteQuery = queryOptions({ queryKey: ['site-admin'], queryFn: async () => {
  const [accounts, payments, me] = await Promise.all([
    supabase.rpc('admin_site_accounts'),
    supabase.from('subscription_payments').select('*').order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ]);
  if (accounts.error) throw accounts.error;
  if (payments.error) throw payments.error;
  // The administrator's own account is not reviewable, so it is left out of the approvals list.
  const myId = me.data.user?.id;
  return { accounts: (accounts.data ?? []).filter(a => a.user_id !== myId), payments: payments.data ?? [] };
} });

export function SiteAdministration() {
  const { lang, t } = useI18n();
  const ar = lang === 'ar';
  const { data } = useSuspenseQuery(siteQuery);
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{ kind: 'account' | 'payment'; id: string; approve: boolean } | null>(null);
  const label = (status: string) => status === 'approved' ? (ar ? 'مقبول' : 'Approved') : status === 'rejected' ? (ar ? 'مرفوض' : 'Rejected') : (ar ? 'معلّق' : 'Pending');
  const refresh = () => qc.invalidateQueries({ queryKey: ['site-admin'] });
  const review = async () => {
    if (!action) return;
    setBusy(true);
    try {
      const r = action.kind === 'account'
        ? await supabase.rpc('admin_review_account', { _user: action.id, _approve: action.approve })
        : await supabase.rpc('admin_review_payment', { _payment: action.id, _approve: action.approve });
      if (r.error) { toast.error(t('common.error')); return; }
      setAction(null); toast.success(t('common.saved'));
      await Promise.all([refresh(), qc.invalidateQueries({ queryKey: ['site-access'] }), qc.invalidateQueries({ queryKey: ['admin-companies'] })]);
    } finally { setBusy(false); }
  };
  const email = (id: string) => data.accounts.find(a => a.user_id === id)?.email ?? '—';
  const filteredAccounts = data.accounts.filter(a => `${a.email} ${a.full_name}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => Number(b.approval_status === 'pending') - Number(a.approval_status === 'pending'));
  const filteredPayments = data.payments.filter(p => `${email(p.user_id)} ${p.transfer_reference}`.toLowerCase().includes(q.toLowerCase()));
  const controls = (kind: 'account' | 'payment', id: string) => <div className="flex gap-1"><Button size="icon" variant="outline" aria-label={ar ? 'موافقة' : 'Approve'} title={ar ? 'موافقة' : 'Approve'} onClick={() => setAction({ kind, id, approve: true })}><Check className="size-4" /></Button><Button size="icon" variant="ghost" aria-label={ar ? 'رفض' : 'Reject'} title={ar ? 'رفض' : 'Reject'} onClick={() => setAction({ kind, id, approve: false })}><X className="size-4 text-destructive" /></Button></div>;
  return <section className="mt-7 mb-10 border-b pb-8">
    <div className="grid gap-4 sm:grid-cols-3">{[
      { title: ar ? 'حسابات تنتظر الموافقة' : 'Accounts awaiting approval', value: data.accounts.filter(a => a.approval_status === 'pending').length },
      { title: ar ? 'تحويلات تنتظر التأكيد' : 'Transfers awaiting confirmation', value: data.payments.filter(p => p.status === 'pending').length },
      { title: ar ? 'إجمالي المدفوعات المؤكدة' : 'Confirmed payments total', value: `${data.payments.filter(p => p.status === 'approved').reduce((s,p) => s + p.amount,0).toLocaleString('en-US')} EGP` },
    ].map(s => <div key={s.title} className="rounded-lg border bg-card p-5"><p className="text-sm text-muted-foreground">{s.title}</p><p className="mt-3 text-2xl font-bold">{s.value}</p></div>)}</div>
    <div className="mt-6 flex items-center gap-2"><Input aria-label={ar ? 'بحث بالبريد أو رقم التحويل' : 'Search email or transfer reference'} placeholder={ar ? 'بحث بالإيميل أو رقم التحويل' : 'Search email or transfer reference'} value={q} onChange={e => setQ(e.target.value)} /><Button size="icon" variant="outline" aria-label={ar ? 'تحديث' : 'Refresh'} onClick={refresh}><RefreshCw className="size-4" /></Button></div>
    <Tabs defaultValue="accounts" className="mt-5"><TabsList><TabsTrigger value="accounts">{ar ? 'طلبات قبول الحسابات' : 'Account approval requests'}</TabsTrigger><TabsTrigger value="payments">{ar ? 'تحويلات إنستا باي' : 'InstaPay transfers'}</TabsTrigger></TabsList>
      <TabsContent value="accounts"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{ar ? 'الإيميل' : 'Email'}</TableHead><TableHead>{ar ? 'تاريخ التسجيل' : 'Registered'}</TableHead><TableHead>{ar ? 'قبول الحساب' : 'Account approval'}</TableHead><TableHead>{ar ? 'الباقة' : 'Plan'}</TableHead><TableHead>{ar ? 'نهاية الاشتراك' : 'Subscription expires'}</TableHead><TableHead>{t('common.actions')}</TableHead></TableRow></TableHeader><TableBody>{filteredAccounts.map(a => <TableRow key={a.user_id}><TableCell><span dir="ltr">{a.email}</span><p className="text-xs text-muted-foreground">{a.full_name}</p></TableCell><TableCell>{a.created_at.slice(0,10)}</TableCell><TableCell><Badge variant={a.approval_status === 'rejected' ? 'destructive' : 'secondary'}>{label(a.approval_status)}</Badge></TableCell><TableCell>{PLANS.find(p => p.key === a.plan)?.[ar ? 'ar' : 'en'] ?? '—'}</TableCell><TableCell>{a.subscription_ends_at?.slice(0,10) ?? '—'}</TableCell><TableCell>{controls('account', a.user_id)}</TableCell></TableRow>)}</TableBody></Table>{!filteredAccounts.length && <p className="py-6 text-center text-muted-foreground">{ar ? 'لا توجد حسابات مطابقة' : 'No matching accounts'}</p>}</div></TabsContent>
      <TabsContent value="payments"><p className="my-4 text-sm text-muted-foreground">{ar ? 'راجع وصول المبلغ في إنستا باي قبل تأكيد الدفع. رقم التحويل وحده ليس إثباتًا.' : 'Check receipt in InstaPay before confirming payment. A reference alone is not proof.'}</p><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{ar ? 'الإيميل' : 'Email'}</TableHead><TableHead>{ar ? 'رقم التحويل' : 'Transfer reference'}</TableHead><TableHead>{ar ? 'الباقة' : 'Plan'}</TableHead><TableHead>{ar ? 'المبلغ' : 'Amount'}</TableHead><TableHead>{ar ? 'التاريخ' : 'Date'}</TableHead><TableHead>{ar ? 'الحالة' : 'Status'}</TableHead><TableHead>{t('common.actions')}</TableHead></TableRow></TableHeader><TableBody>{filteredPayments.map(p => <TableRow key={p.id}><TableCell dir="ltr">{email(p.user_id)}</TableCell><TableCell dir="ltr">{p.transfer_reference}</TableCell><TableCell>{PLANS.find(x => x.key === p.plan)?.[ar ? 'ar' : 'en']}</TableCell><TableCell>{p.amount.toLocaleString('en-US')} EGP</TableCell><TableCell>{p.created_at.slice(0,10)}</TableCell><TableCell><Badge variant={p.status === 'rejected' ? 'destructive' : 'secondary'}>{p.status === 'approved' ? (ar ? 'تم تأكيد الدفع' : 'Payment confirmed') : label(p.status)}</Badge></TableCell><TableCell>{p.status === 'pending' ? controls('payment', p.id) : '—'}</TableCell></TableRow>)}</TableBody></Table>{!filteredPayments.length && <p className="py-6 text-center text-muted-foreground">{ar ? 'لا توجد تحويلات مطابقة' : 'No matching transfers'}</p>}</div></TabsContent>
    </Tabs>
    <Dialog open={!!action} onOpenChange={open => !open && setAction(null)}><DialogContent><DialogHeader><DialogTitle>{action?.kind === 'payment' && action.approve ? (ar ? 'تأكيد استلام التحويل' : 'Confirm transfer received') : (ar ? 'تأكيد القرار' : 'Confirm decision')}</DialogTitle></DialogHeader><p>{action?.kind === 'payment' && action.approve ? (ar ? 'هل تأكدت من وصول المبلغ الصحيح؟ ستُضاف مدة الباقة مرة واحدة، ويظل قبول الحساب مطلوبًا.' : 'Have you verified the correct amount arrived? The plan term is added once; account approval is still required.') : (ar ? 'سيُحفظ قرارك ويؤثر على صلاحية الدخول للموقع.' : 'Your decision will be saved and affects site access.')}</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setAction(null)}>{t('common.cancel')}</Button><Button disabled={busy} onClick={review}>{ar ? 'تأكيد' : 'Confirm'}</Button></div></DialogContent></Dialog>
  </section>;
}