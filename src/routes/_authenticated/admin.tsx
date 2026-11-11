import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableHeader, TableHead, TableRow, TableCell, TableBody } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Field } from '@/components/Field';
import { SearchBox, matches } from '@/components/ModuleKit';
import { HeaderControls, Logo } from '@/components/HeaderControls';
import { useI18n } from '@/lib/i18n';
import { pageHead } from '@/lib/seo';
import { supabase } from '@/integrations/supabase/client';
import { nullableRpcClient } from '@/lib/nullable-rpc';
import { SiteAdministration } from '@/components/SiteAdministration';
import { AccountControls } from '@/components/AccountControls';
const adminQuery=queryOptions({queryKey:['admin-companies'],queryFn:async()=>{const role=await supabase.rpc('is_super_admin');if(role.error)throw role.error;if(!role.data)return {allowed:false,companies:[]};const r=await supabase.rpc('admin_list_companies');if(r.error)throw r.error;return {allowed:true,companies:r.data};}});
export const Route=createFileRoute('/_authenticated/admin')({head:()=>pageHead('Company administration','Restricted Kayan company and subscription management.'),loader:({context})=>context.queryClient.ensureQueryData(adminQuery),component:Admin});
function Admin(){const {t}=useI18n();const {data}=useSuspenseQuery(adminQuery);const qc=useQueryClient();const [q,setQ]=useState(''),[editing,setEditing]=useState<string|null>(null),[plan,setPlan]=useState(''),[status,setStatus]=useState('active'),[ends,setEnds]=useState(''),[busy,setBusy]=useState(false);
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!editing)return;setBusy(true);const r=await nullableRpcClient.rpc('admin_update_subscription',{_company:editing,_plan:plan.trim(),_status:status,_ends_at:ends?new Date(`${ends}T23:59:59Z`).toISOString():null});setBusy(false);if(r.error){toast.error(t('common.error'));return;}toast.success(t('common.saved'));setEditing(null);qc.invalidateQueries({queryKey:['admin-companies']});};
 return <div className="min-h-screen bg-background"><header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><Link to="/app"><Logo/></Link><AccountControls/></header><main className="mx-auto max-w-6xl px-5 py-8"><h1 className="text-2xl font-extrabold">{t('admin.title')}</h1>{!data.allowed?<p className="mt-6">{t('admin.denied')}</p>:<><SiteAdministration/><SearchBox value={q} onChange={setQ}/><div className="mt-4 overflow-x-auto"><Table><TableHeader><TableRow>{(['clients.name','admin.owner','admin.created','admin.plan','admin.status','admin.ends','admin.members','common.actions'] as const).map(k=><TableHead key={k}>{t(k)}</TableHead>)}</TableRow></TableHeader><TableBody>{data.companies.filter(c=>matches(q,[c.name,c.owner_email,c.plan,c.subscription_status])).map(c=><TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell dir="ltr">{c.owner_email}</TableCell><TableCell>{c.created_at.slice(0,10)}</TableCell><TableCell>{c.plan}</TableCell><TableCell>{t(`admin.${c.subscription_status as 'trial'|'active'|'expired'|'cancelled'}`)}</TableCell><TableCell>{c.subscription_ends_at?.slice(0,10)??'—'}</TableCell><TableCell>{c.members_count}</TableCell><TableCell><Button variant="ghost" size="icon" aria-label={t('admin.update')} onClick={()=>{setEditing(c.id);setPlan(c.plan);setStatus(c.subscription_status);setEnds(c.subscription_ends_at?.slice(0,10)??'');}}><Pencil className="size-4"/></Button></TableCell></TableRow>)}</TableBody></Table></div></>}
 <Dialog open={!!editing} onOpenChange={v=>!v&&setEditing(null)}><DialogContent><DialogHeader><DialogTitle>{t('admin.update')}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={save}><Field id="admin-plan" label={t('admin.plan')}><Input id="admin-plan" required maxLength={80} value={plan} onChange={e=>setPlan(e.target.value)}/></Field><Field id="admin-status" label={t('admin.status')}><Select value={status} onValueChange={setStatus}><SelectTrigger id="admin-status"><SelectValue/></SelectTrigger><SelectContent>{(['trial','active','expired','cancelled'] as const).map(s=><SelectItem key={s} value={s}>{t(`admin.${s}`)}</SelectItem>)}</SelectContent></Select></Field><Field id="admin-ends" label={t('admin.ends')}><Input id="admin-ends" type="date" value={ends} onChange={e=>setEnds(e.target.value)}/></Field><Button disabled={busy} type="submit">{t('common.save')}</Button></form></DialogContent></Dialog></main></div>;
}
