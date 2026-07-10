// Auto-generated Supabase types (kept in sync via `supabase gen types`).
// Source of truth: project nstwdxgrefzzqozuvejy.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          next_sku_number: number;
          sku_prefix: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          next_sku_number?: number;
          sku_prefix: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      blankets: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          is_active: boolean;
          name: string;
          product_id: string;
          rate: number;
          sku: string | null;
          updated_at: string;
          weight_kg: number;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          is_active?: boolean;
          name: string;
          product_id: string;
          rate: number;
          sku?: string | null;
          updated_at?: string;
          weight_kg: number;
        };
        Update: Partial<Database["public"]["Tables"]["blankets"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "blankets_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      blanket_images: {
        Row: {
          blanket_id: string;
          created_at: string;
          display_order: number;
          id: string;
          image_url: string;
          is_primary: boolean;
        };
        Insert: {
          blanket_id: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_url: string;
          is_primary?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["blanket_images"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "blanket_images_blanket_id_fkey";
            columns: ["blanket_id"];
            isOneToOne: false;
            referencedRelation: "blankets";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_stock: {
        Row: {
          blanket_id: string;
          closing_stock: number | null;
          created_at: string;
          date: string;
          id: string;
          is_locked: boolean;
          notes: string | null;
          opening_stock: number;
          production: number;
          sales: number;
          updated_at: string;
        };
        Insert: {
          blanket_id: string;
          closing_stock?: number | null;
          created_at?: string;
          date: string;
          id?: string;
          is_locked?: boolean;
          notes?: string | null;
          opening_stock?: number;
          production?: number;
          sales?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_stock"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "daily_stock_blanket_id_fkey";
            columns: ["blanket_id"];
            isOneToOne: false;
            referencedRelation: "blankets";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          about_text: string | null;
          address: string | null;
          company_name: string;
          email: string | null;
          established_year: number;
          id: number;
          logo_url: string | null;
          map_link: string | null;
          phone: string | null;
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          about_text?: string | null;
          address?: string | null;
          company_name?: string;
          email?: string | null;
          established_year?: number;
          id?: number;
          logo_url?: string | null;
          map_link?: string | null;
          phone?: string | null;
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      blanket_monthly_stock: {
        Row: {
          blanket_id: string | null;
          closing_stock: number | null;
          days_recorded: number | null;
          month: string | null;
          opening_stock: number | null;
          production: number | null;
          sales: number | null;
        };
        Relationships: [];
      };
      blanket_yearly_stock: {
        Row: {
          blanket_id: string | null;
          closing_stock: number | null;
          days_recorded: number | null;
          opening_stock: number | null;
          production: number | null;
          sales: number | null;
          year: string | null;
        };
        Relationships: [];
      };
      blanket_latest_stock: {
        Row: {
          blanket_id: string | null;
          closing_stock: number | null;
          date: string | null;
        };
        Relationships: [];
      };
      product_monthly_summary: {
        Row: {
          month: string | null;
          product_id: string | null;
          product_name: string | null;
          total_production: number | null;
          total_sales: number | null;
          total_stock: number | null;
        };
        Relationships: [];
      };
      product_yearly_summary: {
        Row: {
          product_id: string | null;
          product_name: string | null;
          total_production: number | null;
          total_sales: number | null;
          total_stock: number | null;
          year: string | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
export type Views<T extends keyof PublicSchema["Views"]> =
  PublicSchema["Views"][T]["Row"];
