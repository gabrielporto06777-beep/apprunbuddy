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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          audio_coach_enabled: boolean | null
          avg_pace: string | null
          avg_run_distance: string | null
          created_at: string | null
          fitness_level: string | null
          height_cm: number | null
          id: string
          injuries: string | null
          name: string | null
          preferred_workouts: string | null
          race_date: string | null
          race_goal: string | null
          running_frequency: string | null
          session_duration_min: number | null
          training_intensity: string | null
          training_location: string | null
          weekly_goal_days: number | null
          weekly_goal_km: number | null
          weight_kg: number | null
        }
        Insert: {
          audio_coach_enabled?: boolean | null
          avg_pace?: string | null
          avg_run_distance?: string | null
          created_at?: string | null
          fitness_level?: string | null
          height_cm?: number | null
          id: string
          injuries?: string | null
          name?: string | null
          preferred_workouts?: string | null
          race_date?: string | null
          race_goal?: string | null
          running_frequency?: string | null
          session_duration_min?: number | null
          training_intensity?: string | null
          training_location?: string | null
          weekly_goal_days?: number | null
          weekly_goal_km?: number | null
          weight_kg?: number | null
        }
        Update: {
          audio_coach_enabled?: boolean | null
          avg_pace?: string | null
          avg_run_distance?: string | null
          created_at?: string | null
          fitness_level?: string | null
          height_cm?: number | null
          id?: string
          injuries?: string | null
          name?: string | null
          preferred_workouts?: string | null
          race_date?: string | null
          race_goal?: string | null
          running_frequency?: string | null
          session_duration_min?: number | null
          training_intensity?: string | null
          training_location?: string | null
          weekly_goal_days?: number | null
          weekly_goal_km?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      runs: {
        Row: {
          avg_pace_seconds: number | null
          calories: number | null
          created_at: string | null
          distance_km: number
          duration_seconds: number
          id: string
          route_geojson: Json | null
          splits: Json | null
          user_id: string
        }
        Insert: {
          avg_pace_seconds?: number | null
          calories?: number | null
          created_at?: string | null
          distance_km: number
          duration_seconds: number
          id?: string
          route_geojson?: Json | null
          splits?: Json | null
          user_id: string
        }
        Update: {
          avg_pace_seconds?: number | null
          calories?: number | null
          created_at?: string | null
          distance_km?: number
          duration_seconds?: number
          id?: string
          route_geojson?: Json | null
          splits?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      strava_tokens: {
        Row: {
          access_token: string
          expires_at: string
          id: string
          refresh_token: string
          user_id: string
        }
        Insert: {
          access_token: string
          expires_at: string
          id?: string
          refresh_token: string
          user_id: string
        }
        Update: {
          access_token?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strava_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          id: string
          level: string | null
          name: string
          total_weeks: number
        }
        Insert: {
          id?: string
          level?: string | null
          name: string
          total_weeks: number
        }
        Update: {
          id?: string
          level?: string | null
          name?: string
          total_weeks?: number
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          completed: boolean | null
          completed_run_id: string | null
          created_at: string | null
          day_of_week: number
          description: string | null
          distance_km: number | null
          id: string
          plan_id: string
          session_type: string
          target_pace: string | null
          title: string
          user_id: string
          week_number: number
        }
        Insert: {
          completed?: boolean | null
          completed_run_id?: string | null
          created_at?: string | null
          day_of_week: number
          description?: string | null
          distance_km?: number | null
          id?: string
          plan_id: string
          session_type: string
          target_pace?: string | null
          title: string
          user_id: string
          week_number: number
        }
        Update: {
          completed?: boolean | null
          completed_run_id?: string | null
          created_at?: string | null
          day_of_week?: number
          description?: string | null
          distance_km?: number | null
          id?: string
          plan_id?: string
          session_type?: string
          target_pace?: string | null
          title?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_completed_run_id_fkey"
            columns: ["completed_run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          strava_avatar: string | null
          strava_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          strava_avatar?: string | null
          strava_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          strava_avatar?: string | null
          strava_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
