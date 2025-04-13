-- Create defects table
CREATE TABLE IF NOT EXISTS defects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    defect_type TEXT NOT NULL CHECK (defect_type IN ('production', 'material', 'equipment', 'other')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
    user_id UUID REFERENCES auth.users(id)
);

-- Create returns table
CREATE TABLE IF NOT EXISTS returns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    return_reason TEXT NOT NULL CHECK (return_reason IN ('quality', 'damage', 'wrong', 'other')),
    batch_number TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    user_id UUID REFERENCES auth.users(id)
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    report_type TEXT NOT NULL CHECK (report_type IN ('defects', 'returns', 'financial', 'combined')),
    period TEXT NOT NULL CHECK (period IN ('day', 'week', 'month', 'quarter', 'year')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    file_url TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON defects FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON defects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON returns FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON returns FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON reports FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated'); 