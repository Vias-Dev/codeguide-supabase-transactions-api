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
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
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
            customers: {
                Row: {
                    id: string
                    stripe_customer_id: string | null
                }
                Insert: {
                    id: string
                    stripe_customer_id?: string | null
                }
                Update: {
                    id?: string
                    stripe_customer_id?: string | null
                }
                Relationships: []
            }
            prices: {
                Row: {
                    active: boolean | null
                    currency: string | null
                    description: string | null
                    id: string
                    interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count: number | null
                    metadata: Json | null
                    product_id: string | null
                    trial_period_days: number | null
                    type: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount: number | null
                }
                Insert: {
                    active?: boolean | null
                    currency?: string | null
                    description?: string | null
                    id: string
                    interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count?: number | null
                    metadata?: Json | null
                    product_id?: string | null
                    trial_period_days?: number | null
                    type?: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount?: number | null
                }
                Update: {
                    active?: boolean | null
                    currency?: string | null
                    description?: string | null
                    id?: string
                    interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
                    interval_count?: number | null
                    metadata?: Json | null
                    product_id?: string | null
                    trial_period_days?: number | null
                    type?: Database["public"]["Enums"]["pricing_type"] | null
                    unit_amount?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "prices_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    active: boolean | null
                    description: string | null
                    id: string
                    image: string | null
                    live_mode: boolean | null
                    marketing_features: string[] | null
                    metadata: Json | null
                    name: string | null
                }
                Insert: {
                    active?: boolean | null
                    description?: string | null
                    id: string
                    image?: string | null
                    live_mode?: boolean | null
                    marketing_features?: string[] | null
                    metadata?: Json | null
                    name?: string | null
                }
                Update: {
                    active?: boolean | null
                    description?: string | null
                    id?: string
                    image?: string | null
                    live_mode?: boolean | null
                    marketing_features?: string[] | null
                    metadata?: Json | null
                    name?: string | null
                }
                Relationships: []
            }
            subscriptions: {
                Row: {
                    cancel_at: string | null
                    cancel_at_period_end: boolean | null
                    canceled_at: string | null
                    created: string
                    current_period_end: string
                    current_period_start: string
                    ended_at: string | null
                    id: string
                    metadata: Json | null
                    price_id: string | null
                    quantity: number | null
                    status: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end: string | null
                    trial_start: string | null
                    user_id: string
                }
                Insert: {
                    cancel_at?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created?: string
                    current_period_end?: string
                    current_period_start?: string
                    ended_at?: string | null
                    id: string
                    metadata?: Json | null
                    price_id?: string | null
                    quantity?: number | null
                    status?: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end?: string | null
                    trial_start?: string | null
                    user_id: string
                }
                Update: {
                    cancel_at?: string | null
                    cancel_at_period_end?: boolean | null
                    canceled_at?: string | null
                    created?: string
                    current_period_end?: string
                    current_period_start?: string
                    ended_at?: string | null
                    id?: string
                    metadata?: Json | null
                    price_id?: string | null
                    quantity?: number | null
                    status?: Database["public"]["Enums"]["subscription_status"] | null
                    trial_end?: string | null
                    trial_start?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_price_id_fkey"
                        columns: ["price_id"]
                        isOneToOne: false
                        referencedRelation: "prices"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    id: string
                    nama: string
                    role: string
                    email: string
                    wa: string | null
                    telegram: string | null
                    banned: boolean
                    verified: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nama: string
                    role?: string
                    email: string
                    wa?: string | null
                    telegram?: string | null
                    banned?: boolean
                    verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nama?: string
                    role?: string
                    email?: string
                    wa?: string | null
                    telegram?: string | null
                    banned?: boolean
                    verified?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            api_keys: {
                Row: {
                    key: string
                    user_id: string
                    created_at: string
                    last_used_at: string | null
                    is_active: boolean
                }
                Insert: {
                    key: string
                    user_id: string
                    created_at?: string
                    last_used_at?: string | null
                    is_active?: boolean
                }
                Update: {
                    key?: string
                    user_id?: string
                    created_at?: string
                    last_used_at?: string | null
                    is_active?: boolean
                }
                Relationships: [
                    {
                        foreignKeyName: "api_keys_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            balances: {
                Row: {
                    user_id: string
                    amount: number
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    amount?: number
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    amount?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "balances_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            transactions: {
                Row: {
                    id: string
                    sender_id: string
                    receiver_id: string
                    amount: number
                    paid: boolean
                    items: number | null
                    orderid: string
                    bayarvia: string
                    unikcode: number | null
                    grandtotal: number
                    namaproduk: string | null
                    catatan: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    sender_id: string
                    receiver_id: string
                    amount: number
                    paid?: boolean
                    items?: number | null
                    orderid: string
                    bayarvia?: string
                    unikcode?: number | null
                    grandtotal: number
                    namaproduk?: string | null
                    catatan?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    sender_id?: string
                    receiver_id?: string
                    amount?: number
                    paid?: boolean
                    items?: number | null
                    orderid?: string
                    bayarvia?: string
                    unikcode?: number | null
                    grandtotal?: number
                    namaproduk?: string | null
                    catatan?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_receiver_id_fkey"
                        columns: ["receiver_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            mutations: {
                Row: {
                    id: string
                    user_id: string
                    balance: number
                    prev_balance: number
                    type: "debit" | "credit"
                    catatan: string | null
                    transaction_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    balance: number
                    prev_balance: number
                    type: "debit" | "credit"
                    catatan?: string | null
                    transaction_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    balance?: number
                    prev_balance?: number
                    type?: "debit" | "credit"
                    catatan?: string | null
                    transaction_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "mutations_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "mutations_transaction_id_fkey"
                        columns: ["transaction_id"]
                        isOneToOne: false
                        referencedRelation: "transactions"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            handle_payment: {
                Args: {
                    p_sender_id: string
                    p_receiver_id: string
                    p_amount: number
                    p_orderid?: string
                    p_bayarvia?: string
                    p_namaproduk?: string
                    p_catatan?: string
                }
                Returns: Json
            }
            validate_api_key: {
                Args: {
                    api_key_param: string
                }
                Returns: {
                    user_id: string
                    is_valid: boolean
                }
            }
            get_user_balance: {
                Args: {
                    user_id_param: string
                }
                Returns: number
            }
            requesting_user_id: {
                Args: Record<PropertyKey, never>
                Returns: string
            }
        }
        Enums: {
            pricing_plan_interval: "day" | "week" | "month" | "year"
            pricing_type: "one_time" | "recurring"
            subscription_status:
            | "trialing"
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "unpaid"
            | "paused"
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

