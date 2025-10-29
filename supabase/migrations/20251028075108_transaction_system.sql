-- Transaction System Migration
-- This migration adds the complete database schema for the transaction system
-- including users, api_keys, balances, transactions, and mutations tables

-- Create users table (extends the existing customer/stripe integration)
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "email" TEXT NOT NULL UNIQUE,
    "wa" TEXT,
    "telegram" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "verified" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create api_keys table for API authentication
CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "key" TEXT PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "last_used_at" TIMESTAMP WITH TIME ZONE,
    "is_active" BOOLEAN DEFAULT true
);

-- Create balances table
CREATE TABLE IF NOT EXISTS "public"."balances" (
    "user_id" UUID PRIMARY KEY REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "amount" NUMERIC(15,2) DEFAULT 0.00 NOT NULL,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "sender_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE RESTRICT,
    "receiver_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE RESTRICT,
    "amount" NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    "paid" BOOLEAN DEFAULT false,
    "items" NUMERIC DEFAULT 1,
    "orderid" TEXT NOT NULL UNIQUE,
    "bayarvia" TEXT NOT NULL DEFAULT 'transfer',
    "unikcode" NUMERIC,
    "grandtotal" NUMERIC(15,2) NOT NULL,
    "namaproduk" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create mutations table for balance change tracking
CREATE TABLE IF NOT EXISTS "public"."mutations" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "user_id" UUID NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "balance" NUMERIC(15,2) NOT NULL,
    "prev_balance" NUMERIC(15,2) NOT NULL,
    "type" TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
    "catatan" TEXT,
    "transaction_id" UUID REFERENCES "public"."transactions"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for foreign keys and performance
CREATE INDEX IF NOT EXISTS "idx_api_keys_user_id" ON "public"."api_keys"("user_id");
CREATE INDEX IF NOT EXISTS "idx_api_keys_key_active" ON "public"."api_keys"("key", "is_active");
CREATE INDEX IF NOT EXISTS "idx_transactions_sender_id" ON "public"."transactions"("sender_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_receiver_id" ON "public"."transactions"("receiver_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_created_at" ON "public"."transactions"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_mutations_user_id" ON "public"."mutations"("user_id");
CREATE INDEX IF NOT EXISTS "idx_mutations_created_at" ON "public"."mutations"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_mutations_transaction_id" ON "public"."mutations"("transaction_id");
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "public"."users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_banned" ON "public"."users"("banned");

-- Enable Row Level Security
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."balances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."mutations" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users table policies
CREATE POLICY "Users can view their own profile" ON "public"."users"
    FOR SELECT USING (id = requesting_user_id());

CREATE POLICY "Service role can manage all users" ON "public"."users"
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- API Keys table policies
CREATE POLICY "Users can view their own API keys" ON "public"."api_keys"
    FOR SELECT USING (user_id = requesting_user_id());

CREATE POLICY "Service role can manage all API keys" ON "public"."api_keys"
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Balances table policies
CREATE POLICY "Users can view their own balance" ON "public"."balances"
    FOR SELECT USING (user_id = requesting_user_id());

CREATE POLICY "Service role can manage all balances" ON "public"."balances"
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Transactions table policies
CREATE POLICY "Users can view their own transactions" ON "public"."transactions"
    FOR SELECT USING (sender_id = requesting_user_id() OR receiver_id = requesting_user_id());

CREATE POLICY "Service role can manage all transactions" ON "public"."transactions"
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Mutations table policies
CREATE POLICY "Users can view their own mutations" ON "public"."mutations"
    FOR SELECT USING (user_id = requesting_user_id());

CREATE POLICY "Service role can manage all mutations" ON "public"."mutations"
    FOR ALL USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Grant permissions to authenticated and service roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."users" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."api_keys" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."balances" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."transactions" TO "authenticated";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."mutations" TO "authenticated";

GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."users" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."api_keys" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."balances" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."transactions" TO "service_role";
GRANT SELECT, INSERT, UPDATE, DELETE ON "public"."mutations" TO "service_role";

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "public"."users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON "public"."transactions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balances_updated_at BEFORE UPDATE ON "public"."balances"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create the atomic payment handling function
CREATE OR REPLACE FUNCTION handle_payment(
    p_sender_id UUID,
    p_receiver_id UUID,
    p_amount NUMERIC,
    p_orderid TEXT DEFAULT NULL,
    p_bayarvia TEXT DEFAULT 'transfer',
    p_namaproduk TEXT DEFAULT NULL,
    p_catatan TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_balance NUMERIC;
    v_receiver_balance NUMERIC;
    v_transaction_id UUID;
    v_sender_prev_balance NUMERIC;
    v_receiver_prev_balance NUMERIC;
    v_final_orderid TEXT;
BEGIN
    -- Validate input parameters
    IF p_amount <= 0 THEN
        RETURN json_build_object('error', 'Amount must be greater than 0', 'code', 'INVALID_AMOUNT');
    END IF;

    IF p_sender_id = p_receiver_id THEN
        RETURN json_build_object('error', 'Cannot send to yourself', 'code', 'SELF_TRANSFER');
    END IF;

    -- Check if sender exists and is not banned
    IF NOT EXISTS (SELECT 1 FROM "public"."users" WHERE id = p_sender_id AND banned = false) THEN
        RETURN json_build_object('error', 'Sender not found or banned', 'code', 'SENDER_NOT_FOUND');
    END IF;

    -- Check if receiver exists and is not banned
    IF NOT EXISTS (SELECT 1 FROM "public"."users" WHERE id = p_receiver_id AND banned = false) THEN
        RETURN json_build_object('error', 'Receiver not found or banned', 'code', 'RECEIVER_NOT_FOUND');
    END IF;

    -- Generate unique orderid if not provided
    v_final_orderid := COALESCE(p_orderid, 'TRX_' || to_char(now(), 'YYYYMMDD_HH24MISS') || '_' || substr(gen_random_uuid()::text, 1, 8));

    -- Check if orderid already exists
    IF EXISTS (SELECT 1 FROM "public"."transactions" WHERE orderid = v_final_orderid) THEN
        RETURN json_build_object('error', 'Order ID already exists', 'code', 'DUPLICATE_ORDERID');
    END IF;

    -- Start the transaction
    -- Lock sender and receiver balance rows to prevent concurrent modifications
    SELECT amount INTO v_sender_balance FROM "public"."balances" WHERE user_id = p_sender_id FOR UPDATE;
    SELECT amount INTO v_receiver_balance FROM "public"."balances" WHERE user_id = p_receiver_id FOR UPDATE;

    -- Check if sender has sufficient balance
    IF v_sender_balance IS NULL THEN
        RETURN json_build_object('error', 'Sender balance not found', 'code', 'SENDER_BALANCE_NOT_FOUND');
    END IF;

    IF v_sender_balance < p_amount THEN
        RETURN json_build_object('error', 'Insufficient funds', 'code', 'INSUFFICIENT_FUNDS');
    END IF;

    -- Store previous balances for mutation records
    v_sender_prev_balance := v_sender_balance;
    v_receiver_prev_balance := COALESCE(v_receiver_balance, 0);

    -- Update sender balance (debit)
    UPDATE "public"."balances"
    SET amount = amount - p_amount, updated_at = timezone('utc'::text, now())
    WHERE user_id = p_sender_id;

    -- Update or create receiver balance (credit)
    IF v_receiver_balance IS NOT NULL THEN
        UPDATE "public"."balances"
        SET amount = amount + p_amount, updated_at = timezone('utc'::text, now())
        WHERE user_id = p_receiver_id;
    ELSE
        INSERT INTO "public"."balances" (user_id, amount)
        VALUES (p_receiver_id, p_amount);
        v_receiver_balance := p_amount;
    END IF;

    -- Create transaction record
    INSERT INTO "public"."transactions" (
        sender_id, receiver_id, amount, paid, orderid, bayarvia, grandtotal, namaproduk, catatan
    )
    VALUES (
        p_sender_id, p_receiver_id, p_amount, true, v_final_orderid, p_bayarvia, p_amount, p_namaproduk, p_catatan
    )
    RETURNING id INTO v_transaction_id;

    -- Create mutation record for sender (debit)
    INSERT INTO "public"."mutations" (
        user_id, balance, prev_balance, type, catatan, transaction_id
    )
    VALUES (
        p_sender_id,
        v_sender_balance - p_amount,
        v_sender_prev_balance,
        'debit',
        v_transaction_id::text,
        v_transaction_id
    );

    -- Create mutation record for receiver (credit)
    INSERT INTO "public"."mutations" (
        user_id, balance, prev_balance, type, catatan, transaction_id
    )
    VALUES (
        p_receiver_id,
        v_receiver_balance + p_amount,
        v_receiver_prev_balance,
        'credit',
        v_transaction_id::text,
        v_transaction_id
    );

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'orderid', v_final_orderid,
        'amount', p_amount,
        'sender_new_balance', v_sender_balance - p_amount,
        'receiver_new_balance', v_receiver_balance + p_amount
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback and return error
        RETURN json_build_object(
            'error', SQLERRM,
            'code', 'DATABASE_ERROR'
        );
END;
$$;

-- Create function to validate API key
CREATE OR REPLACE FUNCTION validate_api_key(api_key_param TEXT)
RETURNS TABLE(user_id UUID, is_valid BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ak.user_id,
        (ak.is_active = true AND u.banned = false AND u.verified = true) as is_valid
    FROM "public"."api_keys" ak
    JOIN "public"."users" u ON ak.user_id = u.id
    WHERE ak.key = api_key_param
    AND ak.is_active = true
    AND u.banned = false
    AND u.verified = true
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;
END;
$$;

-- Create function to get user balance
CREATE OR REPLACE FUNCTION get_user_balance(user_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
BEGIN
    SELECT amount INTO v_balance
    FROM "public"."balances"
    WHERE user_id = user_id_param;

    RETURN COALESCE(v_balance, 0);
END;
$$;