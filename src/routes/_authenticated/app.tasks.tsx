import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Pencil, Trash2, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/Field";
import { CustomFieldInput } from "@/components/CustomFieldInput";
import { ConfirmDelete, EmptyState, ListCard, PageHeader, SearchBox, matches, todayISO, useModule } from "@/components/ModuleKit";
import { useI18n, type TKey } from "@/lib/i18n";
import { canEditData, canEditTask } from "@/lib/modules";
import { memberName, teamQuery } from "@/lib/team";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/app/tasks")({
  head: () => ({ meta: [{ title: "Tasks | Kayan" }, { name: "description", content: "Track your team's tasks." }] }),
  component: TasksPage,
});

type Task = Tables<"tasks">;
const STATUSES = ["todo", "doing", "done"] as const;
const NONE = "__none";
type FormState = { title: string; assignee_id: string; due_date: string; status: string; custom: Record<string, string> };
const empty: FormState = { title: "", assignee_id: NONE, due_date: "", status: "todo", custom: {} };

function TasksPage() {
  const { t } = useI18n();
  const { ws, cid, fields, title, fieldLabel } = useModule("tasks");
  const qc = useQueryClient();
  const editable = canEditData(ws.role);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<Task | null>(null);

  const { data: team = [] } = useQuery(teamQuery(cid));
  const { data, isLoading } = useQuery({
    queryKey: ["tasks", cid],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("company_id", cid).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const who = (id: string | null) => (id ? memberName(team.find((m) => m.user_id === id)) : "—");
  const today = todayISO();

  const filtered = useMemo(() => (data ?? []).filter((x) => matches(q, [x.title, who(x.assignee_id), x.due_date, t(`tasks.${x.status}` as TKey), ...Object.values((x.custom as Record<string, string>) ?? {})])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, q, team]);

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const row = { title: f.title.trim(), assignee_id: f.assignee_id === NONE ? null : f.assignee_id, due_date: f.due_date || null, status: f.status, custom: f.custom };
      const res = editing ? await supabase.from("tasks").update(row).eq("id", editing.id) : await supabase.from("tasks").insert({ ...row, company_id: cid });
      if (res.error) throw res.error;
    },
    onSuccess: () => { toast.success(t("common.saved")); setOpen(false); qc.invalidateQueries({ queryKey: ["tasks", cid] }); },
    onError: () => toast.error(t("common.error")),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tasks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success(t("common.deleted")); setToDelete(null); qc.invalidateQueries({ queryKey: ["tasks", cid] }); },
    onError: () => toast.error(t("common.error")),
  });

  const openNew = () => { setEditing(null); setForm(empty); setErrors({}); setOpen(true); };
  const openEdit = (x: Task) => {
    setEditing(x);
    setForm({ title: x.title, assignee_id: x.assignee_id ?? NONE, due_date: x.due_date ?? "", status: x.status, custom: (x.custom as Record<string, string>) ?? {} });
    setErrors({}); setOpen(true);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.object({ title: z.string().trim().min(1, t("v.required")).max(200, t("v.tooLong")) }).safeParse(form);
    if (!r.success) return void setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
    setErrors({}); save.mutate(form);
  };

  return (
    <div>
      <PageHeader title={title} editable={editable} onAdd={openNew} />
      <SearchBox value={q} onChange={setQ} />
      <ListCard loading={isLoading} empty={(data ?? []).length === 0} noResults={filtered.length === 0}
        emptyState={<EmptyState icon={ListChecks} title={t("tasks.empty.title")} body={t("tasks.empty.body")} {...(editable ? { cta: t("tasks.add"), onCta: openNew } : {})} />}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t("tasks.title")}</TableHead>
              <TableHead className="text-start">{t("tasks.assignee")}</TableHead>
              <TableHead className="hidden text-start md:table-cell">{t("tasks.due")}</TableHead>
              <TableHead className="text-start">{t("clients.status")}</TableHead>
              {fields.map((f) => <TableHead key={f.key} className="hidden text-start lg:table-cell">{fieldLabel(f)}</TableHead>)}
              <TableHead className="text-end">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((x) => {
              const overdue = x.status !== "done" && !!x.due_date && x.due_date < today;
              return (
                <TableRow key={x.id}>
                  <TableCell className="font-semibold">{x.title}</TableCell>
                  <TableCell>{who(x.assignee_id)}</TableCell>
                  <TableCell dir="ltr" className="hidden text-start md:table-cell">
                    {x.due_date}{overdue && <Badge variant="destructive" className="ms-2">{t("tasks.overdue")}</Badge>}
                  </TableCell>
                  <TableCell><Badge variant={x.status === "done" ? "default" : "secondary"}>{t(`tasks.${x.status}` as TKey)}</Badge></TableCell>
                  {fields.map((f) => <TableCell key={f.key} className="hidden lg:table-cell">{String((x.custom as Record<string, string>)?.[f.key] ?? "")}</TableCell>)}
                  <TableCell className="text-end">
                    {canEditTask(ws.role, ws.userId, x.assignee_id) && <Button variant="ghost" size="icon" onClick={() => openEdit(x)} aria-label={t("common.edit")}><Pencil className="size-4" /></Button>}
                    {editable && <Button variant="ghost" size="icon" onClick={() => setToDelete(x)} aria-label={t("common.delete")}><Trash2 className="size-4 text-destructive" /></Button>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ListCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader><DialogTitle>{editing ? t("tasks.editTitle") : t("tasks.add")}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field id="t-title" label={t("tasks.title")} error={errors["title"]}>
              <Input id="t-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-12 rounded-xl" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="t-assignee" label={t("tasks.assignee")}>
                <Select value={form.assignee_id} disabled={!editable} onValueChange={(v) => setForm({ ...form, assignee_id: v })}>
                  <SelectTrigger id="t-assignee" className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("tasks.unassigned")}</SelectItem>
                    {team.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{memberName(m)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="t-due" label={t("tasks.due")}>
                <Input id="t-due" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="h-12 rounded-xl" />
              </Field>
            </div>
            <Field id="t-status" label={t("clients.status")}>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger id="t-status" className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`tasks.${s}` as TKey)}</SelectItem>)}</SelectContent>
              </Select>
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
