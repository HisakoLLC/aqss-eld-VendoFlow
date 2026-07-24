-- Enable RLS on expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT (read) operations
CREATE POLICY "Enable read access for all users" ON expenses
FOR SELECT USING (true);

-- Policy for INSERT (create) operations
CREATE POLICY "Enable insert access for all users" ON expenses
FOR INSERT WITH CHECK (true);

-- Policy for UPDATE (edit) operations
CREATE POLICY "Enable update access for all users" ON expenses
FOR UPDATE USING (true);

-- Policy for DELETE operations
CREATE POLICY "Enable delete access for all users" ON expenses
FOR DELETE USING (true);

-- Grant necessary permissions to authenticated users
GRANT ALL ON expenses TO authenticated;
GRANT ALL ON expenses TO anon;

-- Grant usage on the sequence
GRANT USAGE, SELECT ON SEQUENCE expenses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE expenses_id_seq TO anon;
