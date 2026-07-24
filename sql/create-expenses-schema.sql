-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Utilities', 'Supplies', 'Rent', 'Transport', 'Other')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_method VARCHAR(50) NOT NULL,
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  attachment_url TEXT,
  recorded_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_method ON expenses(payment_method);

-- Insert some sample data
INSERT INTO expenses (title, category, amount, payment_method, expense_date, notes, recorded_by) VALUES
('Office Rent', 'Rent', 25000.00, 'Bank', NOW() - INTERVAL '1 day', 'Monthly office rent payment', 'Admin'),
('Printer Ink Cartridges', 'Supplies', 3500.00, 'M-Pesa', NOW() - INTERVAL '2 hours', 'Black and color ink cartridges', 'Admin'),
('Electricity Bill', 'Utilities', 8750.00, 'M-Pesa', NOW() - INTERVAL '3 days', 'Monthly electricity bill', 'Admin'),
('Delivery Fuel', 'Transport', 2000.00, 'Cash', NOW() - INTERVAL '1 hour', 'Fuel for delivery motorcycle', 'Admin'),
('Internet Bill', 'Utilities', 4500.00, 'Bank', NOW() - INTERVAL '5 days', 'Monthly internet subscription', 'Admin'),
('Office Supplies', 'Supplies', 1200.00, 'Cash', NOW() - INTERVAL '6 hours', 'Pens, papers, and folders', 'Admin'),
('Transport Allowance', 'Transport', 5000.00, 'M-Pesa', NOW() - INTERVAL '2 days', 'Staff transport allowance', 'Admin'),
('Water Bill', 'Utilities', 1800.00, 'M-Pesa', NOW() - INTERVAL '4 days', 'Monthly water bill', 'Admin');
