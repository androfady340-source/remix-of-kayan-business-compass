import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Briefcase, Store, Laptop, Wrench, Shapes, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { HeaderControls, Logo } from "@/components/HeaderControls";
import { useI18n, type TKey } from "@/lib/i18n";
import { BUSINESS_TYPES, DEFAULT_MODULES, MODULE_KEYS, type BusinessType, type ModuleKey } from "@/lib/modules";
import { workspaceQuery } from "@/lib/workspace";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { accessQuery } from "@/lib/subscriptions";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your workspace | Kayan" }, { name: "description", content: "Create your Kayan workspace in 3 steps." }] }),
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.fetchQuery(accessQuery);
    if (access.isAdmin) throw redirect({ to: "/admin" });
    if (!access.active) throw redirect({ to: "/subscription" });
    const ws = await context.queryClient.fetchQuery(workspaceQuery);
    if (ws.company) throw redirect({ to: "/app" });
  },
  component: Onboarding,
});

const icons: Record<BusinessType, typeof Briefcase> = { services: Briefcase, shop: Store, freelancer: Laptop, workshop: Wrench, other: Shapes };

function Onboarding() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [type, setType] = useState<BusinessType | null>(null);
  const [mods, setMods] = useState<ModuleKey[]>([]);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");

  const next1 = () => {
    const v = name.trim();
    if (!v) return void setNameErr(t("v.required"));
    if (v.length > 100) return void setNameErr(t("v.tooLong"));
    setNameErr("");
    setStep(2);
  };
  const pickType = (bt: BusinessType) => {
    setType(bt);
    setMods(DEFAULT_MODULES[bt]);
    setStep(3);
  };
  const finish = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("create_company", { _name: name.trim(), _business_type: type ?? "other", _modules: mods });
    setBusy(false);
    if (error) return void toast.error(t("common.error"));
    await qc.invalidateQueries({ queryKey: ["workspace"] });
    navigate({ to: "/app" });
  };
  const join = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await supabase.rpc("join_company", { _code: code.trim() });
    setBusy(false);
    if (error) return void toast.error(t("onb.invalidCode"));
    await qc.invalidateQueries({ queryKey: ["workspace"] });
    navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5">
        <Logo />
        <HeaderControls />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 px-5 pb-16 pt-6">
        <div className="mb-8 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className={cn("h-2 flex-1 rounded-full", n <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <p className="text-sm font-semibold text-muted-foreground">{t("onb.step", { n: step })}</p>

        {step === 1 && (
          <div className="mt-2">
            <h1 className="text-3xl font-extrabold">{t("onb.s1.title")}</h1>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && next1()}
              placeholder={t("onb.s1.placeholder")} className="mt-6 h-14 rounded-2xl text-lg" />
            {nameErr && <p className="mt-2 text-sm text-destructive">{nameErr}</p>}
            <Button onClick={next1} className="mt-6 h-14 w-full rounded-2xl text-lg">{t("onb.next")}</Button>

            <div className="mt-12 rounded-2xl border bg-card p-5">
              <p className="font-semibold">{t("onb.join")}</p>
              <div className="mt-3 flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("onb.joinCode")} dir="ltr" className="h-12 rounded-xl uppercase" />
                <Button variant="secondary" onClick={join} disabled={busy} className="h-12 rounded-xl px-6">{t("onb.joinBtn")}</Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-2">
            <h1 className="text-3xl font-extrabold">{t("onb.s2.title")}</h1>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {BUSINESS_TYPES.map((bt) => {
                const Icon = icons[bt];
                return (
                  <button key={bt} onClick={() => pickType(bt)}
                    className={cn("flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-lg font-bold transition hover:border-primary",
                      type === bt && "border-primary bg-primary-soft", bt === "other" && "col-span-2")}>
                    <Icon className="size-7 text-primary" />
                    {t(`bt.${bt}` as TKey)}
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" onClick={() => setStep(1)} className="mt-6 h-12 w-full rounded-2xl">{t("onb.back")}</Button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-2">
            <h1 className="text-3xl font-extrabold">{t("onb.s3.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("onb.s3.sub")}</p>
            <div className="mt-6 space-y-3">
              {MODULE_KEYS.map((m) => {
                const on = mods.includes(m);
                return (
                  <label key={m} className={cn("flex cursor-pointer items-center justify-between rounded-2xl border bg-card p-5", on && "border-primary")}>
                    <span className="flex items-center gap-3 text-lg font-semibold">
                      {on && <Check className="size-5 text-primary" />}
                      {t(`mod.${m}` as TKey)}
                    </span>
                    <Switch checked={on} onCheckedChange={(c) => setMods(c ? [...mods, m] : mods.filter((x) => x !== m))} />
                  </label>
                );
              })}
            </div>
            <Button onClick={finish} disabled={busy || mods.length === 0} className="mt-6 h-14 w-full rounded-2xl text-lg">{t("onb.create")}</Button>
            <Button variant="ghost" onClick={() => setStep(2)} className="mt-2 h-12 w-full rounded-2xl">{t("onb.back")}</Button>
          </div>
        )}
      </main>
    </div>
  );
}
