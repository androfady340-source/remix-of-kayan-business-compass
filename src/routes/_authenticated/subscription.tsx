import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/HeaderControls';
import { AccountControls } from '@/components/AccountControls';
import { useI18n } from '@/lib/i18n';
import { accessQuery, PLANS, INSTAPAY_NUMBER } from '@/lib/subscriptions';
import { supabase } from '@/integrations/supabase/client';
import { pageHead } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_authenticated/subscription')({
  head: () => pageHead('Subscription plans', 'Kayan subscription plans and manual InstaPay payment review.'),
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.fetchQuery(accessQuery);
    if (access.isAdmin) throw redirect({ to: '/admin' });
    if (access.active) throw redirect({ to: '/app' });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(accessQuery),
  component: Subscription,
});

function Subscription() {
  const { lang, t } = useI18n();
  const ar = lang === 'ar';
  const { data } = useSuspenseQuery(accessQuery);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('monthly');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = data.payments.find(p => p.status === 'pending');
  const plan = PLANS.find(p => p.key === selected) ?? PLANS[0];
  const approval = data.account?.approval_status ?? 'pending';
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success(t('set.copied')); } catch { toast.error(t('common.error')); } };
  const refresh = async () => {
    const fresh = await qc.fetchQuery(accessQuery);
    if (fresh.active) await navigate({ to: '/app' });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reference.trim().length < 4) { setError(ar ? 'أدخل رقم التحويل الصحيح (٤ أحرف على الأقل).' : 'Enter a valid transfer reference (at least 4 characters).'); return; }
    setBusy(true); setError('');
    try {
      const r = await supabase.rpc('submit_subscription_payment', { _plan: selected, _reference: reference.trim() });
      if (r.error) { setError(ar ? 'تعذّر تسجيل التحويل. تأكد أن الرقم لم يُستخدم من قبل وأنه لا يوجد طلب معلّق.' : 'Cannot submit: check that the reference is unused and there is no pending request.'); return; }
      setReference('');
      await qc.invalidateQueries({ queryKey: ['site-access'] });
      toast.success(ar ? 'تم إرسال التحويل للمراجعة، وليس تأكيد الدفع.' : 'Transfer submitted for review, not confirmed as paid.');
    } finally { setBusy(false); }
  };
  return <div className="min-h-screen bg-background">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-4"><Link to="/"><Logo /></Link><AccountControls /></header>
    <main className="mx-auto max-w-6xl px-5 pb-14 pt-7">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-primary">{ar ? 'اشتراك كيان' : 'Kayan subscription'}</p><h1 className="mt-2 text-3xl font-extrabold">{ar ? 'اختر باقتك' : 'Choose your plan'}</h1><p className="mt-2 break-all text-sm text-muted-foreground" dir="ltr">{data.email}</p></div><Button variant="outline" onClick={refresh}><RefreshCw className="me-2 size-4" />{ar ? 'تحديث الحالة' : 'Refresh status'}</Button></div>
      <section className="mt-7 flex flex-wrap items-center gap-3 border-y py-4"><ShieldCheck className="size-5 text-primary" /><span>{ar ? 'الحساب:' : 'Account:'} <Badge variant={approval === 'rejected' ? 'destructive' : 'secondary'}>{approval === 'approved' ? (ar ? 'مقبول' : 'Approved') : approval === 'rejected' ? (ar ? 'مرفوض' : 'Rejected') : (ar ? 'بانتظار موافقة الإدارة' : 'Awaiting approval')}</Badge></span><span className="text-sm text-muted-foreground">{ar ? 'الدخول يتطلب قبول الحساب وتأكيد التحويل من الإدارة.' : 'Access requires account approval and payment confirmation by the administrator.'}</span>{data.active && <Button asChild><Link to="/app">{ar ? 'دخول مساحة العمل' : 'Open workspace'}</Link></Button>}{data.account?.subscription_ends_at && <span className="text-sm">{ar ? 'ينتهي:' : 'Expires:'} {data.account.subscription_ends_at.slice(0,10)}</span>}</section>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{PLANS.map(p => <div key={p.key} className={cn('flex flex-col rounded-lg border bg-card p-5', selected === p.key && 'border-primary ring-1 ring-primary')}><h2 className="font-bold">{ar ? p.ar : p.en}</h2><p className="mt-4 text-3xl font-extrabold">{p.amount.toLocaleString('en-US')} <span className="text-sm font-medium">{ar ? 'جنيه' : 'EGP'}</span></p><p className="mt-2 text-sm text-muted-foreground">{ar ? `لمدة ${p.months} ${p.months === 1 ? 'شهر' : 'شهور'}` : `${p.months} ${p.months === 1 ? 'month' : 'months'}`}</p><Button className="mt-5" variant={selected === p.key ? 'default' : 'outline'} disabled={!!pending} onClick={() => setSelected(p.key)}>{selected === p.key && <Check className="me-2 size-4" />}{ar ? 'اختيار الباقة' : 'Select plan'}</Button></div>)}</div>
      {pending ? <section className="mt-9 border-t pt-6"><h2 className="text-xl font-bold">{ar ? 'التحويل بانتظار المراجعة' : 'Transfer awaiting review'}</h2><p className="mt-3">{ar ? 'رقم التحويل:' : 'Transfer reference:'} <span dir="ltr" className="break-all font-semibold">{pending.transfer_reference}</span></p><p className="mt-2 text-muted-foreground">{ar ? 'الإدارة ستراجع وصول المبلغ قبل تفعيل الاشتراك.' : 'The administrator will confirm receipt before activating your subscription.'}</p></section> : <section className="mt-9 grid gap-8 border-t pt-7 md:grid-cols-2"><div><h2 className="text-xl font-bold">{ar ? 'تحويل عبر إنستا باي' : 'Pay with InstaPay'}</h2><p className="mt-3">{ar ? 'المبلغ المطلوب:' : 'Amount to transfer:'} <strong>{plan.amount.toLocaleString('en-US')} {ar ? 'جنيه مصري' : 'EGP'}</strong></p><div className="mt-4 flex items-center gap-2"><span dir="ltr" className="text-2xl font-bold">{INSTAPAY_NUMBER}</span><Button variant="ghost" size="icon" aria-label={ar ? 'نسخ رقم إنستا باي' : 'Copy InstaPay number'} onClick={() => copy(INSTAPAY_NUMBER)}><Copy className="size-4" /></Button></div><p className="mt-4 font-semibold">{ar ? 'مهم: اكتب إيميل حسابك في ملاحظات تحويل إنستا باي بعد الدفع.' : 'Important: include your account email in the InstaPay transfer notes.'}</p><div className="mt-2 flex items-center gap-2"><span dir="ltr" className="min-w-0 break-all text-sm">{data.email}</span><Button variant="ghost" size="icon" className="shrink-0" aria-label={ar ? 'نسخ الإيميل' : 'Copy email'} onClick={() => copy(data.email)}><Copy className="size-4" /></Button></div><p className="mt-3 text-sm text-muted-foreground">{ar ? 'لا يوجد خصم تلقائي أو تجديد تلقائي.' : 'No automatic charge or automatic renewal.'}</p></div><form onSubmit={submit} className="space-y-4"><Label htmlFor="transfer-reference">{ar ? 'رقم التحويل بعد الدفع' : 'Transfer reference after payment'}</Label><Input id="transfer-reference" value={reference} onChange={e => setReference(e.target.value)} dir="ltr" required minLength={4} maxLength={100} /><p className="text-sm text-muted-foreground">{ar ? 'إرسال الرقم لا يؤكد الدفع؛ التفعيل بعد مراجعة الإدارة وقبول حسابك.' : 'Submitting a reference does not confirm payment; activation follows review and account approval.'}</p>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy}>{ar ? 'إرسال للمراجعة' : 'Submit for review'}</Button></form></section>}
      {data.payments.length > 0 && <section className="mt-10 border-t pt-6"><h2 className="text-lg font-bold">{ar ? 'سجل التحويلات' : 'Transfer history'}</h2><div className="mt-4 space-y-3">{data.payments.map(p => <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm"><span className="break-all" dir="ltr">{p.transfer_reference}</span><span>{p.amount.toLocaleString('en-US')} EGP</span><Badge variant={p.status === 'rejected' ? 'destructive' : 'secondary'}>{p.status === 'approved' ? (ar ? 'تم تأكيد الدفع' : 'Payment confirmed') : p.status === 'rejected' ? (ar ? 'مرفوض' : 'Rejected') : (ar ? 'قيد المراجعة' : 'Pending review')}</Badge></div>)}</div></section>}
    </main>
  </div>;
}