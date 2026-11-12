import { pageHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/Field";
import { CustomFieldInput } from "@/components/CustomFieldInput";
import { ConfirmDelete, EmptyState, ListCard, PageHeader, SearchBox, matches, money, useModule } from "@/components/ModuleKit";
import { useI18n } from "@/lib/i18n";
import { canEditData, isLowStock } from "@/lib/modules";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/app/inventory")({
  head: () => pageHead("Inventory", "Track your Kayan stock and inventory."),
  component: InventoryPage,
});

type Item = Tables<"inventory_items">;
type FormState = { product: string; quantity: string; price: string; low_stock_level: string; custom: Record<string, string> };
const empty: FormState = { product: "", quantity: "0", price: "0", low_stock_level: "0", custom: {} };
const num = (msg: string) => z.string().trim().refine((v) => v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0, msg);

function InventoryPage() {
  const { t, lang } = useI18n();
  const { ws, cid, fields, title, fieldLabel } = useModule("inventory");
  const qc = useQueryClient();
  const editable = canEditData(ws.role);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Item | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", cid],
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory_items").select("*").eq("company_id", cid).order("product");
      if (error) throw error;
      return data;
    },
  });
  const filtered = useMemo(() => (data ?? []).filter((x) => matches(q, [x.product, x.quantity, x.price, ...Object.values((x.custom as Record<string, string>) ?? {})])), [data, q]);

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const row = { product: f.product.trim(), quantity: Number(f.quantity), price: Number(f.price), low_stock_level: Number(f.low_stock_level), custom: f.custom };
      const res = editing ? await supabase.from("inventory_items").update(row).eq("id", editing.id) : await supabase.from("inventory_items").insert({ ...row, company_id: cid });
      if (res.error) throw res.error;
    },
    onSuccess: () => { toast.success(t("common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["inventory", cid] }); },
    onError: () => toast.error(t("common.error")),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("inventory_items").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success(t("common.deleted")); setToDelete(null); qc.invalidateQueries({ queryKey: ["inventory", cid] }); },
    onError: () => toast.error(t("common.error")),
  });

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpen(true); };
  const openEdit = (x: Item) => {
    setEditing(x);
    setForm({ product: x.product, quantity: String(x.quantity), price: String(x.price), low_stock_level: String(x.low_stock_level), custom: (x.custom as Record<string, string>) ?? {} });
    setErrors({}); setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.object({
      product: z.string().trim().min(1, t("v.required")).max(200, t("v.tooLong")),
      quantity: num(t("v.number")), price: num(t("v.number")), low_stock_level: num(t("v.number")),
    }).safeParse(form);
    if (!r.success) return void setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
    setErrors({}); save.mutate(form);
  };

  return (
    <div>
      <PageHeader title={title} editable={editable} onAdd={openNew} />
      <SearchBox value={q} onChange={setQ} />
      <ListCard loading={isLoading} empty={(data ?? []).length === 0} noResults={filtered.length === 0}
        emptyState={<EmptyState icon={Package} title={t("inv.empty.title")} body={t("inv.empty.body")} {...(editable ? { cta: t("inv.add"), onCta: openNew } : {})} />}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t("inv.product")}</TableHead>
              <TableHead className="text-start">{t("inv.quantity")}</TableHead>
              <TableHead className="text-start">{t("inv.price")}</TableHead>
              <TableHead className="hidden text-start md:table-cell">{t("inv.lowLevel")}</TableHead>
              {fields.map((f) => <TableHead key={f.key} className="hidden text-start lg:table-cell">{fieldLabel(f)}</TableHead>)}
              {editable && <TableHead className="text-end">{t("common.actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((x) => (
              <TableRow key={x.id}>
                <TableCell className="font-semibold">{x.product}</TableCell>
                <TableCell className="tabular-nums">
                  {x.quantity}
                  {isLowStock(x.quantity, x.low_stock_level) && <Badge variant="destructive" className="ms-2">{t("inv.low")}</Badge>}
                </TableCell>
                <TableCell className="tabular-nums">{money(Number(x.price), lang)}</TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{x.low_stock_level}</TableCell>
                {fields.map((f) => <TableCell key={f.key} className="hidden lg:table-cell">{String((x.custom as Record<string, string>)?.[f.key] ?? "")}</TableCell>)}
                {editable && (
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(x)} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(x)} aria-label={t("common.delete")}><Trash2 className="size-4 text-destructive" /></Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? t("inv.editTitle") : t("inv.add")}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field id="i-product" label={t("inv.product")} error={errors["product"]}>
              <Input id="i-product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["quantity", "price", "low_stock_level"] as const).map((k) => (
                <Field key={k} id={`i-${k}`} label={t(k === "quantity" ? "inv.quantity" : k === "price" ? "inv.price" : "inv.lowLevel")} error={errors[k]}>
                  <Input id={`i-${k}`} type="number" min="0" step="any" dir="ltr" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-12 rounded-xl" />
                </Field>
              ))}
            </div>
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
