import { createFileRoute, Link } from "@tanstack/react-router";
import { Timer, Smile, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderControls, Logo } from "@/components/HeaderControls";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kayan | كيان — Simple business management" },
      { name: "description", content: "Manage clients, tasks, invoices and expenses. Set up in under 3 minutes, in Arabic or English." },
      { property: "og:title", content: "Kayan | كيان — Simple business management" },
      { property: "og:description", content: "Manage clients, tasks, invoices and expenses. Set up in under 3 minutes." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const benefits = [
    { icon: Timer, title: t("landing.b1.title"), body: t("landing.b1.body") },
    { icon: Smile, title: t("landing.b2.title"), body: t("landing.b2.body") },
    { icon: Users, title: t("landing.b3.title"), body: t("landing.b3.body") },
  ];
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <HeaderControls />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/auth">{t("nav.login")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5">
        <section className="py-16 text-center sm:py-28">
          <span className="inline-block rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">
            {t("app.tagline")}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            {t("landing.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{t("landing.subtitle")}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 rounded-2xl px-10 text-lg">
              <Link to="/auth" search={{ mode: "signup" }}>{t("nav.startFree")}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-14 rounded-2xl px-8 text-lg sm:hidden">
              <Link to="/auth">{t("nav.login")}</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-5 pb-24 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-3xl border bg-card p-7 shadow-soft">
              <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <b.icon className="size-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{b.title}</h3>
              <p className="mt-2 text-muted-foreground">{b.body}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">{t("landing.footer")}</footer>
    </div>
  );
}
