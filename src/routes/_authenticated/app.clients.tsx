import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/Field";
import { CustomFieldInput } from "@/components/CustomFieldInput";
import { useI18n, type TKey } from "@/lib/i18n";
import { canEditData, moduleLabel } from "@/lib/modules";
import { useWorkspace } from "@/lib/workspace";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/app/clients")({
  head: () => pageHead("Clients", "Manage your Kayan clients."),
  component: ClientsPage,
});

type Client = Tables<"clients">;
const STATUSES = ["active", "lead", "inactive"] as const;
type FormState = { name: string; phone: string; email: string; notes: string; status: string; custom: Record<string, string> };
const empty: FormState = { name: "", phone: "", email: "", notes: "", status: "active", custom: {} };

function ClientsPage() {
  const { t, lang } = useI18n();
  const ws = useWorkspace();
  const qc = useQueryClient();
  const cid = ws.company!.id;
  const mod = ws.modules.find((m) => m.module_key === "clients");
  const fields = mod?.custom_fields ?? [];
  const editable = canEditData(ws.role);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Client | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", cid],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("company_id", cid).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter((c) => [c.name, c.phone, c.email, c.notes, ...Object.values((c.custom as Record<string, string>) ?? {})].some((v) => String(v ?? "").toLowerCase().includes(s)));
  }, [data, q]);

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const row = { name: f.name.trim(), phone: f.phone.trim() || null, email: f.email.trim() || null, notes: f.notes.trim() || null, status: f.status, custom: f.custom };
      const res = editing
        ? await supabase.from("clients").update(row).eq("id", editing.id)
        : await supabase.from("clients").insert({ ...row, company_id: cid });
      if (res.error) throw res.error;
    },
    onSuccess: () => { toast.success(t("common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["clients", cid] }); },
    onError: () => toast.error(t("common.error")),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("clients").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success(t("common.deleted")); setToDelete(null); qc.invalidateQueries({ queryKey: ["clients", cid] }); },
    onError: () => toast.error(t("common.error")),
  });

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "", email: c.email ?? "", notes: c.notes ?? "", status: c.status, custom: (c.custom as Record<string, string>) ?? {} });
    setErrors({});
    setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      name: z.string().trim().min(1, t("v.required")).max(120, t("v.tooLong")),
      phone: z.string().max(40, t("v.tooLong")),
      email: z.union([z.literal(""), z.string().trim().email(t("v.email")).max(255, t("v.tooLong"))]),
      notes: z.string().max(2000, t("v.tooLong")),
    });
    const r = schema.safeParse(form);
    if (!r.success) return void setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
    setErrors({});
    save.mutate(form);
  };

  const title = mod ? moduleLabel(mod, lang, t) : t("mod.clients");
  const fieldLabel = (f: (typeof fields)[number]) => (lang === "ar" ? f.label_ar : f.label_en) || f.label_ar || f.label_en;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {editable ? (
          <Button onClick={openNew} className="h-12 gap-2 rounded-xl px-5 text-base"><Plus className="size-5" />{t("common.add")}</Button>
        ) : (
          <Badge variant="secondary">{t("common.viewOnly")}</Badge>
        )}
      </div>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search")} className="h-12 rounded-xl ps-12" />
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border bg-card shadow-soft">
        {isLoading ? (
          <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (data ?? []).length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary"><Users className="size-8" /></span>
            <h2 className="mt-5 text-xl font-bold">{t("clients.empty.title")}</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">{t("clients.empty.body")}</p>
            {editable && <Button onClick={openNew} className="mt-6 h-12 gap-2 rounded-xl px-6"><Plus className="size-5" />{t("clients.add")}</Button>}
          </div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground">{t("common.noResults")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">{t("clients.name")}</TableHead>
                <TableHead className="text-start">{t("clients.phone")}</TableHead>
                <TableHead className="hidden text-start md:table-cell">{t("clients.email")}</TableHead>
                <TableHead className="text-start">{t("clients.status")}</TableHead>
                {fields.map((f) => <TableHead key={f.key} className="hidden text-start lg:table-cell">{fieldLabel(f)}</TableHead>)}
                {editable && <TableHead className="text-end">{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell dir="ltr" className="text-start">{c.phone}</TableCell>
                  <TableCell dir="ltr" className="hidden text-start md:table-cell">{c.email}</TableCell>
                  <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{t(`clients.${c.status}` as TKey)}</Badge></TableCell>
                  {fields.map((f) => <TableCell key={f.key} className="hidden lg:table-cell">{String((c.custom as Record<string, string>)?.[f.key] ?? "")}</TableCell>)}
                  {editable && (
                    <TableCell className="text-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(c)} aria-label={t("common.delete")}><Trash2 className="size-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? t("clients.editTitle") : t("clients.add")}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field id="c-name" label={t("clients.name")} error={errors["name"]}>
              <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="c-phone" label={t("clients.phone")} error={errors["phone"]}>
                <Input id="c-phone" dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 rounded-xl" />
              </Field>
              <Field id="c-email" label={t("clients.email")} error={errors["email"]}>
                <Input id="c-email" dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-12 rounded-xl" />
              </Field>
            </div>
            <Field id="c-status" label={t("clients.status")}>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="c-status" className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`clients.${s}` as TKey)}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            {fields.map((f) => (
              <Field key={f.key} id={`cf-${f.key}`} label={fieldLabel(f)}>
                <CustomFieldInput field={f} value={form.custom[f.key] ?? ""} onChange={(v) => setForm({ ...form, custom: { ...form.custom, [f.key]: v } })} />
              </Field>
            ))}
            <Field id="c-notes" label={t("clients.notes")} error={errors["notes"]}>
              <Textarea id="c-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="rounded-xl" />
            </Field>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 rounded-xl">{t("common.cancel")}</Button>
              <Button type="submit" disabled={save.isPending} className="h-12 rounded-xl px-8">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader><AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && del.mutate(toDelete.id)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
