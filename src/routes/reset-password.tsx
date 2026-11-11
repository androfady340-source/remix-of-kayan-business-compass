import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/Field";
import { HeaderControls, Logo } from "@/components/HeaderControls";
import { useI18n } from "@/lib/i18n";
import { pageHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Set a new password", "Choose a new password for your Kayan account."),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  // "checking" until the recovery link has been exchanged for a session.
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery") || new URLSearchParams(window.location.search).has("code");
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && isRecovery)) setState("ready");
    });
    const timer = window.setTimeout(async () => {
      const { data: s } = await supabase.auth.getSession();
      setState((cur) => (cur === "ready" ? cur : s.session && isRecovery ? "ready" : "invalid"));
    }, 1500);
    return () => { data.subscription.unsubscribe(); window.clearTimeout(timer); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 6) next["password"] = t("v.password");
    else if (password.length > 72) next["password"] = t("v.tooLong");
    if (confirm !== password) next["confirm"] = t("auth.mismatch");
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return void toast.error(error.message);
    toast.success(t("auth.passwordSaved"));
    window.history.replaceState(null, "", "/reset-password");
    navigate({ to: "/app" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/"><Logo /></Link>
        <HeaderControls />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-soft">
          <h1 className="text-2xl font-extrabold">{t("auth.resetTitle")}</h1>
          {state === "checking" && <p className="mt-4 text-muted-foreground">…</p>}
          {state === "invalid" && (
            <>
              <p role="alert" className="mt-4">{t("auth.linkInvalid")}</p>
              <Button asChild className="mt-6 h-12 w-full rounded-xl"><Link to="/auth">{t("auth.backToSignin")}</Link></Button>
            </>
          )}
          {state === "ready" && (
            <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
              <Field id="new-password" label={t("auth.newPassword")} error={errors["password"]}>
                <Input id="new-password" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
              </Field>
              <Field id="confirm-password" label={t("auth.confirmPassword")} error={errors["confirm"]}>
                <Input id="confirm-password" type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-xl" />
              </Field>
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">{t("auth.savePassword")}</Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
