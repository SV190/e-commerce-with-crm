-- Таблица для хранения корзины пользователя
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    cart_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Таблица для хранения избранных товаров пользователя
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
    favorites_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Таблица для хранения заказов
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'canceled', 'cancelled')),
    address TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Таблица для хранения элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) NOT NULL,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Включаем Row Level Security
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для корзины
CREATE POLICY "Пользователи могут читать только свою корзину" ON user_carts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свою корзину" ON user_carts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут вставлять только свою корзину" ON user_carts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики безопасности для избранного
CREATE POLICY "Пользователи могут читать только свое избранное" ON user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свое избранное" ON user_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут вставлять только свое избранное" ON user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики безопасности для заказов
CREATE POLICY "Пользователи могут читать только свои заказы" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Пользователи могут вставлять только свои заказы" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Пользователи могут обновлять только свои заказы" ON orders
    FOR UPDATE USING (auth.uid() = user_id);

-- Политики безопасности для элементов заказа
CREATE POLICY "Пользователи могут читать элементы своих заказов" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Пользователи могут вставлять элементы в свои заказы" ON order_items
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_carts_updated_at
BEFORE UPDATE ON user_carts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_favorites_updated_at
BEFORE UPDATE ON user_favorites
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 