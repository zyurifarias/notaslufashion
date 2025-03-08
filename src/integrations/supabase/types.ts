export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clientes: {
        Row: {
          data_criacao: string
          id_cliente: number
          nome: string
          valor_pendente: number
          valor_total: number
        }
        Insert: {
          data_criacao?: string
          id_cliente?: number
          nome: string
          valor_pendente?: number
          valor_total?: number
        }
        Update: {
          data_criacao?: string
          id_cliente?: number
          nome?: string
          valor_pendente?: number
          valor_total?: number
        }
        Relationships: []
      }
      logs_transacoes: {
        Row: {
          data_transacao: string
          id_log: number
          id_nota: number
          tipo_transacao: string
          valor: number
        }
        Insert: {
          data_transacao?: string
          id_log?: number
          id_nota: number
          tipo_transacao: string
          valor?: number
        }
        Update: {
          data_transacao?: string
          id_log?: number
          id_nota?: number
          tipo_transacao?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "logs_transacoes_id_nota_fkey"
            columns: ["id_nota"]
            isOneToOne: false
            referencedRelation: "notas"
            referencedColumns: ["id_nota"]
          },
        ]
      }
      notas: {
        Row: {
          data_criacao: string
          id_cliente: number
          id_nota: number
          valor_nota: number
        }
        Insert: {
          data_criacao?: string
          id_cliente: number
          id_nota?: number
          valor_nota?: number
        }
        Update: {
          data_criacao?: string
          id_cliente?: number
          id_nota?: number
          valor_nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "notas_id_cliente_fkey"
            columns: ["id_cliente"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id_cliente"]
          },
        ]
      }
      pagamentos: {
        Row: {
          data_pagamento: string
          id_nota: number
          id_pagamento: number
          tipo_pagamento: string
          valor_pagamento: number
        }
        Insert: {
          data_pagamento?: string
          id_nota: number
          id_pagamento?: number
          tipo_pagamento: string
          valor_pagamento?: number
        }
        Update: {
          data_pagamento?: string
          id_nota?: number
          id_pagamento?: number
          tipo_pagamento?: string
          valor_pagamento?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_id_nota_fkey"
            columns: ["id_nota"]
            isOneToOne: false
            referencedRelation: "notas"
            referencedColumns: ["id_nota"]
          },
        ]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
