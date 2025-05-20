-- Enable Row Level Security on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy for users to select their own products
CREATE POLICY select_products ON products
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own products
CREATE POLICY insert_products ON products
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own products
CREATE POLICY update_products ON products
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own products
CREATE POLICY delete_products ON products
    FOR DELETE
    USING (auth.uid() = user_id);
