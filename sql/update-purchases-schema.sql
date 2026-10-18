-- Add payment_status column to purchases table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE purchases ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Paid';
  END IF;
END $$;

-- Add payment_method column to purchases table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE purchases ADD COLUMN payment_method VARCHAR(50) DEFAULT 'Cash';
  END IF;
END $$;

-- Add amount_paid column to purchases table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE purchases ADD COLUMN amount_paid NUMERIC DEFAULT NULL;
  END IF;
END $$;

-- Add amount_due column to purchases table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'amount_due'
  ) THEN
    ALTER TABLE purchases ADD COLUMN amount_due NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Add agreement_terms column to purchases table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'purchases' 
    AND column_name = 'agreement_terms'
  ) THEN
    ALTER TABLE purchases ADD COLUMN agreement_terms TEXT DEFAULT NULL;
  END IF;
END $$;

-- Update existing purchases to have payment_status = 'Paid', amount_paid = total_amount, and amount_due = 0
UPDATE purchases 
SET 
  payment_status = COALESCE(NULLIF(payment_status, ''), 'Paid'),
  amount_paid = COALESCE(amount_paid, total_amount),
  amount_due = GREATEST(0, total_amount - COALESCE(amount_paid, total_amount))
WHERE payment_status IS NULL OR payment_status = '' OR amount_paid IS NULL;
