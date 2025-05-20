-- Add payment_status column to sales table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE sales ADD COLUMN payment_status VARCHAR(20) DEFAULT 'Paid';
  END IF;
END $$;

-- Add amount_paid column to sales table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sales' 
    AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE sales ADD COLUMN amount_paid NUMERIC DEFAULT NULL;
  END IF;
END $$;

-- Update existing sales to have payment_status = 'Paid' and amount_paid = total_amount
UPDATE sales 
SET payment_status = 'Paid', amount_paid = total_amount 
WHERE payment_status IS NULL OR payment_status = '';
