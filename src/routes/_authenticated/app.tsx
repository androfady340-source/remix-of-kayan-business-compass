import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Users, ListChecks, Receipt, Wallet, Package, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderControls, Logo } from "@/components/HeaderControls";
import { useI18n } from "@/lib/i18n";
import { canManageSettings, moduleLabel, type ModuleKey } from "@/lib/modules";
import { useWorkspace, workspaceQuery } from "@/lib/workspace";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { accessQuery } from "@/lib/subscriptions";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.fetchQuery(accessQuery);
    if (access.isAdmin) throw redirect({ to: "/admin" });
    if (!access.active) throw redirect({ to: "/subscription" });
    const ws = await context.queryClient.ensureQueryData(workspaceQuery);
    if (!ws.company) throw redirect({ to: "/onboarding" });
  },
  component: AppLayout,
});

const MODULE_PATHS = { clients: "/app/clients", tasks: "/app/tasks", invoices: "/app/invoices", expenses: "/app/expenses", inventory: "/app/inventory" } as const;

const MODULE_ICONS: Record<ModuleKey, typeof Users> = { clients: Users, tasks: ListChecks, invoices: Receipt, expenses: Wallet, inventory: Package };

function AppLayout() {
  const { t, lang } = useI18n();
  const ws = useWorkspace();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const items = [
    { to: "/app" as const, label: t("nav.dashboard"), icon: LayoutDashboard, soon: false, exact: true },
    ...ws.modules.filter((m) => m.enabled).map((m) => ({
      to: MODULE_PATHS[m.module_key],
      label: moduleLabel(m, lang, t),
      icon: MODULE_ICONS[m.module_key],
      soon: false,
      exact: false,
    })),
    ...(canManageSettings(ws.role) ? [{ to: "/app/settings" as const, label: t("nav.settings"), icon: Settings, soon: false, exact: false }] : []),
  ];

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e bg-sidebar p-4 md:flex">
        <div className="px-2 py-2"><Logo /></div>
        <p className="mt-1 truncate px-2 text-sm text-muted-foreground">{ws.company?.name}</p>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {items.map((i) =>
            i.soon ? (
              <span key={i.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground opacity-60">
                <i.icon className="size-5" />{i.label}
                <span className="ms-auto rounded-full bg-muted px-2 py-0.5 text-xs">{t("mod.soon")}</span>
              </span>
            ) : (
              <Link key={i.to} to={i.to} activeOptions={{ exact: i.exact }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-sidebar-foreground transition hover:bg-sidebar-accent"
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}>
                <i.icon className="size-5" />{i.label}
              </Link>
            ),
          )}
        </nav>
        <Button variant="ghost" onClick={signOut} className="justify-start gap-3"><LogOut className="size-5" />{t("nav.logout")}</Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-5 py-3 backdrop-blur">
          <div className="md:hidden"><Logo /></div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <HeaderControls />
            <Button variant="ghost" size="icon" onClick={signOut} className="md:hidden" aria-label={t("nav.logout")}><LogOut className="size-4" /></Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-28 pt-6 md:pb-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t bg-background md:hidden">
        {items.filter((i) => !i.soon).map((i) => (
          <Link key={i.to} to={i.to} activeOptions={{ exact: i.exact }}
            className={cn("flex min-w-20 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-xs text-muted-foreground")}
            activeProps={{ className: "text-primary font-semibold" }}>
            <i.icon className="size-5" />{i.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
