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
      attendance: {
        Row: {
          day: number
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          foto_url: string
          id: string
          input_by: string | null
          is_flagged: boolean | null
          mahasiswa_id: string
          mode: string
          submitted_at: string | null
        }
        Insert: {
          day: number
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          foto_url: string
          id?: string
          input_by?: string | null
          is_flagged?: boolean | null
          mahasiswa_id: string
          mode: string
          submitted_at?: string | null
        }
        Update: {
          day?: number
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          foto_url?: string
          id?: string
          input_by?: string | null
          is_flagged?: boolean | null
          mahasiswa_id?: string
          mode?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_flagged_by_fkey"
            columns: ["flagged_by"]
            isOneToOne: false
            referencedRelation: "panitia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_input_by_fkey"
            columns: ["input_by"]
            isOneToOne: false
            referencedRelation: "panitia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          day: number
          id: string
          kategori: string
          komentar: string | null
          mahasiswa_id: string
          rating: number
          sumbitted_at: string | null
        }
        Insert: {
          day: number
          id?: string
          kategori: string
          komentar?: string | null
          mahasiswa_id: string
          rating: number
          sumbitted_at?: string | null
        }
        Update: {
          day?: number
          id?: string
          kategori?: string
          komentar?: string | null
          mahasiswa_id?: string
          rating?: number
          sumbitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
        ]
      }
      mahasiswa: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nama: string
          nama_normalized: string | null
          no_wa: string | null
          prodi_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nama: string
          nama_normalized?: string | null
          no_wa?: string | null
          prodi_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nama?: string
          nama_normalized?: string | null
          no_wa?: string | null
          prodi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mahasiswa_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      panitia: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nama: string
          role: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nama: string
          role?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nama?: string
          role?: string
        }
        Relationships: []
      }
      prodi: {
        Row: {
          created_at: string | null
          fakultas: string | null
          id: string
          kode: string
          nama: string
        }
        Insert: {
          created_at?: string | null
          fakultas?: string | null
          id?: string
          kode: string
          nama: string
        }
        Update: {
          created_at?: string | null
          fakultas?: string | null
          id?: string
          kode?: string
          nama?: string
        }
        Relationships: []
      }
      qr_session: {
        Row: {
          created_at: string | null
          created_by: string | null
          day: number
          id: string
          is_active: boolean | null
          token: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          day: number
          id?: string
          is_active?: boolean | null
          token: string
          type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          day?: number
          id?: string
          is_active?: boolean | null
          token?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_session_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "panitia"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
