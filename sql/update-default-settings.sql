-- Insert default settings if they don't exist
INSERT INTO settings (key, value, description, created_at, updated_at)
VALUES 
('store_name', 'AQSS Flow Limited', 'Store name setting', NOW(), NOW()),
('store_address', 'Eastleigh, Nairobi', 'Store address setting', NOW(), NOW()),
('store_phone', 'Phone: +254799964646', 'Store phone setting', NOW(), NOW()),
('store_email', 'Email: aqssflow@gmail.com', 'Store email setting', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
