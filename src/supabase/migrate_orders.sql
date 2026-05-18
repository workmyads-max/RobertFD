-- ==================================================
-- MIGRATE ORDERS FROM BASE44 TO SUPABASE
-- ==================================================
-- Run this AFTER exporting orders from Base44 as CSV
-- Or manually insert orders for testing

-- Example: Manual test order insertion
-- Replace with your actual order data
INSERT INTO public.orders (
  order_id,
  challenge_type,
  account_type,
  account_size,
  platform,
  leverage,
  price,
  payment_method,
  payment_gateway,
  payment_address,
  payment_status,
  full_name,
  username,
  email,
  phone,
  country,
  city,
  address,
  postal_code,
  transaction_id,
  account_id,
  coupon_code,
  discount_amount,
  affiliate_code,
  created_at,
  updated_at
) VALUES (
  'RF-TEST-001',
  'two-step',
  'standard',
  100000,
  'xtrading',
  '1:100',
  517,
  'usdt_trc20',
  'manual',
  'TConfigureInAdminWalletSettings',
  'pending',
  'Test User',
  'testuser',
  'test@example.com',
  '+1234567890',
  'United States',
  'New York',
  '123 Main St',
  '10001',
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  NOW(),
  NOW()
);

-- Verify the order was inserted
SELECT order_id, email, payment_status, price, created_at 
FROM public.orders 
ORDER BY created_at DESC 
LIMIT 10;