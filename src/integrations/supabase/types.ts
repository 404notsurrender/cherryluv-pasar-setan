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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          discord_username: string | null
          id: string
          roblox_display_name: string
          roblox_username: string
          updated_at: string
          user_id: string
          whatsapp: string
        }
        Insert: {
          created_at?: string
          discord_username?: string | null
          id?: string
          roblox_display_name: string
          roblox_username: string
          updated_at?: string
          user_id: string
          whatsapp: string
        }
        Update: {
          created_at?: string
          discord_username?: string | null
          id?: string
          roblox_display_name?: string
          roblox_username?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          message: string
          order_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          message: string
          order_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          message?: string
          order_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_credentials: {
        Row: {
          backup_code: string | null
          created_at: string
          order_id: string
          roblox_password: string | null
          roblox_username: string
          status: string
          updated_at: string
        }
        Insert: {
          backup_code?: string | null
          created_at?: string
          order_id: string
          roblox_password?: string | null
          roblox_username: string
          status?: string
          updated_at?: string
        }
        Update: {
          backup_code?: string | null
          created_at?: string
          order_id?: string
          roblox_password?: string | null
          roblox_username?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_credentials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          category_name: string | null
          created_at: string
          currency: string
          id: string
          item_amount: number | null
          order_id: string
          pricing_meta: Json | null
          pricing_rate: number | null
          pricing_unit: number | null
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          category_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          item_amount?: number | null
          order_id: string
          pricing_meta?: Json | null
          pricing_rate?: number | null
          pricing_unit?: number | null
          product_id: string
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          category_name?: string | null
          created_at?: string
          currency?: string
          id?: string
          item_amount?: number | null
          order_id?: string
          pricing_meta?: Json | null
          pricing_rate?: number | null
          pricing_unit?: number | null
          product_id?: string
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          expires_at: string | null
          id: string
          idempotency_key: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_gateway: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          expires_at?: string | null
          id?: string
          idempotency_key: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_gateway?: string
          payment_method: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          expires_at?: string | null
          id?: string
          idempotency_key?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_gateway?: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_transaction_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          gateway: string
          id: string
          method: string
          order_id: string
          paid_at: string | null
          provider_reference: string | null
          qr_string: string | null
          raw_reference: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          gateway?: string
          id?: string
          method: string
          order_id: string
          paid_at?: string | null
          provider_reference?: string | null
          qr_string?: string | null
          raw_reference?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          gateway?: string
          id?: string
          method?: string
          order_id?: string
          paid_at?: string | null
          provider_reference?: string | null
          qr_string?: string | null
          raw_reference?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          increment: number
          key: string
          minimum_amount: number
          name: string
          rate: number
          unit: number
          updated_at: string
        }
        Insert: {
          increment?: number
          key: string
          minimum_amount?: number
          name: string
          rate: number
          unit?: number
          updated_at?: string
        }
        Update: {
          increment?: number
          key?: string
          minimum_amount?: number
          name?: string
          rate?: number
          unit?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          price: number
          product_id: string
          quantity_value: number
          sort_order: number
          stock: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          price: number
          product_id: string
          quantity_value?: number
          sort_order?: number
          stock?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          price?: number
          product_id?: string
          quantity_value?: number
          sort_order?: number
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          category_id: string
          created_at: string
          delivery_minutes: number
          description: string
          featured: boolean
          id: string
          image_key: string
          instructions: string
          name: string
          popularity: number
          pricing_type: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          updated_at: string
        }
        Insert: {
          base_price: number
          category_id: string
          created_at?: string
          delivery_minutes?: number
          description: string
          featured?: boolean
          id?: string
          image_key: string
          instructions?: string
          name: string
          popularity?: number
          pricing_type?: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          category_id?: string
          created_at?: string
          delivery_minutes?: number
          description?: string
          featured?: boolean
          id?: string
          image_key?: string
          instructions?: string
          name?: string
          popularity?: number
          pricing_type?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_username: string | null
          display_name: string | null
          id: string
          roblox_display_name: string | null
          roblox_username: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          id: string
          roblox_display_name?: string | null
          roblox_username?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_username?: string | null
          display_name?: string | null
          id?: string
          roblox_display_name?: string | null
          roblox_username?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order: {
        Args: {
          p_credentials?: Json
          p_discord_username: string
          p_idempotency_key: string
          p_items: Json
          p_notes: string
          p_payment_method: string
          p_roblox_display_name: string
          p_roblox_username: string
          p_whatsapp: string
        }
        Returns: string
      }
      expire_order: { Args: { p_order_number: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_order_paid: {
        Args: { p_amount: number; p_order_number: string; p_reference: Json }
        Returns: boolean
      }
      track_order: {
        Args: { p_identity: string; p_order_number: string }
        Returns: {
          created_at: string
          items: string
          order_number: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          roblox_username: string
          status: Database["public"]["Enums"]["order_status"]
          total_amount: number
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      order_status:
        | "pending_payment"
        | "payment_confirmed"
        | "processing"
        | "completed"
        | "cancelled"
        | "paid"
        | "expired"
        | "refunded"
      payment_status: "pending" | "paid" | "failed" | "refunded" | "expired"
      product_status: "active" | "draft" | "archived"
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
      app_role: ["admin", "customer"],
      order_status: [
        "pending_payment",
        "payment_confirmed",
        "processing",
        "completed",
        "cancelled",
        "paid",
        "expired",
        "refunded",
      ],
      payment_status: ["pending", "paid", "failed", "refunded", "expired"],
      product_status: ["active", "draft", "archived"],
    },
  },
} as const
