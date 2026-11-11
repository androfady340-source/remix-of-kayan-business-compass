import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TeamMember = { user_id: string; email: string | null; full_name: string | null; role: "owner" | "manager" | "member" | "super_admin" | null };

export const teamQuery = (cid: string) =>
  queryOptions({
    queryKey: ["team", cid],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data, error } = await supabase.rpc("company_team", { _company: cid });
      if (error) throw error;
      return (data ?? []) as TeamMember[];
    },
  });

export const memberName = (m: TeamMember | undefined) => m?.full_name?.trim() || m?.email || "—";
