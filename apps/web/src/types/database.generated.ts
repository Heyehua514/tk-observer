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
      audit_logs: {
        Row: {
          action: string
          actor_name: string
          created_at: string
          deleted_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          legacy_id: string | null
          updated_at: string
        }
        Insert: {
          action: string
          actor_name: string
          created_at?: string
          deleted_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          legacy_id?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          actor_name?: string
          created_at?: string
          deleted_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          legacy_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
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
      competitor_accounts: {
        Row: {
          avg_views: number
          category: string | null
          created_at: string
          deleted_at: string | null
          follower_count: number
          id: string
          legacy_id: string | null
          name: string
          notes: string | null
          platform: string
          profile_url: string | null
          updated_at: string
        }
        Insert: {
          avg_views?: number
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          follower_count?: number
          id?: string
          legacy_id?: string | null
          name: string
          notes?: string | null
          platform: string
          profile_url?: string | null
          updated_at?: string
        }
        Update: {
          avg_views?: number
          category?: string | null
          created_at?: string
          deleted_at?: string | null
          follower_count?: number
          id?: string
          legacy_id?: string | null
          name?: string
          notes?: string | null
          platform?: string
          profile_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      competitor_style_analysis: {
        Row: {
          analyzed_at: string
          applicable_to_us: string | null
          competitor_id: string
          content_style: string | null
          created_at: string
          deleted_at: string | null
          editing_style: string | null
          hook_method: string | null
          id: string
          legacy_id: string | null
          title_pattern: string | null
          updated_at: string
          viral_factors: string | null
        }
        Insert: {
          analyzed_at: string
          applicable_to_us?: string | null
          competitor_id: string
          content_style?: string | null
          created_at?: string
          deleted_at?: string | null
          editing_style?: string | null
          hook_method?: string | null
          id?: string
          legacy_id?: string | null
          title_pattern?: string | null
          updated_at?: string
          viral_factors?: string | null
        }
        Update: {
          analyzed_at?: string
          applicable_to_us?: string | null
          competitor_id?: string
          content_style?: string | null
          created_at?: string
          deleted_at?: string | null
          editing_style?: string | null
          hook_method?: string | null
          id?: string
          legacy_id?: string | null
          title_pattern?: string | null
          updated_at?: string
          viral_factors?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'competitor_style_analysis_competitor_id_fkey'
            columns: ['competitor_id']
            isOneToOne: false
            referencedRelation: 'competitor_accounts'
            referencedColumns: ['id']
          },
        ]
      }
      competitor_videos: {
        Row: {
          competitor_id: string
          content_tags: string | null
          created_at: string
          deleted_at: string | null
          id: string
          legacy_id: string | null
          likes: number
          publish_date: string | null
          reference_to: string | null
          title: string
          updated_at: string
          url: string | null
          views: number
          why_viral: string | null
        }
        Insert: {
          competitor_id: string
          content_tags?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          likes?: number
          publish_date?: string | null
          reference_to?: string | null
          title: string
          updated_at?: string
          url?: string | null
          views?: number
          why_viral?: string | null
        }
        Update: {
          competitor_id?: string
          content_tags?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          likes?: number
          publish_date?: string | null
          reference_to?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          views?: number
          why_viral?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'competitor_videos_competitor_id_fkey'
            columns: ['competitor_id']
            isOneToOne: false
            referencedRelation: 'competitor_accounts'
            referencedColumns: ['id']
          },
        ]
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
      daily_reports: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          generated_at: string
          highlights: string
          id: string
          legacy_id: string | null
          stats_json: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          generated_at: string
          highlights: string
          id?: string
          legacy_id?: string | null
          stats_json: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          generated_at?: string
          highlights?: string
          id?: string
          legacy_id?: string | null
          stats_json?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_assets: {
        Row: {
          created_at: string
          deleted_at: string | null
          dimensions: string | null
          file_name: string
          file_path: string
          id: string
          legacy_id: string | null
          owner_id: string | null
          region: string
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          dimensions?: string | null
          file_name: string
          file_path: string
          id?: string
          legacy_id?: string | null
          owner_id?: string | null
          region: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          dimensions?: string | null
          file_name?: string
          file_path?: string
          id?: string
          legacy_id?: string | null
          owner_id?: string | null
          region?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'design_assets_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'design_assets_reviewed_by_fkey'
            columns: ['reviewed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      design_deliverables: {
        Row: {
          asset_id: string
          checklist_ok: boolean
          created_at: string
          deleted_at: string | null
          delivered_at: string
          exported_format: string
          exported_size: string
          id: string
          legacy_id: string | null
          requirement_id: string
          updated_at: string
        }
        Insert: {
          asset_id: string
          checklist_ok?: boolean
          created_at?: string
          deleted_at?: string | null
          delivered_at: string
          exported_format: string
          exported_size: string
          id?: string
          legacy_id?: string | null
          requirement_id: string
          updated_at?: string
        }
        Update: {
          asset_id?: string
          checklist_ok?: boolean
          created_at?: string
          deleted_at?: string | null
          delivered_at?: string
          exported_format?: string
          exported_size?: string
          id?: string
          legacy_id?: string | null
          requirement_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'design_deliverables_asset_id_fkey'
            columns: ['asset_id']
            isOneToOne: false
            referencedRelation: 'design_assets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'design_deliverables_requirement_id_fkey'
            columns: ['requirement_id']
            isOneToOne: false
            referencedRelation: 'design_requirements'
            referencedColumns: ['id']
          },
        ]
      }
      design_references: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string
          legacy_id: string | null
          notes: string | null
          requirement_id: string
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url: string
          legacy_id?: string | null
          notes?: string | null
          requirement_id: string
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string
          legacy_id?: string | null
          notes?: string | null
          requirement_id?: string
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'design_references_requirement_id_fkey'
            columns: ['requirement_id']
            isOneToOne: false
            referencedRelation: 'design_requirements'
            referencedColumns: ['id']
          },
        ]
      }
      design_requirements: {
        Row: {
          copy_content: string
          created_at: string
          deleted_at: string | null
          delivery_format: string
          description: string
          due_date: string
          id: string
          legacy_id: string | null
          priority: string
          reference_urls: string | null
          requester_id: string
          status: string
          target_size: string
          title: string
          updated_at: string
          usage_scene: string
        }
        Insert: {
          copy_content: string
          created_at?: string
          deleted_at?: string | null
          delivery_format: string
          description: string
          due_date: string
          id?: string
          legacy_id?: string | null
          priority: string
          reference_urls?: string | null
          requester_id: string
          status?: string
          target_size: string
          title: string
          updated_at?: string
          usage_scene: string
        }
        Update: {
          copy_content?: string
          created_at?: string
          deleted_at?: string | null
          delivery_format?: string
          description?: string
          due_date?: string
          id?: string
          legacy_id?: string | null
          priority?: string
          reference_urls?: string | null
          requester_id?: string
          status?: string
          target_size?: string
          title?: string
          updated_at?: string
          usage_scene?: string
        }
        Relationships: [
          {
            foreignKeyName: 'design_requirements_requester_id_fkey'
            columns: ['requester_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      design_tasks: {
        Row: {
          created_at: string
          deleted_at: string | null
          due_at: string | null
          id: string
          legacy_id: string | null
          region: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          legacy_id?: string | null
          region: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          legacy_id?: string | null
          region?: string
          status?: string
          title?: string
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
          venue_id: string | null
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
          venue_id?: string | null
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
          venue_id?: string | null
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
      event_finances: {
        Row: {
          amount: number
          category: string
          created_at: string
          deleted_at: string | null
          description: string
          event_id: string
          id: string
          legacy_id: string | null
          paid_at: string | null
          paid_by: string | null
          receipt_path: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          deleted_at?: string | null
          description: string
          event_id: string
          id?: string
          legacy_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          receipt_path?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          event_id?: string
          id?: string
          legacy_id?: string | null
          paid_at?: string | null
          paid_by?: string | null
          receipt_path?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_finances_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      failed_cases: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          legacy_id: string | null
          lessons: string | null
          reason: string
          recorded_at: string
          source_id: string
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          lessons?: string | null
          reason: string
          recorded_at: string
          source_id: string
          source_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          lessons?: string | null
          reason?: string
          recorded_at?: string
          source_id?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_materials: {
        Row: {
          created_at: string
          deleted_at: string | null
          event_id: string | null
          file_path: string | null
          id: string
          legacy_id: string | null
          name: string
          notes: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          file_path?: string | null
          id?: string
          legacy_id?: string | null
          name: string
          notes?: string | null
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          file_path?: string | null
          id?: string
          legacy_id?: string | null
          name?: string
          notes?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'event_materials_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'events'
            referencedColumns: ['id']
          },
        ]
      }
      event_templates: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          event_type: string
          id: string
          last_used_at: string | null
          legacy_id: string | null
          name: string
          tags: string | null
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          event_type: string
          id?: string
          last_used_at?: string | null
          legacy_id?: string | null
          name: string
          tags?: string | null
          type: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          event_type?: string
          id?: string
          last_used_at?: string | null
          legacy_id?: string | null
          name?: string
          tags?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      import_history: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_name: string
          id: string
          imported_at: string
          legacy_id: string | null
          new_count: number
          snapshot: Json
          total_rows: number
          updated_at: string
          updated_count: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_name: string
          id?: string
          imported_at: string
          legacy_id?: string | null
          new_count?: number
          snapshot?: Json
          total_rows?: number
          updated_at?: string
          updated_count?: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          id?: string
          imported_at?: string
          legacy_id?: string | null
          new_count?: number
          snapshot?: Json
          total_rows?: number
          updated_at?: string
          updated_count?: number
        }
        Relationships: []
      }
      gmv_metrics: {
        Row: {
          amount_minor: number
          created_at: string
          currency: string
          deleted_at: string | null
          id: string
          legacy_id: string | null
          metric_date: string
          region: string
          updated_at: string
        }
        Insert: {
          amount_minor: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          metric_date: string
          region?: string
          updated_at?: string
        }
        Update: {
          amount_minor?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          id?: string
          legacy_id?: string | null
          metric_date?: string
          region?: string
          updated_at?: string
        }
        Relationships: []
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
      notifications: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_read: boolean
          legacy_id: string | null
          link: string | null
          recipient_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          legacy_id?: string | null
          link?: string | null
          recipient_id: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_read?: boolean
          legacy_id?: string | null
          link?: string | null
          recipient_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_recipient_id_fkey'
            columns: ['recipient_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
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
      trending_topics: {
        Row: {
          converted_to_idea: boolean
          created_at: string
          deleted_at: string | null
          discovered_at: string
          heat_level: string
          id: string
          insight: string | null
          keywords: string | null
          legacy_id: string | null
          reference_url: string | null
          source: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          converted_to_idea?: boolean
          created_at?: string
          deleted_at?: string | null
          discovered_at: string
          heat_level: string
          id?: string
          insight?: string | null
          keywords?: string | null
          legacy_id?: string | null
          reference_url?: string | null
          source?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          converted_to_idea?: boolean
          created_at?: string
          deleted_at?: string | null
          discovered_at?: string
          heat_level?: string
          id?: string
          insight?: string | null
          keywords?: string | null
          legacy_id?: string | null
          reference_url?: string | null
          source?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_tasks: {
        Row: {
          assignee_name: string
          created_at: string
          deleted_at: string | null
          due_at: string | null
          id: string
          legacy_id: string | null
          progress: number
          region: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_name: string
          created_at?: string
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          legacy_id?: string | null
          progress?: number
          region?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_name?: string
          created_at?: string
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          legacy_id?: string | null
          progress?: number
          region?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          capacity_max: number
          capacity_min: number
          city: string
          cons: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_verified: boolean
          legacy_id: string | null
          name: string
          photo_paths: string[]
          price_range: string | null
          pros: string | null
          scene_tags: string | null
          site_visit_date: string | null
          site_visit_notes: string | null
          type: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          address?: string | null
          capacity_max?: number
          capacity_min?: number
          city: string
          cons?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_verified?: boolean
          legacy_id?: string | null
          name: string
          photo_paths?: string[]
          price_range?: string | null
          pros?: string | null
          scene_tags?: string | null
          site_visit_date?: string | null
          site_visit_notes?: string | null
          type: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          address?: string | null
          capacity_max?: number
          capacity_min?: number
          city?: string
          cons?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_verified?: boolean
          legacy_id?: string | null
          name?: string
          photo_paths?: string[]
          price_range?: string | null
          pros?: string | null
          scene_tags?: string | null
          site_visit_date?: string | null
          site_visit_notes?: string | null
          type?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      video_ideas: {
        Row: {
          account: string
          ai_analysis: string | null
          analyzed_at: string | null
          comments: number
          completion_rate: number
          created_at: string
          deleted_at: string | null
          description: string | null
          follower_gain: number
          id: string
          is_viral: boolean
          legacy_id: string | null
          likes: number
          publish_date: string
          shares: number
          source_url: string | null
          tags: string | null
          title: string
          updated_at: string
          video_type: string
          views: number
        }
        Insert: {
          account: string
          ai_analysis?: string | null
          analyzed_at?: string | null
          comments?: number
          completion_rate?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          follower_gain?: number
          id?: string
          is_viral?: boolean
          legacy_id?: string | null
          likes?: number
          publish_date: string
          shares?: number
          source_url?: string | null
          tags?: string | null
          title: string
          updated_at?: string
          video_type: string
          views?: number
        }
        Update: {
          account?: string
          ai_analysis?: string | null
          analyzed_at?: string | null
          comments?: number
          completion_rate?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          follower_gain?: number
          id?: string
          is_viral?: boolean
          legacy_id?: string | null
          likes?: number
          publish_date?: string
          shares?: number
          source_url?: string | null
          tags?: string | null
          title?: string
          updated_at?: string
          video_type?: string
          views?: number
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          comparison_json: string
          created_at: string
          deleted_at: string | null
          generated_at: string
          id: string
          legacy_id: string | null
          trends: string
          updated_at: string
          week_start: string
        }
        Insert: {
          comparison_json: string
          created_at?: string
          deleted_at?: string | null
          generated_at: string
          id?: string
          legacy_id?: string | null
          trends: string
          updated_at?: string
          week_start: string
        }
        Update: {
          comparison_json?: string
          created_at?: string
          deleted_at?: string | null
          generated_at?: string
          id?: string
          legacy_id?: string | null
          trends?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
      video_tasks: {
        Row: {
          created_at: string
          creator_name: string | null
          deleted_at: string | null
          due_at: string | null
          id: string
          legacy_id: string | null
          owner_name: string
          product_name: string | null
          region: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_name?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          legacy_id?: string | null
          owner_name: string
          product_name?: string | null
          region: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_name?: string | null
          deleted_at?: string | null
          due_at?: string | null
          id?: string
          legacy_id?: string | null
          owner_name?: string
          product_name?: string | null
          region?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string
          creator_id: string | null
          creator_name: string | null
          deleted_at: string | null
          file_path: string
          id: string
          legacy_id: string | null
          product_name: string | null
          publish_at: string | null
          region: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id?: string | null
          creator_name?: string | null
          deleted_at?: string | null
          file_path: string
          id?: string
          legacy_id?: string | null
          product_name?: string | null
          publish_at?: string | null
          region: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string | null
          creator_name?: string | null
          deleted_at?: string | null
          file_path?: string
          id?: string
          legacy_id?: string | null
          product_name?: string | null
          publish_at?: string | null
          region?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'videos_creator_id_fkey'
            columns: ['creator_id']
            isOneToOne: false
            referencedRelation: 'creators'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      video_idea_account_stats: {
        Row: {
          account: string | null
          average_completion_rate: number | null
          views: number | null
          viral_count: number | null
        }
        Relationships: []
      }
      video_idea_summary: {
        Row: {
          average_completion_rate: number | null
          average_views: number | null
          monthly_new: number | null
          total_follower_gain: number | null
          total_videos: number | null
          viral_count: number | null
          viral_rate: number | null
        }
        Relationships: []
      }
      video_idea_type_stats: {
        Row: {
          average_completion_rate: number | null
          video_type: string | null
        }
        Relationships: []
      }
      video_idea_viral_features: {
        Row: {
          count: number | null
          feature_rank: number | null
          feature_type: string | null
          value: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      current_user_status: { Args: never; Returns: string }
      has_any_role: { Args: { required_roles: string[] }; Returns: boolean }
      invalidate_import_history: {
        Args: { target_id: string }
        Returns: boolean
      }
      recalculate_video_idea_viral: {
        Args: { target_account: string }
        Returns: undefined
      }
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
