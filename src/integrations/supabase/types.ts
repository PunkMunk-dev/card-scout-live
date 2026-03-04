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
      players: {
        Row: {
          id: string
          is_active: boolean
          name: string
          note: string | null
          ruleset_version_id: string
          sort_order: number
          source_meta: Json
          sport_key: string
          tags: Json
        }
        Insert: {
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          ruleset_version_id: string
          sort_order?: number
          source_meta?: Json
          sport_key: string
          tags?: Json
        }
        Update: {
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          ruleset_version_id?: string
          sort_order?: number
          source_meta?: Json
          sport_key?: string
          tags?: Json
        }
        Relationships: [
          {
            foreignKeyName: "players_ruleset_version_id_fkey"
            columns: ["ruleset_version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      roi_cards: {
        Row: {
          card_name: string
          created_at: string | null
          id: string
          multiplier: number | null
          psa10_avg: number | null
          psa10_profit: number | null
          psa9_avg: number | null
          psa9_gain: number | null
          raw_avg: number | null
          sport: string
        }
        Insert: {
          card_name: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          psa10_avg?: number | null
          psa10_profit?: number | null
          psa9_avg?: number | null
          psa9_gain?: number | null
          raw_avg?: number | null
          sport: string
        }
        Update: {
          card_name?: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          psa10_avg?: number | null
          psa10_profit?: number | null
          psa9_avg?: number | null
          psa9_gain?: number | null
          raw_avg?: number | null
          sport?: string
        }
        Relationships: []
      }
      roi_ebay_cache: {
        Row: {
          card_name: string
          expires_at: string
          fetched_at: string | null
          id: string
          listings: Json
          query_hash: string | null
          query_text: string
          query_version: number
          refreshing_until: string | null
        }
        Insert: {
          card_name: string
          expires_at?: string
          fetched_at?: string | null
          id?: string
          listings?: Json
          query_hash?: string | null
          query_text?: string
          query_version?: number
          refreshing_until?: string | null
        }
        Update: {
          card_name?: string
          expires_at?: string
          fetched_at?: string | null
          id?: string
          listings?: Json
          query_hash?: string | null
          query_text?: string
          query_version?: number
          refreshing_until?: string | null
        }
        Relationships: []
      }
      roi_live_auctions: {
        Row: {
          current_bid: number | null
          end_time: string | null
          id: string
          item_id: string
          last_seen_at: string
          listing_url: string
          roi_card_id: string
          shipping: number | null
        }
        Insert: {
          current_bid?: number | null
          end_time?: string | null
          id?: string
          item_id: string
          last_seen_at?: string
          listing_url: string
          roi_card_id: string
          shipping?: number | null
        }
        Update: {
          current_bid?: number | null
          end_time?: string | null
          id?: string
          item_id?: string
          last_seen_at?: string
          listing_url?: string
          roi_card_id?: string
          shipping?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_live_auctions_roi_card_id_fkey"
            columns: ["roi_card_id"]
            isOneToOne: false
            referencedRelation: "roi_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_items: {
        Row: {
          compatible_brand_ids: string[]
          id: string
          is_active: boolean
          is_default: boolean
          kind: string
          label: string
          priority: number
          ruleset_version_id: string
          sport_key: string
          tokens: Json
          url: string | null
        }
        Insert: {
          compatible_brand_ids?: string[]
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind: string
          label: string
          priority?: number
          ruleset_version_id: string
          sport_key: string
          tokens?: Json
          url?: string | null
        }
        Update: {
          compatible_brand_ids?: string[]
          id?: string
          is_active?: boolean
          is_default?: boolean
          kind?: string
          label?: string
          priority?: number
          ruleset_version_id?: string
          sport_key?: string
          tokens?: Json
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_items_ruleset_version_id_fkey"
            columns: ["ruleset_version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ruleset_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          published_at: string | null
          status: string
          version: string
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          published_at?: string | null
          status?: string
          version: string
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          published_at?: string | null
          status?: string
          version?: string
        }
        Relationships: []
      }
      seller_blacklist: {
        Row: {
          id: string
          is_active: boolean
          label: string | null
          pattern: string
          priority: number
          ruleset_version_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          label?: string | null
          pattern: string
          priority?: number
          ruleset_version_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          label?: string | null
          pattern?: string
          priority?: number
          ruleset_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_blacklist_ruleset_version_id_fkey"
            columns: ["ruleset_version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      sports: {
        Row: {
          id: string
          key: string
          label: string
          ruleset_version_id: string
          sort_order: number
        }
        Insert: {
          id?: string
          key: string
          label: string
          ruleset_version_id: string
          sort_order?: number
        }
        Update: {
          id?: string
          key?: string
          label?: string
          ruleset_version_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sports_ruleset_version_id_fkey"
            columns: ["ruleset_version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      tcg_sets: {
        Row: {
          created_at: string
          game: string
          id: string
          set_name: string
          weight: number
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          set_name: string
          weight?: number
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          set_name?: string
          weight?: number
        }
        Relationships: []
      }
      tcg_targets: {
        Row: {
          created_at: string
          game: string
          id: string
          name: string
          priority: number
          tags: string | null
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          name: string
          priority?: number
          tags?: string | null
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          name?: string
          priority?: number
          tags?: string | null
        }
        Relationships: []
      }
      tcg_traits: {
        Row: {
          created_at: string
          game: string
          id: string
          rarity_tier: string | null
          search_terms: string
          trait: string
          weight: number
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          rarity_tier?: string | null
          search_terms: string
          trait: string
          weight?: number
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          rarity_tier?: string | null
          search_terms?: string
          trait?: string
          weight?: number
        }
        Relationships: []
      }
      tcg_watchlist: {
        Row: {
          created_at: string
          game: string
          id: string
          listing_id: string | null
          listing_image: string | null
          listing_price: string | null
          listing_title: string | null
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          game: string
          id?: string
          listing_id?: string | null
          listing_image?: string | null
          listing_price?: string | null
          listing_title?: string | null
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          game?: string
          id?: string
          listing_id?: string | null
          listing_image?: string | null
          listing_price?: string | null
          listing_title?: string | null
          query?: string
          user_id?: string
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
      clone_published_to_draft: {
        Args: { p_name: string; p_version: string }
        Returns: string
      }
      create_empty_draft: {
        Args: { p_name: string; p_version: string }
        Returns: string
      }
      get_published_ruleset_snapshot: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      publish_ruleset_version: {
        Args: { p_ruleset_version_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
