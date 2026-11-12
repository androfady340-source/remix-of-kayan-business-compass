export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      account_access: {
        Row: {
          approval_status: string
          plan: string | null
          reviewed_at: string | null
          subscription_ends_at: string | null
          user_id: string
        }
        Insert: {
          approval_status?: string
          plan?: string | null
          reviewed_at?: string | null
          subscription_ends_at?: string | null
          user_id: string
        }
        Update: {
          approval_status?: string
          plan?: string | null
          reviewed_at?: string | null
          subscription_ends_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          billing_enabled: boolean
          id: number
          site_owner_email: string | null
        }
        Insert: {
          billing_enabled?: boolean
          id?: number
          site_owner_email?: string | null
        }
        Update: {
          billing_enabled?: boolean
          id?: number
          site_owner_email?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          custom: Json
          email: string | null
          id: string
          is_sample: boolean
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          email?: string | null
          id?: string
          is_sample?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          email?: string | null
          id?: string
          is_sample?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          business_type: string
          created_at: string
          id: string
          join_code: string
          name: string
          owner_id: string
          plan: string
          subscription_ends_at: string | null
          subscription_status: string
          trial_ends_at: string
        }
        Insert: {
          business_type?: string
          created_at?: string
          id?: string
          join_code?: string
          name: string
          owner_id: string
          plan?: string
          subscription_ends_at?: string | null
          subscription_status?: string
          trial_ends_at?: string
        }
        Update: {
          business_type?: string
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          owner_id?: string
          plan?: string
          subscription_ends_at?: string | null
          subscription_status?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
      company_invites: {
        Row: {
          company_id: string
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          company_id: string
          created_at?: string
          email: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "company_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_modules: {
        Row: {
          company_id: string
          custom_fields: Json
          enabled: boolean
          id: string
          module_key: string
          name_ar: string | null
          name_en: string | null
          sort_order: number
        }
        Insert: {
          company_id: string
          custom_fields?: Json
          enabled?: boolean
          id?: string
          module_key: string
          name_ar?: string | null
          name_en?: string | null
          sort_order?: number
        }
        Update: {
          company_id?: string
          custom_fields?: Json
          enabled?: boolean
          id?: string
          module_key?: string
          name_ar?: string | null
          name_en?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custom: Json
          expense_date: string
          id: string
          is_sample: boolean
          title: string
        }
        Insert: {
          amount?: number
          category?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          expense_date?: string
          id?: string
          is_sample?: boolean
          title: string
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          expense_date?: string
          id?: string
          is_sample?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          custom: Json
          id: string
          is_sample: boolean
          low_stock_level: number
          price: number
          product: string
          quantity: number
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          id?: string
          is_sample?: boolean
          low_stock_level?: number
          price?: number
          product: string
          quantity?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          id?: string
          is_sample?: boolean
          low_stock_level?: number
          price?: number
          product?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          company_id: string
          id: string
          invoice_id: string
          is_sample: boolean
          name: string
          price: number
          qty: number
        }
        Insert: {
          company_id: string
          id?: string
          invoice_id: string
          is_sample?: boolean
          name: string
          price?: number
          qty?: number
        }
        Update: {
          company_id?: string
          id?: string
          invoice_id?: string
          is_sample?: boolean
          name?: string
          price?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custom: Json
          id: string
          is_sample: boolean
          issue_date: string
          status: string
          total: number
        }
        Insert: {
          client_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          id?: string
          is_sample?: boolean
          issue_date?: string
          status?: string
          total?: number
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          id?: string
          is_sample?: boolean
          issue_date?: string
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          current_company_id: string | null
          email: string | null
          full_name: string | null
          id: string
          language: string
        }
        Insert: {
          created_at?: string
          current_company_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          language?: string
        }
        Update: {
          created_at?: string
          current_company_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_company_id_fkey"
            columns: ["current_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          months: number
          plan: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transfer_reference: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          months: number
          plan: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transfer_reference: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          months?: number
          plan?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transfer_reference?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          custom: Json
          due_date: string | null
          id: string
          is_sample: boolean
          status: string
          title: string
        }
        Insert: {
          assignee_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          due_date?: string | null
          id?: string
          is_sample?: boolean
          status?: string
          title: string
        }
        Update: {
          assignee_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          custom?: Json
          due_date?: string | null
          id?: string
          is_sample?: boolean
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          company_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invites: { Args: never; Returns: string }
      admin_list_companies: {
        Args: never
        Returns: {
          created_at: string
          id: string
          members_count: number
          name: string
          owner_email: string
          plan: string
          subscription_ends_at: string
          subscription_status: string
          trial_ends_at: string
        }[]
      }
      admin_review_account: {
        Args: { _approve: boolean; _user: string }
        Returns: undefined
      }
      admin_review_payment: {
        Args: { _approve: boolean; _payment: string }
        Returns: undefined
      }
      admin_site_accounts: {
        Args: never
        Returns: {
          approval_status: string
          created_at: string
          email: string
          full_name: string
          plan: string
          subscription_ends_at: string
          team_company: string
          user_id: string
        }[]
      }
      admin_update_subscription: {
        Args: {
          _company: string
          _ends_at: string
          _plan: string
          _status: string
        }
        Returns: undefined
      }
      can_edit_company: { Args: { _company: string }; Returns: boolean }
      company_is_active: { Args: { _company: string }; Returns: boolean }
      company_team: {
        Args: { _company: string }
        Returns: {
          email: string
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      complete_account_onboarding: { Args: never; Returns: string }
      create_company: {
        Args: { _business_type: string; _modules: string[]; _name: string }
        Returns: string
      }
      has_company_role: {
        Args: {
          _company: string
          _roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: boolean
      }
      has_site_access: { Args: never; Returns: boolean }
      is_company_member: { Args: { _company: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      join_company: { Args: { _code: string }; Returns: string }
      manage_sample_data: {
        Args: { _clear: boolean; _company: string }
        Returns: undefined
      }
      remove_member: {
        Args: { _company: string; _user: string }
        Returns: undefined
      }
      save_invoice: {
        Args: {
          _client: string
          _company: string
          _custom: Json
          _date: string
          _id: string
          _items: Json
          _status: string
        }
        Returns: string
      }
      set_member_role: {
        Args: {
          _company: string
          _role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: undefined
      }
      submit_subscription_payment: {
        Args: { _plan: string; _reference: string }
        Returns: string
      }
      user_has_paid_access: { Args: { _user: string }; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "manager" | "member" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "manager", "member", "super_admin"],
    },
  },
} as const
