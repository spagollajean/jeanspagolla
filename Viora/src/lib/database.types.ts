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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      coach_assessments: {
        Row: {
          ai_raw_response: string | null
          ai_structured: Json | null
          biotype: string | null
          created_at: string | null
          diet_plan: string | null
          estimated_body_fat: number | null
          goal_suggestion: string | null
          id: string
          image_url: string | null
          muscle_mass_level: string | null
          source: string | null
          updated_at: string | null
          used_free_quota: boolean | null
          user_id: string | null
          workout_plan: string | null
        }
        Insert: {
          ai_raw_response?: string | null
          ai_structured?: Json | null
          biotype?: string | null
          created_at?: string | null
          diet_plan?: string | null
          estimated_body_fat?: number | null
          goal_suggestion?: string | null
          id?: string
          image_url?: string | null
          muscle_mass_level?: string | null
          source?: string | null
          updated_at?: string | null
          used_free_quota?: boolean | null
          user_id?: string | null
          workout_plan?: string | null
        }
        Update: {
          ai_raw_response?: string | null
          ai_structured?: Json | null
          biotype?: string | null
          created_at?: string | null
          diet_plan?: string | null
          estimated_body_fat?: number | null
          goal_suggestion?: string | null
          id?: string
          image_url?: string | null
          muscle_mass_level?: string | null
          source?: string | null
          updated_at?: string | null
          used_free_quota?: boolean | null
          user_id?: string | null
          workout_plan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_analyses: {
        Row: {
          ai_raw_response: string | null
          ai_structured: Json | null
          calories: number | null
          carbs: number | null
          confidence_level: string | null
          created_at: string | null
          fat: number | null
          food_name: string | null
          id: string
          image_url: string | null
          nutrition_score: number | null
          protein: number | null
          score: number | null
          source: string | null
          source_message_id: string | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_protein: number | null
          total_sodium_mg: number | null
          used_free_quota: boolean | null
          user_id: string | null
        }
        Insert: {
          ai_raw_response?: string | null
          ai_structured?: Json | null
          calories?: number | null
          carbs?: number | null
          confidence_level?: string | null
          created_at?: string | null
          fat?: number | null
          food_name?: string | null
          id?: string
          image_url?: string | null
          nutrition_score?: number | null
          protein?: number | null
          score?: number | null
          source?: string | null
          source_message_id?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_sodium_mg?: number | null
          used_free_quota?: boolean | null
          user_id?: string | null
        }
        Update: {
          ai_raw_response?: string | null
          ai_structured?: Json | null
          calories?: number | null
          carbs?: number | null
          confidence_level?: string | null
          created_at?: string | null
          fat?: number | null
          food_name?: string | null
          id?: string
          image_url?: string | null
          nutrition_score?: number | null
          protein?: number | null
          score?: number | null
          source?: string | null
          source_message_id?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          total_sodium_mg?: number | null
          used_free_quota?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "food_analyses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          efi_charge_id: string | null
          stripe_invoice_id: string | null
          id: string
          payment_method: string | null
          plan_type: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          efi_charge_id?: string | null
          stripe_invoice_id?: string | null
          id?: string
          payment_method?: string | null
          plan_type?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          efi_charge_id?: string | null
          stripe_invoice_id?: string | null
          id?: string
          payment_method?: string | null
          plan_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          birth_date: string | null
          coach_personality: string | null
          cpf: string | null
          created_at: string | null
          efi_payment_token: string | null
          stripe_customer_id: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          phone: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          coach_personality?: string | null
          cpf?: string | null
          created_at?: string | null
          efi_payment_token?: string | null
          stripe_customer_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          phone?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          birth_date?: string | null
          coach_personality?: string | null
          cpf?: string | null
          created_at?: string | null
          efi_payment_token?: string | null
          stripe_customer_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          phone?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          efi_subscription_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          plan: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          efi_subscription_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          efi_subscription_id?: string | null
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_sessions: {
        Row: {
          created_at: string | null
          phone_number: string
          state: string | null
          temp_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          phone_number: string
          state?: string | null
          temp_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          phone_number?: string
          state?: string | null
          temp_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      coach_analyses: {
        Row: {
          ai_raw_response: string | null
          ai_structured: Json | null
          biotype: string | null
          created_at: string | null
          estimated_body_fat: number | null
          goal_suggestion: string | null
          id: string | null
          image_url: string | null
          muscle_mass_level: string | null
          source: string | null
          updated_at: string | null
          used_free_quota: boolean | null
          user_id: string | null
        }
        Insert: {
          ai_raw_response?: string | null
          ai_structured?: Json | null
          biotype?: string | null
          created_at?: string | null
          estimated_body_fat?: number | null
          goal_suggestion?: string | null
          id?: string | null
          image_url?: string | null
          muscle_mass_level?: string | null
          source?: string | null
          updated_at?: string | null
          used_free_quota?: boolean | null
          user_id?: string | null
        }
        Update: {
          ai_raw_response?: string | null
          ai_structured?: Json | null
          biotype?: string | null
          created_at?: string | null
          estimated_body_fat?: number | null
          goal_suggestion?: string | null
          id?: string | null
          image_url?: string | null
          muscle_mass_level?: string | null
          source?: string | null
          updated_at?: string | null
          used_free_quota?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          created_at: string | null
          entitlement_code: string | null
          is_active: boolean | null
          is_trial: boolean | null
          plan_type: string | null
          updated_at: string | null
          usage: Json | null
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          entitlement_code?: string | null
          is_active?: never
          is_trial?: never
          plan_type?: string | null
          updated_at?: string | null
          usage?: never
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          entitlement_code?: string | null
          is_active?: never
          is_trial?: never
          plan_type?: string | null
          updated_at?: string | null
          usage?: never
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_access_by_whatsapp: { Args: { p_phone: string }; Returns: Json }
      check_analysis_access: { Args: { p_user_id: string }; Returns: Json }
      get_active_entitlement: {
        Args: { p_user_id: string }
        Returns: {
          entitlement_code: string
          is_active: boolean
          valid_until: string
        }[]
      }
      make_public_id: { Args: { prefix?: string }; Returns: string }
      only_digits: { Args: { t: string }; Returns: string }
      register_user_profile: {
        Args: { p_email: string; p_full_name: string; p_phone: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
