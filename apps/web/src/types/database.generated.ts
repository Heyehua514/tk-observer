export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      channel_orders: {
        Row: {
          actual_views: number | null
          amount: number
          client_id: string
          commission: number | null
          content_type: string
          created_at: string
          creator_id: string
          deleted_at: string | null
          id: string
          legacy_id: string | null
          notes: string | null
          platform: string
          publish_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_views?: number | null
          amount?: number
          client_id: string
          commission?: number | null
          content_type: string
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          notes?: string | null
          platform: string
          publish_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_views?: number | null
          amount?: number
          client_id?: string
          commission?: number | null
          content_type?: string
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          notes?: string | null
          platform?: string
          publish_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'channel_orders_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'channel_orders_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creators'
            referencedColumns: ['id']
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_wechat: string | null
          created_at: string
          deleted_at: string | null
          id: string
          industry: string
          legacy_id: string | null
          level: string
          name: string
          notes: string | null
          source: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_wechat?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          industry: string
          legacy_id?: string | null
          level: string
          name: string
          notes?: string | null
          source: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_wechat?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          industry?: string
          legacy_id?: string | null
          level?: string
          name?: string
          notes?: string | null
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          commission_rate: number | null
          cooperation_notes: string | null
          cooperation_price: number | null
          cooperation_status: string
          created_at: string
          deleted_at: string | null
          followers: number
          id: string
          is_biz_available: boolean
          legacy_id: string | null
          nickname: string
          owner_name: string
          region: string
          tiktok_url: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          cooperation_notes?: string | null
          cooperation_price?: number | null
          cooperation_status?: string
          created_at?: string
          deleted_at?: string | null
          followers?: number
          id?: string
          is_biz_available?: boolean
          legacy_id?: string | null
          nickname: string
          owner_name: string
          region: string
          tiktok_url: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          cooperation_notes?: string | null
          cooperation_price?: number | null
          cooperation_status?: string
          created_at?: string
          deleted_at?: string | null
          followers?: number
          id?: string
          is_biz_available?: boolean
          legacy_id?: string | null
          nickname?: string
          owner_name?: string
          region?: string
          tiktok_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_phases: {
        Row: {
          completion_pct: number
          created_at: string
          deleted_at: string | null
          end_date: string | null
          event_id: string
          id: string
          legacy_id: string | null
          name: string
          phase_order: number
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completion_pct?: number
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          event_id: string
          id?: string
          legacy_id?: string | null
          name: string
          phase_order: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completion_pct?: number
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          event_id?: string
          id?: string
          legacy_id?: string | null
          name?: string
          phase_order?: number
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_phases_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      event_registrations: {
        Row: {
          channel: string
          company: string | null
          confirmation_status: string
          created_at: string
          deleted_at: string | null
          event_id: string
          id: string
          legacy_id: string | null
          name: string
          payment_status: string
          position: string | null
          updated_at: string
        }
        Insert: {
          channel: string
          company?: string | null
          confirmation_status?: string
          created_at?: string
          deleted_at?: string | null
          event_id: string
          id?: string
          legacy_id?: string | null
          name: string
          payment_status?: string
          position?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          company?: string | null
          confirmation_status?: string
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          legacy_id?: string | null
          name?: string
          payment_status?: string
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_registrations_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      event_sponsorships: {
        Row: {
          amount: number
          client_id: string | null
          contact_name: string | null
          created_at: string
          deleted_at: string | null
          event_id: string
          id: string
          legacy_id: string | null
          notes: string | null
          stage: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          event_id: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_sponsorships_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_sponsorships_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      event_tasks: {
        Row: {
          assignee_id: string | null
          assignee_role: string
          created_at: string
          deleted_at: string | null
          due_date: string | null
          event_id: string
          id: string
          legacy_id: string | null
          notes: string | null
          phase_id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_role: string
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          event_id: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          phase_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_role?: string
          created_at?: string
          deleted_at?: string | null
          due_date?: string | null
          event_id?: string
          id?: string
          legacy_id?: string | null
          notes?: string | null
          phase_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_tasks_assignee_id_fkey'
            columns: ['assignee_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_tasks_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'event_tasks_phase_id_fkey'
            columns: ['phase_id']
            isOneToOne: false
            referencedRelation: 'event_phases'
            referencedColumns: ['id']
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          legacy_id: string | null
          location_city: string
          name: string
          start_date: string
          status: string
          target_attendees: number
          target_sponsorship: number
          theme: string | null
          total_budget: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          location_city: string
          name: string
          start_date: string
          status?: string
          target_attendees?: number
          target_sponsorship?: number
          theme?: string | null
          total_budget?: number
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          location_city?: string
          name?: string
          start_date?: string
          status?: string
          target_attendees?: number
          target_sponsorship?: number
          theme?: string | null
          total_budget?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'events_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      member_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          name: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name: string
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          name?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          deleted_at: string | null
          expected_close: string | null
          id: string
          legacy_id: string | null
          lost_reason: string | null
          notes: string | null
          probability: number
          stage: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string
          deleted_at?: string | null
          expected_close?: string | null
          id?: string
          legacy_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          stage?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          expected_close?: string | null
          id?: string
          legacy_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          stage?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'opportunities_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          id: string
          invited_by: string | null
          last_login_at: string | null
          legacy_id: string | null
          name: string
          role: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          id: string
          invited_by?: string | null
          last_login_at?: string | null
          legacy_id?: string | null
          name: string
          role?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          last_login_at?: string | null
          legacy_id?: string | null
          name?: string
          role?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_plans: {
        Row: {
          actual_result: string | null
          content: string
          created_at: string
          date: string
          deleted_at: string | null
          expected_outcome: string | null
          id: string
          legacy_id: string | null
          linked_opportunity_id: string | null
          status: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          actual_result?: string | null
          content: string
          created_at?: string
          date: string
          deleted_at?: string | null
          expected_outcome?: string | null
          id?: string
          legacy_id?: string | null
          linked_opportunity_id?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          actual_result?: string | null
          content?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          expected_outcome?: string | null
          id?: string
          legacy_id?: string | null
          linked_opportunity_id?: string | null
          status?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'social_plans_linked_opportunity_id_fkey'
            columns: ['linked_opportunity_id']
            isOneToOne: false
            referencedRelation: 'opportunities'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      current_user_status: { Args: never; Returns: string }
      has_any_role: { Args: { required_roles: string[] }; Returns: boolean }
      refresh_event_phase_completion: {
        Args: { target_phase_id: string }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
