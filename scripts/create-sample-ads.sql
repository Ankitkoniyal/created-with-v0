-- Updated sample ads with proper pricing format and realistic data
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
  'Mesh back office chair with excellent lumbar support. Height and tilt adjustable with smooth rolling wheels. No tears or stains, very comfortable for long work sessions. Perfect for home office or workspace. Pickup only from downtown Toronto.',
  45.00,
  'good',
  'Furniture',
  'Chairs',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["office", "ergonomic", "mesh", "adjustable"]',
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
  'iPhone 12 in excellent condition with 128GB storage. Battery health at 89%, comes with original box and all accessories. No cracks or scratches on screen or body. Includes original charger and unused earbuds. Unlocked to all carriers.',
  299.99,
  'like_new',
  'Electronics',
  'Mobile Phones',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["iphone", "apple", "128gb", "unlocked"]',
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
  'High-quality mountain bike with 27.5" alloy frame, perfect for trail riding. Features Shimano 21-speed gear system, recently serviced with new brake pads. Light trail use only, well-maintained. Great for weekend adventures and fitness.',
  180.00,
  'good',
  'Sports',
  'Cycling',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["bike", "shimano", "trail", "mountain"]',
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
  'Spacious 2-bedroom apartment, 900 sq ft, semi-furnished with modern amenities. Features include balcony with city view, covered parking space, and pet-friendly policy. Located just 5 minutes walk from metro station. Available immediately.',
  2200.00,
  'new',
  'Real Estate',
  'Rentals',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["rent", "metro", "parking", "pets"]',
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
  'Professional graphic design services for small businesses and startups. Specializing in logo design, social media graphics, and brand identity. Fast 48-hour turnaround, 3 initial concepts provided, 2 rounds of revisions included. Portfolio available upon request.',
  35.00,
  'new',
  'Services',
  'Design',
  'Toronto, ON',
  'Toronto',
  'Ontario',
  '["design", "logo", "branding", "social"]',
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
