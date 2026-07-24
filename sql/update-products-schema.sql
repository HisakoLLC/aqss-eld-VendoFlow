-- Add user_id column to products table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Update existing products to set user_id to the first user in the system
-- This is a temporary measure to ensure existing products have an owner
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        UPDATE products SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;
