-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS check_table_exists(text);

-- Create a new function with a more specific implementation
CREATE OR REPLACE FUNCTION check_table_exists(p_table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND tables.table_name = p_table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
