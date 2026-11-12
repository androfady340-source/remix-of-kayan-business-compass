import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/Field";
import { CustomFieldInput } from "@/components/CustomFieldInput";
import { ConfirmDelete, EmptyState, ListCard, PageHeader, SearchBox, matches, money, todayISO, useModule } from "@/components/ModuleKit";
import { useI18n } from "@/lib/i18n";
import { canEditData } from "@/lib/modules";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/app/expenses")({
  head: () => pageHead("Expenses", "Record your Kayan business expenses."),
  component: ExpensesPage,
});

type Expense = Tables<"expenses">;
type FormState = { title: string; amount: string; expense_date: string; category: string; custom: Record<string, string> };
const blank = (): FormState => ({ title: "", amount: "", expense_date: todayISO(), category: "", custom: {} });

function ExpensesPage() {
  const { t, lang } = useI18n();
  const { ws, cid, fields, title, fieldLabel } = useModule("expenses");
  const qc = useQueryClient();
  const editable = canEditData(ws.role);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", cid],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").eq("company_id", cid).order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const filtered = useMemo(() => (data ?? []).filter((x) => matches(q, [x.title, x.category, x.amount, x.expense_date, ...Object.values((x.custom as Record<string, string>) ?? {})])), [data, q]);
  const total = filtered.reduce((s, x) => s + Number(x.amount), 0);

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const row = { title: f.title.trim(), amount: Number(f.amount), expense_date: f.expense_date, category: f.category.trim() || null, custom: f.custom };
      const res = editing ? await supabase.from("expenses").update(row).eq("id", editing.id) : await supabase.from("expenses").insert({ ...row, company_id: cid });
      if (res.error) throw res.error;
    },
    onSuccess: () => { toast.success(t("common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["expenses", cid] }); },
    onError: () => toast.error(t("common.error")),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("expenses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success(t("common.deleted")); setToDelete(null); qc.invalidateQueries({ queryKey: ["expenses", cid] }); },
    onError: () => toast.error(t("common.error")),
  });

  const openNew = () => { setEditing(null); setForm(blank()); setErrors({}); setOpen(true); };
  const openEdit = (x: Expense) => {
    setEditing(x);
    setForm({ title: x.title, amount: String(x.amount), expense_date: x.expense_date, category: x.category ?? "", custom: (x.custom as Record<string, string>) ?? {} });
    setErrors({}); setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.object({
      title: z.string().trim().min(1, t("v.required")).max(200, t("v.tooLong")),
      amount: z.string().trim().min(1, t("v.required")).refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("v.number")),
      expense_date: z.string().min(1, t("v.required")),
      category: z.string().max(80, t("v.tooLong")),
    }).safeParse(form);
    if (!r.success) return void setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
    setErrors({}); save.mutate(form);
  };

  return (
    <div>
      <PageHeader title={title} editable={editable} onAdd={openNew} />
      <SearchBox value={q} onChange={setQ} />
      <ListCard loading={isLoading} empty={(data ?? []).length === 0} noResults={filtered.length === 0}
        emptyState={<EmptyState icon={Wallet} title={t("exp.empty.title")} body={t("exp.empty.body")} {...(editable ? { cta: t("exp.add"), onCta: openNew } : {})} />}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t("exp.title")}</TableHead>
              <TableHead className="text-start">{t("exp.amount")}</TableHead>
              <TableHead className="text-start">{t("exp.date")}</TableHead>
              <TableHead className="hidden text-start md:table-cell">{t("exp.category")}</TableHead>
              {fields.map((f) => <TableHead key={f.key} className="hidden text-start lg:table-cell">{fieldLabel(f)}</TableHead>)}
              {editable && <TableHead className="text-end">{t("common.actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((x) => (
              <TableRow key={x.id}>
                <TableCell className="font-semibold">{x.title}</TableCell>
                <TableCell className="tabular-nums">{money(Number(x.amount), lang)}</TableCell>
                <TableCell dir="ltr" className="text-start">{x.expense_date}</TableCell>
                <TableCell className="hidden md:table-cell">{x.category}</TableCell>
                {fields.map((f) => <TableCell key={f.key} className="hidden lg:table-cell">{String((x.custom as Record<string, string>)?.[f.key] ?? "")}</TableCell>)}
                {editable && (
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(x)} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(x)} aria-label={t("common.delete")}><Trash2 className="size-4 text-destructive" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell>{t("exp.total")}</TableCell>
              <TableCell className="tabular-nums">{money(total, lang)}</TableCell>
              <TableCell colSpan={2 + fields.length + (editable ? 1 : 0)} />
            </TableRow>
          </TableBody>
        </Table>
      </ListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? t("exp.editTitle") : t("exp.add")}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field id="e-title" label={t("exp.title")} error={errors["title"]}>
              <Input id="e-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="e-amount" label={t("exp.amount")} error={errors["amount"]}>
                <Input id="e-amount" type="number" min="0" step="0.01" dir="ltr" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-12 rounded-xl" />
              </Field>
              <Field id="e-date" label={t("exp.date")} error={errors["expense_date"]}>
                <Input id="e-date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="h-12 rounded-xl" />
              </Field>
            </div>
            <Field id="e-cat" label={t("exp.category")} error={errors["category"]}>
              <Input id="e-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            {fields.map((f) => (
              <Field key={f.key} id={`cf-${f.key}`} label={fieldLabel(f)}>
                <CustomFieldInput field={f} value={form.custom[f.key] ?? ""} onChange={(v) => setForm({ ...form, custom: { ...form.custom, [f.key]: v } })} />
              </Field>
            ))}
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 rounded-xl">{t("common.cancel")}</Button>
              <Button type="submit" disabled={save.isPending} className="h-12 rounded-xl px-8">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDelete open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && del.mutate(toDelete.id)} />
    </div>
  );
}
