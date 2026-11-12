import { pageHead } from "@/lib/seo";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Plus, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useI18n, type TKey } from "@/lib/i18n";
import { MAX_CUSTOM_FIELDS, canManageSettings, type CompanyModule, type CustomField, type FieldType } from "@/lib/modules";
import { useWorkspace, workspaceQuery } from "@/lib/workspace";
import { supabase } from "@/integrations/supabase/client";
import { TeamSettings } from "@/components/TeamSettings";
import type { Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/app/settings")({
  head: () => pageHead("Settings", "Manage your Kayan workspace and team settings."),
  beforeLoad: async ({ context }) => {
    const ws = await context.queryClient.ensureQueryData(workspaceQuery);
    if (!canManageSettings(ws.role)) throw redirect({ to: "/app" });
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const ws = useWorkspace();
  const qc = useQueryClient();
  const cid = ws.company!.id;
  const refresh = () => qc.invalidateQueries({ queryKey: ["workspace"] });

  const loadSample = async () => {
    const { error } = await supabase.rpc("manage_sample_data", { _company: cid, _clear: false });
    if (error) return void toast.error(t("common.error"));
    toast.success(t("common.saved"));
    qc.invalidateQueries();
  };
  const clearSample = async () => {
    const { error } = await supabase.rpc("manage_sample_data", { _company: cid, _clear: true });
    if (error) return void toast.error(t("common.error"));
    toast.success(t("common.deleted"));
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("nav.settings")}</h1>

      <section className="rounded-3xl border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-bold">{t("set.modules")}</h2>
        <p className="text-sm text-muted-foreground">{t("set.modulesSub")}</p>
        <div className="mt-5 space-y-3">
          {ws.modules.map((m) => <ModuleRow key={m.id} m={m} onSaved={refresh} />)}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-bold">{t("set.team")}</h2>
        <p className="text-sm text-muted-foreground">{t("set.teamSub")}</p>
        <div className="mt-4 flex items-center gap-2">
          <code dir="ltr" className="rounded-xl bg-muted px-5 py-3 text-xl font-bold tracking-widest">{ws.company!.join_code}</code>
          <Button variant="secondary" className="h-12 gap-2 rounded-xl" onClick={() => { navigator.clipboard.writeText(ws.company!.join_code); toast.success(t("set.copied")); }}>
            <Copy className="size-4" />{t("set.copy")}
          </Button>
        </div>
        <TeamSettings cid={cid} userId={ws.userId} />
      </section>

      <section className="rounded-3xl border bg-card p-6 shadow-soft">
        <h2 className="text-lg font-bold">{t("set.sample")}</h2>
        <p className="text-sm text-muted-foreground">{t("set.sampleSub")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={loadSample} className="h-12 rounded-xl">{t("set.loadSample")}</Button>
          <Button onClick={clearSample} variant="outline" className="h-12 rounded-xl">{t("set.clearSample")}</Button>
        </div>
      </section>
    </div>
  );
}

function ModuleRow({ m, onSaved }: { m: CompanyModule; onSaved: () => void }) {
  const { t } = useI18n();
  const [nameAr, setNameAr] = useState(m.name_ar ?? "");
  const [nameEn, setNameEn] = useState(m.name_en ?? "");
  const [fields, setFields] = useState<CustomField[]>(m.custom_fields ?? []);
  const [saving, setSaving] = useState(false);

  const update = async (patch: { enabled?: boolean; name_ar?: string | null; name_en?: string | null; custom_fields?: Json }) => {
    setSaving(true);
    const { error } = await supabase.from("company_modules").update(patch).eq("id", m.id);
    setSaving(false);
    if (error) return void toast.error(t("common.error"));
    toast.success(t("common.saved"));
    onSaved();
  };
  const saveAll = () =>
    update({
      name_ar: nameAr.trim().slice(0, 50) || null,
      name_en: nameEn.trim().slice(0, 50) || null,
      custom_fields: fields
        .filter((f) => f.label_ar.trim() || f.label_en.trim())
        .map((f) => ({ ...f, label_ar: f.label_ar.trim().slice(0, 50), label_en: f.label_en.trim().slice(0, 50) })) as unknown as Json,
    });
  const setField = (i: number, p: Partial<CustomField>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...p } : f)));

  return (
    <Collapsible className="rounded-2xl border">
      <div className="flex items-center justify-between gap-3 p-4">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-start font-semibold">
          <ChevronDown className="size-4 text-muted-foreground" />
          {(m.name_ar || m.name_en) ? `${t(`mod.${m.module_key}` as TKey)} → ${[m.name_ar, m.name_en].filter(Boolean).join(" / ")}` : t(`mod.${m.module_key}` as TKey)}
        </CollapsibleTrigger>
        <Switch checked={m.enabled} disabled={saving} onCheckedChange={(c) => update({ enabled: c })} />
      </div>
      <CollapsibleContent className="space-y-5 border-t p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>{t("set.nameAr")}</Label><Input dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder={t(`mod.${m.module_key}` as TKey)} className="h-11 rounded-xl" /></div>
          <div className="space-y-1.5"><Label>{t("set.nameEn")}</Label><Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="h-11 rounded-xl" /></div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>{t("set.customFields")}</Label>
            <Button size="sm" variant="secondary" className="gap-1 rounded-lg" disabled={fields.length >= MAX_CUSTOM_FIELDS}
              onClick={() => setFields([...fields, { key: `f${Date.now().toString(36)}`, label_ar: "", label_en: "", type: "text" }])}>
              <Plus className="size-4" />{t("set.addField")}
            </Button>
          </div>
          {fields.length >= MAX_CUSTOM_FIELDS && <p className="mt-1 text-xs text-muted-foreground">{t("set.maxFields")}</p>}
          <div className="mt-3 space-y-3">
            {fields.map((f, i) => (
              <div key={f.key} className="space-y-2 rounded-xl bg-muted p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem_auto]">
                  <Input dir="rtl" placeholder={t("set.nameAr")} value={f.label_ar} onChange={(e) => setField(i, { label_ar: e.target.value })} className="rounded-lg bg-background" />
                  <Input dir="ltr" placeholder={t("set.nameEn")} value={f.label_en} onChange={(e) => setField(i, { label_en: e.target.value })} className="rounded-lg bg-background" />
                  <Select value={f.type} onValueChange={(v) => setField(i, { type: v as FieldType })}>
                    <SelectTrigger className="rounded-lg bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>{(["text", "number", "date", "select"] as const).map((ft) => <SelectItem key={ft} value={ft}>{t(`ft.${ft}` as TKey)}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => setFields(fields.filter((_, j) => j !== i))}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
                {f.type === "select" && (
                  <Input placeholder={t("set.options")} value={(f.options ?? []).join(", ")} onChange={(e) => setField(i, { options: e.target.value.split(",").map((s) => s.trim()) })} className="rounded-lg bg-background" />
                )}
              </div>
            ))}
          </div>
        </div>
        <Button onClick={saveAll} disabled={saving} className="h-11 rounded-xl px-8">{t("common.save")}</Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
