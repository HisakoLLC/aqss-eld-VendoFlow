-- Insert or update default settings for AQSS Flow Limited
INSERT INTO settings (key, value, description, created_at, updated_at)
VALUES 
('store_name', 'AQSS Flow Limited', 'Store name setting', NOW(), NOW()),
('store_address', 'Eastleigh, Nairobi, Kenya', 'Store address setting', NOW(), NOW()),
('store_phone', '+254 799 964 646', 'Store phone setting', NOW(), NOW()),
('store_email', 'aqssflow@gmail.com', 'Store email setting', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, updated_at = NOW();
