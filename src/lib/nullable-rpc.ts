import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Functions = Database['public']['Functions'];
type NullableArgument<F extends { Args: object }, K extends keyof F['Args']> =
  Omit<F, 'Args'> & { Args: Omit<F['Args'], K> & { [P in K]: F['Args'][P] | null } };

// Generated RPC types omit SQL argument nullability. Keep the correction local
// without changing the generated client or sending an invalid empty UUID/date.
type RpcDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: Omit<Functions, 'save_invoice' | 'admin_update_subscription'> & {
      save_invoice: NullableArgument<Functions['save_invoice'], '_id'>;
      admin_update_subscription: NullableArgument<Functions['admin_update_subscription'], '_ends_at'>;
    };
  };
};

export const nullableRpcClient = supabase as SupabaseClient<RpcDatabase>;