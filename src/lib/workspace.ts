import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyModule, Role } from "./modules";

export type Workspace = {
  userId: string;
  email: string | null;
  company: { id: string; name: string; join_code: string; business_type: string } | null;
  modules: CompanyModule[];
  role: Role | null;
  billingEnabled: boolean;
};

export const workspaceQuery = queryOptions({
  queryKey: ["workspace"],
  queryFn: async (): Promise<Workspace> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("not signed in");
    const uid = u.user.id;
    const { error: inviteError } = await supabase.rpc("accept_invites");
    if (inviteError) throw inviteError;
    const [{ data: profile }, { data: settings }] = await Promise.all([
      supabase.from("profiles").select("current_company_id, language").eq("id", uid).maybeSingle(),
      supabase.from("app_settings").select("billing_enabled").eq("id", 1).maybeSingle(),
    ]);
    let companyId = profile?.current_company_id ?? null;
    if (!companyId) {
      const { data: mem } = await supabase.from("company_members").select("company_id").eq("user_id", uid).limit(1);
      companyId = mem?.[0]?.company_id ?? null;
    }
    const base = { userId: uid, email: u.user.email ?? null, billingEnabled: !!settings?.billing_enabled };
    if (!companyId) return { ...base, company: null, modules: [], role: null };
    const [{ data: company }, { data: modules }, { data: roles }] = await Promise.all([
      supabase.from("companies").select("id, name, join_code, business_type").eq("id", companyId).maybeSingle(),
      supabase.from("company_modules").select("*").eq("company_id", companyId).order("sort_order"),
      supabase.from("user_roles").select("role").eq("company_id", companyId).eq("user_id", uid),
    ]);
    const rs = (roles ?? []).map((r) => r.role);
    const role: Role | null = rs.includes("owner") ? "owner" : rs.includes("manager") ? "manager" : rs.includes("member") ? "member" : null;
    return { ...base, company: company ?? null, modules: (modules ?? []) as unknown as CompanyModule[], role };
  },
});

export const useWorkspace = () => useSuspenseQuery(workspaceQuery).data;
