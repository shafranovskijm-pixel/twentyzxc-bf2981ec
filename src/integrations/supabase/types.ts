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
      client_interactions: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          interaction_type: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          interaction_type?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          interaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
          frdo_password_po: string | null
          id: string
          inn: string | null
          kpp: string | null
          legal_address: string | null
          name: string
          no_deadline: boolean
          notes: string | null
          ogrn: string | null
          payment_date: string | null
          phone: string | null
          service_deadline: string | null
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
          frdo_password_po?: string | null
          id?: string
          inn?: string | null
          kpp?: string | null
          legal_address?: string | null
          name: string
          no_deadline?: boolean
          notes?: string | null
          ogrn?: string | null
          payment_date?: string | null
          phone?: string | null
          service_deadline?: string | null
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
          frdo_password_po?: string | null
          id?: string
          inn?: string | null
          kpp?: string | null
          legal_address?: string | null
          name?: string
          no_deadline?: boolean
          notes?: string | null
          ogrn?: string | null
          payment_date?: string | null
          phone?: string | null
          service_deadline?: string | null
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
          metadata: Json
        }
        Insert: {
          contract_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json
        }
        Update: {
          contract_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json
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
          appendix_ref: string | null
          client_name: string
          contract_date: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string
          file_path: string | null
          id: string
          is_archived: boolean
          is_one_time: boolean
          notes: string | null
          paid_until: string | null
          payment_status: string | null
          responsible: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          amount_extra?: number | null
          appendix_ref?: string | null
          client_name: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          is_archived?: boolean
          is_one_time?: boolean
          notes?: string | null
          paid_until?: string | null
          payment_status?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          amount_extra?: number | null
          appendix_ref?: string | null
          client_name?: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          is_archived?: boolean
          is_one_time?: boolean
          notes?: string | null
          paid_until?: string | null
          payment_status?: string | null
          responsible?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_campaign_queue: {
        Row: {
          attempts: number
          body_html: string
          created_at: string
          created_by: string
          email: string
          error: string | null
          id: string
          lead_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          body_html: string
          created_at?: string
          created_by: string
          email: string
          error?: string | null
          id?: string
          lead_id?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          body_html?: string
          created_at?: string
          created_by?: string
          email?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "sales_leads"
            referencedColumns: ["id"]
          },
        ]
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
      nmo_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          registration_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          registration_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          registration_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nmo_documents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "nmo_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      nmo_registrations: {
        Row: {
          actual_address: string | null
          application_date: string | null
          application_number: string | null
          checklist: Json
          client_id: string | null
          created_at: string
          has_dpo_appendix: boolean | null
          id: string
          inn: string | null
          kpp: string | null
          legal_address: string | null
          license_date: string | null
          license_number: string | null
          mail_sent_date: string | null
          mail_track_number: string | null
          notes: string | null
          ogrn: string | null
          organization_abbr: string | null
          organization_email: string | null
          organization_name: string
          organization_phone: string | null
          organization_website: string | null
          region: string | null
          responsible_birth_date: string | null
          responsible_email: string | null
          responsible_gender: string | null
          responsible_login: string | null
          responsible_main_workplace: string | null
          responsible_mobile: string | null
          responsible_name: string | null
          responsible_password: string | null
          responsible_phone: string | null
          responsible_position: string | null
          responsible_region: string | null
          responsible_snils: string | null
          responsible_work_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          actual_address?: string | null
          application_date?: string | null
          application_number?: string | null
          checklist?: Json
          client_id?: string | null
          created_at?: string
          has_dpo_appendix?: boolean | null
          id?: string
          inn?: string | null
          kpp?: string | null
          legal_address?: string | null
          license_date?: string | null
          license_number?: string | null
          mail_sent_date?: string | null
          mail_track_number?: string | null
          notes?: string | null
          ogrn?: string | null
          organization_abbr?: string | null
          organization_email?: string | null
          organization_name: string
          organization_phone?: string | null
          organization_website?: string | null
          region?: string | null
          responsible_birth_date?: string | null
          responsible_email?: string | null
          responsible_gender?: string | null
          responsible_login?: string | null
          responsible_main_workplace?: string | null
          responsible_mobile?: string | null
          responsible_name?: string | null
          responsible_password?: string | null
          responsible_phone?: string | null
          responsible_position?: string | null
          responsible_region?: string | null
          responsible_snils?: string | null
          responsible_work_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          actual_address?: string | null
          application_date?: string | null
          application_number?: string | null
          checklist?: Json
          client_id?: string | null
          created_at?: string
          has_dpo_appendix?: boolean | null
          id?: string
          inn?: string | null
          kpp?: string | null
          legal_address?: string | null
          license_date?: string | null
          license_number?: string | null
          mail_sent_date?: string | null
          mail_track_number?: string | null
          notes?: string | null
          ogrn?: string | null
          organization_abbr?: string | null
          organization_email?: string | null
          organization_name?: string
          organization_phone?: string | null
          organization_website?: string | null
          region?: string | null
          responsible_birth_date?: string | null
          responsible_email?: string | null
          responsible_gender?: string | null
          responsible_login?: string | null
          responsible_main_workplace?: string | null
          responsible_mobile?: string | null
          responsible_name?: string | null
          responsible_password?: string | null
          responsible_phone?: string | null
          responsible_position?: string | null
          responsible_region?: string | null
          responsible_snils?: string | null
          responsible_work_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nmo_registrations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      org_clients: {
        Row: {
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_contracts: {
        Row: {
          amount: number | null
          client_name: string
          contract_date: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string
          id: string
          is_archived: boolean
          notes: string | null
          organization_id: string
          paid_until: string | null
          payment_status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_name: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          notes?: string | null
          organization_id: string
          paid_until?: string | null
          payment_status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_name?: string
          contract_date?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          notes?: string | null
          organization_id?: string
          paid_until?: string | null
          payment_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_email_sent_at: string | null
          name: string
          next_step: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          source: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_email_sent_at?: string | null
          name: string
          next_step?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_email_sent_at?: string | null
          name?: string
          next_step?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_tasks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: string
          sort_order: number
          status: string
          task_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          sort_order?: number
          status?: string
          task_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          sort_order?: number
          status?: string
          task_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          inn: string | null
          landing_config: Json
          landing_slug: string | null
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inn?: string | null
          landing_config?: Json
          landing_slug?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inn?: string | null
          landing_config?: Json
          landing_slug?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      proposal_counters: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          included: boolean
          price: number
          proposal_id: string
          qty: number
          service_key: string | null
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          included?: boolean
          price?: number
          proposal_id: string
          qty?: number
          service_key?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          included?: boolean
          price?: number
          proposal_id?: string
          qty?: number
          service_key?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_services_catalog: {
        Row: {
          category: string | null
          created_at: string
          default_price: number
          description: string | null
          id: string
          is_default: boolean
          key: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_default?: boolean
          key: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_default?: boolean
          key?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client_email: string | null
          client_name: string | null
          client_org: string | null
          client_phone: string | null
          created_at: string
          created_by: string | null
          discount_percent: number
          footer_text: string | null
          id: string
          intro_text: string | null
          number: string | null
          status: string
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_email?: string | null
          client_name?: string | null
          client_org?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          footer_text?: string | null
          id?: string
          intro_text?: string | null
          number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_email?: string | null
          client_name?: string | null
          client_org?: string | null
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          footer_text?: string | null
          id?: string
          intro_text?: string | null
          number?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
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
      rosobrnadzor_licenses: {
        Row: {
          address: string | null
          fetched_at: string
          inn: string
          license_date: string | null
          license_number: string | null
          license_status: string | null
          org_name: string | null
          raw_json: Json | null
          registry_url: string | null
        }
        Insert: {
          address?: string | null
          fetched_at?: string
          inn: string
          license_date?: string | null
          license_number?: string | null
          license_status?: string | null
          org_name?: string | null
          raw_json?: Json | null
          registry_url?: string | null
        }
        Update: {
          address?: string | null
          fetched_at?: string
          inn?: string
          license_date?: string | null
          license_number?: string | null
          license_status?: string | null
          org_name?: string | null
          raw_json?: Json | null
          registry_url?: string | null
        }
        Relationships: []
      }
      sales_leads: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          contact_person: string | null
          created_at: string
          dedup_hash: string | null
          email: string | null
          id: string
          inn: string | null
          last_email_sent_at: string | null
          license_cache: Json | null
          license_date: string | null
          license_number: string | null
          name: string
          next_step: string | null
          notes: string | null
          phone: string | null
          region: string | null
          source: string | null
          status: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          dedup_hash?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          last_email_sent_at?: string | null
          license_cache?: Json | null
          license_date?: string | null
          license_number?: string | null
          name: string
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          contact_person?: string | null
          created_at?: string
          dedup_hash?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          last_email_sent_at?: string | null
          license_cache?: Json | null
          license_date?: string | null
          license_number?: string | null
          name?: string
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          region?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          website?: string | null
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
      scheduled_reminders: {
        Row: {
          created_at: string
          id: string
          message: string
          send_at: string
          status: string
          task_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          send_at: string
          status?: string
          task_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          send_at?: string
          status?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      tz_doc_counters: {
        Row: {
          last_number: number
          year: number
        }
        Insert: {
          last_number?: number
          year: number
        }
        Update: {
          last_number?: number
          year?: number
        }
        Relationships: []
      }
      tz_documents: {
        Row: {
          appendix_number: string | null
          client_id: string | null
          client_inn: string | null
          client_name: string
          contract_id: string | null
          created_at: string
          html_content: string | null
          id: string
          payload: Json
          template_id: string | null
          title: string
          tz_date: string
          tz_number: string | null
          updated_at: string
        }
        Insert: {
          appendix_number?: string | null
          client_id?: string | null
          client_inn?: string | null
          client_name: string
          contract_id?: string | null
          created_at?: string
          html_content?: string | null
          id?: string
          payload?: Json
          template_id?: string | null
          title: string
          tz_date?: string
          tz_number?: string | null
          updated_at?: string
        }
        Update: {
          appendix_number?: string | null
          client_id?: string | null
          client_inn?: string | null
          client_name?: string
          contract_id?: string | null
          created_at?: string
          html_content?: string | null
          id?: string
          payload?: Json
          template_id?: string | null
          title?: string
          tz_date?: string
          tz_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tz_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "tz_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tz_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          is_default: boolean
          name: string
          sections: Json
          template_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          name: string
          sections?: Json
          template_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          name?: string
          sections?: Json
          template_type?: string
          updated_at?: string
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
      user_ui_settings: {
        Row: {
          hidden_sidebar_sections: Json
          sidebar_order: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          hidden_sidebar_sections?: Json
          sidebar_order?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          hidden_sidebar_sections?: Json
          sidebar_order?: Json
          updated_at?: string
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
      get_active_listings: {
        Args: never
        Returns: {
          category_id: string
          created_at: string
          description: string
          expires_at: string
          id: string
          images: string[]
          location: string
          price: number
          price_type: Database["public"]["Enums"]["price_type"]
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
          user_id: string
          views_count: number
        }[]
      }
      get_listing_contact_info: {
        Args: { listing_id: string }
        Returns: {
          contact_email: string
          contact_phone: string
          contact_telegram: string
        }[]
      }
      get_org_by_slug: {
        Args: { _slug: string }
        Returns: {
          created_at: string
          id: string
          landing_config: Json
          landing_slug: string
          logo_url: string
          name: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      next_proposal_number: { Args: never; Returns: string }
      next_tz_number: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "organization"
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
      app_role: ["admin", "moderator", "user", "organization"],
      listing_status: ["pending", "active", "rejected", "archived"],
      price_type: ["fixed", "negotiable", "free"],
    },
  },
} as const
