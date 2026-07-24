-- First, enable RLS on the settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
ON settings
FOR SELECT
TO authenticated
USING (true);

-- Create a policy that allows service role to do everything
CREATE POLICY "Allow service role to manage settings"
ON settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create a policy that allows anonymous users to read settings
-- This is useful for public-facing parts of your app
CREATE POLICY "Allow anonymous users to read settings"
ON settings
FOR SELECT
TO anon
USING (true);
