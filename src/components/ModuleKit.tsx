import type { ReactNode } from "react";
import { Plus, Search, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { moduleLabel, type CustomField, type ModuleKey } from "@/lib/modules";
import { useWorkspace } from "@/lib/workspace";

export function useModule(key: ModuleKey) {
  const { t, lang } = useI18n();
  const ws = useWorkspace();
  const mod = ws.modules.find((m) => m.module_key === key);
  const fields: CustomField[] = mod?.custom_fields ?? [];
  const title = mod ? moduleLabel(mod, lang, t) : t(`mod.${key}`);
  const fieldLabel = (f: CustomField) => (lang === "ar" ? f.label_ar : f.label_en) || f.label_ar || f.label_en;
  return { ws, cid: ws.company!.id, fields, title, fieldLabel };
}

export function matches(q: string, values: unknown[]) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return values.some((v) => String(v ?? "").toLowerCase().includes(s));
}

export function PageHeader({ title, editable, onAdd, extra }: { title: string; editable: boolean; onAdd: () => void; extra?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
      <div className="flex items-center gap-2">
        {extra}
        {editable ? (
          <Button onClick={onAdd} className="h-12 gap-2 rounded-xl px-5 text-base"><Plus className="size-5" />{t("common.add")}</Button>
        ) : (
          <Badge variant="secondary">{t("common.viewOnly")}</Badge>
        )}
      </div>
    </div>
  );
}

export function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="relative mt-6">
      <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={t("common.search")} className="h-12 rounded-xl ps-12" />
    </div>
  );
}

export function ListCard({ loading, empty, noResults, emptyState, children }: { loading: boolean; empty: boolean; noResults: boolean; emptyState: ReactNode; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border bg-card shadow-soft">
      {loading ? (
        <div className="space-y-3 p-6">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
      ) : empty ? emptyState : noResults ? (
        <p className="p-10 text-center text-muted-foreground">{t("common.noResults")}</p>
      ) : children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, cta, onCta }: { icon: LucideIcon; title: string; body: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-16 place-items-center rounded-3xl bg-primary-soft text-primary"><Icon className="size-8" /></span>
      <h2 className="mt-5 text-xl font-bold">{title}</h2>
      <p className="mt-2 max-w-sm text-muted-foreground">{body}</p>
      {cta && onCta && <Button onClick={onCta} className="mt-6 h-12 gap-2 rounded-xl px-6"><Plus className="size-5" />{cta}</Button>}
    </div>
  );
}

export function ConfirmDelete({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="rounded-3xl">
        <AlertDialogHeader><AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle></AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("common.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const money = (n: number, lang: "ar" | "en") =>
  new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 }).format(n);

export const todayISO = () => new Date().toISOString().slice(0, 10);
