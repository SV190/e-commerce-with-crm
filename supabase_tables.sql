CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE TABLE IF NOT EXISTS orders (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id TEXT NOT NULL, total NUMERIC NOT NULL, status TEXT NOT NULL, address TEXT NOT NULL, payment_method TEXT NOT NULL, phone_number TEXT NOT NULL, delivery_option TEXT NOT NULL, total_amount NUMERIC NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE);
CREATE TABLE IF NOT EXISTS order_items (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_id UUID REFERENCES orders(id) ON DELETE CASCADE, product_id TEXT NOT NULL, product_name TEXT NOT NULL, price NUMERIC NOT NULL, quantity INTEGER NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS crm_orders (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_id TEXT NOT NULL, order_data JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'new', processed BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE);
