-- Add amount_due column to sales table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'amount_due'
  ) THEN
    ALTER TABLE sales ADD COLUMN amount_due NUMERIC DEFAULT 0;
    
    -- Update existing sales to have amount_due calculated from total_amount - amount_paid
    UPDATE sales 
    SET amount_due = GREATEST(0, total_amount - COALESCE(amount_paid, 0))
    WHERE amount_due IS NULL OR amount_due = 0;
  END IF;
END $$;
