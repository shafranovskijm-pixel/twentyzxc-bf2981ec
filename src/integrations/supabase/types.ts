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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          contact_person: string | null
          created_at: string
          director_name: string | null
          director_post: string | null
          email: string | null
          frdo_login: string | null
          frdo_password: string | null
          id: string
          inn: string | null
          kpp: string | null
          legal_address: string | null
          name: string
          notes: string | null
          ogrn: string | null
          payment_date: string | null
          phone: string | null
          service_type: string | null
          telegram: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          director_name?: string | null
          director_post?: string | null
          email?: string | null
          frdo_login?: string | null
          frdo_password?: string | null
          id?: string
          inn?: string | null
          kpp?: string | null
          legal_address?: string | null
          name: string
          notes?: string | null
          ogrn?: string | null
          payment_date?: string | null
          phone?: string | null
          service_type?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          director_name?: string | null
          director_post?: string | null
          email?: string | null
          frdo_login?: string | null
          frdo_password?: string | null
          id?: string
          inn?: string | null
          kpp?: string | null
          legal_address?: string | null
          name?: string
          notes?: string | null
          ogrn?: string | null
          payment_date?: string | null
          phone?: string | null
          service_type?: string | null
          telegram?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_files: {
        Row: {
          contract_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_files_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number | null
          amount_extra: number | null
          client_name: string
          contract_date: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string
          file_path: string | null
          id: string
          is_archived: boolean
          notes: string | null
          paid_until: string | null
          payment_status: string | null
          responsible: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          amount_extra?: number | null
          client_name: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          is_archived?: boolean
          notes?: string | null
          paid_until?: string | null
          payment_status?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          amount_extra?: number | null
          client_name?: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          is_archived?: boolean
          notes?: string | null
          paid_until?: string | null
          payment_status?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          client_inn: string | null
          client_name: string
          contract_id: string | null
          created_at: string
          doc_date: string
          doc_number: string
          doc_type: string
          html_content: string
          id: string
          services: Json
          total_amount: number | null
        }
        Insert: {
          client_inn?: string | null
          client_name: string
          contract_id?: string | null
          created_at?: string
          doc_date?: string
          doc_number: string
          doc_type: string
          html_content: string
          id?: string
          services?: Json
          total_amount?: number | null
        }
        Update: {
          client_inn?: string | null
          client_name?: string
          contract_id?: string | null
          created_at?: string
          doc_date?: string
          doc_number?: string
          doc_type?: string
          html_content?: string
          id?: string
          services?: Json
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          converted_client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string | null
          phone: string | null
          source: string | null
          status: string | null
          telegram_chat_id: number | null
        }
        Insert: {
          converted_client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          telegram_chat_id?: number | null
        }
        Update: {
          converted_client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          telegram_chat_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category_id: string
          contact_email: string | null
          contact_phone: string | null
          contact_telegram: string | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          images: string[] | null
          location: string | null
          price: number | null
          price_type: Database["public"]["Enums"]["price_type"]
          slug: string | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          category_id: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_telegram?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          category_id?: string
          contact_email?: string | null
          contact_phone?: string | null
          contact_telegram?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          price?: number | null
          price_type?: Database["public"]["Enums"]["price_type"]
          slug?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      playground_feedback: {
        Row: {
          content: string
          created_at: string
          id: string
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      playground_projects: {
        Row: {
          author_name: string | null
          blocks: Json
          created_at: string
          id: string
          is_featured: boolean | null
          preview_image: string | null
          settings: Json
          slug: string
          telegram_chat_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          blocks?: Json
          created_at?: string
          id?: string
          is_featured?: boolean | null
          preview_image?: string | null
          settings?: Json
          slug: string
          telegram_chat_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          blocks?: Json
          created_at?: string
          id?: string
          is_featured?: boolean | null
          preview_image?: string | null
          settings?: Json
          slug?: string
          telegram_chat_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          created_at: string
          description: string
          featured: boolean
          id: string
          is_internal: boolean
          location: string | null
          price: string | null
          price_alt: string | null
          sort_order: number
          tags: string[]
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description: string
          featured?: boolean
          id?: string
          is_internal?: boolean
          location?: string | null
          price?: string | null
          price_alt?: string | null
          sort_order?: number
          tags?: string[]
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          is_internal?: boolean
          location?: string | null
          price?: string | null
          price_alt?: string | null
          sort_order?: number
          tags?: string[]
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      portfolio_settings: {
        Row: {
          all_title: string
          featured_title: string
          id: string
          updated_at: string
        }
        Insert: {
          all_title?: string
          featured_title?: string
          id?: string
          updated_at?: string
        }
        Update: {
          all_title?: string
          featured_title?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          old_price: string | null
          price: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          old_price?: string | null
          price?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          old_price?: string | null
          price?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean
          rating: number
          user_avatar: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating: number
          user_avatar?: string | null
          user_id: string
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          rating?: number
          user_avatar?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      sales_notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          id: string
          note_type: string | null
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          note_type?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          note_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          id: string
          sort_order: number
          status: string
          task_date: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          task_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          task_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_users: {
        Row: {
          chat_id: number
          created_at: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          username: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          username?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          username?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      playground_projects_public: {
        Row: {
          author_name: string | null
          blocks: Json | null
          created_at: string | null
          id: string | null
          is_featured: boolean | null
          preview_image: string | null
          settings: Json | null
          slug: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          author_name?: string | null
          blocks?: Json | null
          created_at?: string | null
          id?: string | null
          is_featured?: boolean | null
          preview_image?: string | null
          settings?: Json | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          author_name?: string | null
          blocks?: Json | null
          created_at?: string | null
          id?: string | null
          is_featured?: boolean | null
          preview_image?: string | null
          settings?: Json | null
          slug?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_listing_contact_info: {
        Args: { listing_id: string }
        Returns: {
          contact_email: string
          contact_phone: string
          contact_telegram: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      listing_status: "pending" | "active" | "rejected" | "archived"
      price_type: "fixed" | "negotiable" | "free"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      listing_status: ["pending", "active", "rejected", "archived"],
      price_type: ["fixed", "negotiable", "free"],
    },
  },
} as const
