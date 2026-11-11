import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/Field";
import { HeaderControls, Logo } from "@/components/HeaderControls";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } => (s["mode"] === "signup" ? { mode: "signup" } : {}),
  head: () => ({
    meta: [
      { title: "Log in | Kayan" },
      { name: "description", content: "Log in or create your Kayan account." },
      { property: "og:title", content: "Log in | Kayan" },
      { property: "og:description", content: "Log in or create your Kayan account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(search.mode === "signup" ? "signup" : "signin");
  const [resetSent, setResetSent] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.string().trim().min(1, t("v.required")).email(t("v.email")).max(255, t("v.tooLong")).safeParse(email);
    if (!r.success) return void setErrors({ email: r.error.issues[0]?.message ?? t("v.email") });
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(r.data, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) return void toast.error(error.message);
    setResetSent(true);
  };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  const resend = async () => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email: email.trim(), options: { emailRedirectTo: window.location.origin + "/auth" } });
    setLoading(false);
    if (error) return void toast.error(error.message);
    toast.success(t("auth.resent"));
    setCooldown(60);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = z.object({
      email: z.string().trim().min(1, t("v.required")).email(t("v.email")).max(255, t("v.tooLong")),
      password: z.string().min(6, t("v.password")).max(72, t("v.tooLong")),
      name: mode === "signup" ? z.string().trim().min(1, t("v.required")).max(100, t("v.tooLong")) : z.string().optional(),
    });
    const r = schema.safeParse({ email, password, name });
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    setLoading(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: r.data.email,
        password,
        options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: name.trim(), language: lang, ...(joinCode.trim() ? { join_code: joinCode.trim().toUpperCase() } : {}) } },
      });
      setLoading(false);
      if (error) return void toast.error(error.message);
      if (data.session) navigate({ to: "/app" });
      else { setSent(true); setCooldown(60); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: r.data.email, password });
      setLoading(false);
      if (error) return void toast.error(error.message);
      navigate({ to: "/app" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link to="/"><Logo /></Link>
        <HeaderControls />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-soft">
          {sent ? (
            <div className="space-y-5 text-center">
              <p className="text-lg">{t("auth.checkEmail")}</p>
              <Button variant="outline" disabled={loading || cooldown > 0} onClick={resend} className="h-12 w-full rounded-xl">
                {cooldown > 0 ? t("auth.resendIn", { n: cooldown }) : t("auth.resend")}
              </Button>
            </div>
          ) : mode === "forgot" ? (
            <>
              <h1 className="text-2xl font-extrabold">{t("auth.forgotTitle")}</h1>
              {resetSent ? (
                <p role="status" className="mt-4 text-lg">{t("auth.resetSent")}</p>
              ) : (
                <>
                  <p className="mt-1 text-muted-foreground">{t("auth.forgotSub")}</p>
                  <form onSubmit={requestReset} className="mt-7 space-y-4" noValidate>
                    <Field id="reset-email" label={t("auth.email")} error={errors["email"]}>
                      <Input id="reset-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
                    </Field>
                    <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">{t("auth.sendReset")}</Button>
                  </form>
                </>
              )}
              <p className="mt-6 text-center text-sm">
                <button className="font-semibold text-primary" onClick={() => { setMode("signin"); setResetSent(false); setErrors({}); }}>{t("auth.backToSignin")}</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold">{mode === "signin" ? t("auth.welcome") : t("auth.signup")}</h1>
              <p className="mt-1 text-muted-foreground">{mode === "signin" ? t("auth.welcomeSub") : t("auth.createSub")}</p>
              <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                {mode === "signup" && (
                  <Field id="name" label={t("auth.fullName")} error={errors["name"]}>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
                  </Field>
                )}
                {mode === "signup" && (
                  <Field id="join-code" label={t("auth.joinCode")}>
                    <Input id="join-code" dir="ltr" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="h-12 rounded-xl uppercase" />
                    <p className="mt-1 text-xs text-muted-foreground">{t("auth.joinHint")}</p>
                  </Field>
                )}
                <Field id="email" label={t("auth.email")} error={errors["email"]}>
                  <Input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
                </Field>
                <Field id="password" label={t("auth.password")} error={errors["password"]}>
                  <Input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </Field>
                {mode === "signin" && (
                  <div className="-mt-2 text-end">
                    <button type="button" className="text-sm font-medium text-primary" onClick={() => { setMode("forgot"); setErrors({}); }}>{t("auth.forgot")}</button>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl text-base">
                  {mode === "signin" ? t("auth.signin") : t("auth.signup")}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                <button className="font-semibold text-primary" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}>
                  {mode === "signin" ? t("auth.signup") : t("auth.signin")}
                </button>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
