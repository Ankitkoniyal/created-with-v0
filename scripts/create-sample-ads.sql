-- Created SQL script to insert the 5 sample ads from the test plan
-- Sample Ads for Testing - Based on Test Plan Requirements

-- First, ensure we have a test user (you may need to adjust the user_id)
-- Replace 'YOUR_USER_ID_HERE' with an actual user ID from your profiles table

INSERT INTO products (
  id,
  user_id,
  title,
  description,
  price,
  condition,
  category,
  subcategory,
  location,
  city,
  province,
  tags,
  images,
  primary_image,
  status,
  created_at,
  updated_at
) VALUES 
-- Sample Ad 1: Office Chair
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Gently Used Office Chair – Ergonomic, Adjustable',
  'Mesh back, lumbar support, height/tilt adjustable. No tears. Pickup only.',
  4500,
  'Used - Good',
  'Furniture',
  'Chairs',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["office", "ergonomic", "mesh"]',
  '["/placeholder.svg?height=400&width=400"]',
  '/placeholder.svg?height=400&width=400',
  'active',
  NOW(),
  NOW()
),
-- Sample Ad 2: iPhone 12
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'iPhone 12, 128GB – Excellent Condition',
  'Battery health 89%, original box, no cracks. Includes charger.',
  29999,
  'Used - Excellent',
  'Electronics',
  'Mobile Phones',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["iphone", "apple", "128gb"]',
  '["/placeholder.svg?height=400&width=400"]',
  '/placeholder.svg?height=400&width=400',
  'active',
  NOW(),
  NOW()
),
-- Sample Ad 3: Mountain Bike
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Mountain Bike – 27.5" Alloy Frame',
  'Shimano 21-speed, recently serviced, light trail use.',
  18000,
  'Used - Good',
  'Sports',
  'Cycling',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["bike", "shimano", "trail"]',
  '["/placeholder.svg?height=400&width=400"]',
  '/placeholder.svg?height=400&width=400',
  'active',
  NOW(),
  NOW()
),
-- Sample Ad 4: 2BHK Apartment
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  '2BHK Apartment for Rent near Metro',
  '900 sq ft, semi-furnished, balcony, covered parking, pets allowed.',
  22000,
  'New',
  'Real Estate',
  'Rentals',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["rent", "metro", "parking"]',
  '["/placeholder.svg?height=400&width=400"]',
  '/placeholder.svg?height=400&width=400',
  'active',
  NOW(),
  NOW()
),
-- Sample Ad 5: Graphic Design Services
(
  gen_random_uuid(),
  'YOUR_USER_ID_HERE', -- Replace with actual user ID
  'Graphic Design Services – Logos & Social Media',
  'Fast turnaround, 3 concepts, 2 revisions included. Portfolio on request.',
  3500,
  'New',
  'Services',
  'Design',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["design", "logo", "branding"]',
  '["/placeholder.svg?height=400&width=400"]',
  '/placeholder.svg?height=400&width=400',
  'active',
  NOW(),
  NOW()
);

-- Note: After testing, you can delete these sample ads with:
-- DELETE FROM products WHERE title IN (
--   'Gently Used Office Chair – Ergonomic, Adjustable',
--   'iPhone 12, 128GB – Excellent Condition',
--   'Mountain Bike – 27.5" Alloy Frame',
--   '2BHK Apartment for Rent near Metro',
--   'Graphic Design Services – Logos & Social Media'
-- );
