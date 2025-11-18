-- Insert default categories (synced with lib/categories.ts)
INSERT INTO categories (name, slug, icon) VALUES
('Home Appliances', 'home-appliances', 'Home'),
('Electronics', 'electronics', 'Smartphone'),
('Services', 'services', 'Wrench'),
('Vehicles', 'vehicles', 'Car'),
('Furniture', 'furniture', 'Armchair'),
('Mobile', 'mobile', 'Phone'),
('Real Estate', 'real-estate', 'Home'),
('Fashion & Beauty', 'fashion-beauty', 'Shirt'),
('Pets & Animals', 'pets-animals', 'Heart'),
('Sports', 'sports', 'Dumbbell'),
('Books & Education', 'books-education', 'Book'),
('Free Stuff', 'free-stuff', 'MoreHorizontal')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;
