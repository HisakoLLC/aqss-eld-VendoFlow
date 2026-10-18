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

-- Reconcile and fix amounts for unpaid/credit/agreement purchases
UPDATE purchases 
SET 
  amount_paid = 0,
  amount_due = total_amount
WHERE (
  LOWER(COALESCE(payment_status, '')) LIKE '%unpaid%' 
  OR LOWER(COALESCE(payment_status, '')) LIKE '%credit%' 
  OR LOWER(COALESCE(payment_status, '')) LIKE '%agree%'
) AND (amount_due IS NULL OR amount_due = 0 OR amount_paid = total_amount);

-- Reconcile and fix amounts for fully paid purchases
UPDATE purchases 
SET 
  payment_status = 'Paid',
  amount_paid = total_amount,
  amount_due = 0
WHERE (
  payment_status IS NULL 
  OR payment_status = '' 
  OR LOWER(payment_status) = 'paid' 
  OR LOWER(payment_status) = 'fully paid'
) AND (amount_paid IS NULL OR amount_due IS NULL OR amount_due > 0);
