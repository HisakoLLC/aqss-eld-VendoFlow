-- First, let's check if the table exists and drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable insert access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable update access for all users" ON expenses;
DROP POLICY IF EXISTS "Enable delete access for all users" ON expenses;

-- Disable RLS temporarily to reset
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies that allow all operations
CREATE POLICY "Allow all operations for service role" ON expenses
FOR ALL USING (true) WITH CHECK (true);

-- Grant all permissions to the service role and authenticated users
GRANT ALL PRIVILEGES ON expenses TO service_role;
GRANT ALL PRIVILEGES ON expenses TO authenticated;
GRANT ALL PRIVILEGES ON expenses TO anon;

-- Also grant permissions on the table to postgres role
GRANT ALL PRIVILEGES ON expenses TO postgres;

-- Make sure the table is accessible
ALTER TABLE expenses OWNER TO postgres;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;
