-- Insert default categories
INSERT INTO categories (name, slug, icon) VALUES
('Vehicles', 'vehicles', 'Car'),
('Electronics', 'electronics', 'Smartphone'),
('Mobile', 'mobile', 'Phone'),
('Real Estate', 'real-estate', 'Home'),
('Fashion', 'fashion', 'Shirt'),
('Pets', 'pets', 'Heart'),
('Furniture', 'furniture', 'Armchair'),
('Jobs', 'jobs', 'Briefcase'),
('Services', 'services', 'Wrench'),
('Sports', 'sports', 'Dumbbell'),
('Books', 'books', 'Book'),
('Other', 'other', 'MoreHorizontal')
ON CONFLICT (slug) DO NOTHING;
