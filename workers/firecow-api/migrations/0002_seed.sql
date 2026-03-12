-- FireCow D1 Seed Data
-- Migration 0002: Seed from sites-content.csv

-- Supplier (all current sites share one operator)
INSERT INTO suppliers (id, name, contact_email, contact_whatsapp, location)
VALUES ('sup-001', 'Costa Cat Cruises', 'info@costacat.com', '+506-8450-9498', 'Jacó, Costa Rica');

-- Tours (one per site for now)
INSERT INTO tours (id, supplier_id, name, slug, type, description, duration, base_price, hero_image_url, gallery_images, is_active)
VALUES
  ('tour-001', 'sup-001', 'Isla Tortuga Costa Rica', 'isla-tortuga-costa-rica', 'catamaran',
   'Snorkel in crystal-clear waters | Relax on pristine white sand beach | Enjoy a delicious lunch buffet | Kayaking and stand-up paddleboarding',
   'Full day (approx 12 hours)', 12000,
   'https://lh3.googleusercontent.com/p/AF1QipNQAPWSwElfntfAu0_VPsUcA4LxauIUnwdqOqaF=s1360-w1360-h1020-rw',
   '["https://costacat.b-cdn.net/wp-content/uploads/2025/04/DSC5373-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/06/Wahoo-1024x682.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC3532-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC6659-1024x683.jpg"]',
   1),

  ('tour-002', 'sup-001', 'Catamaran Tour Isla Tortuga', 'catamaran-tour-isla-tortuga', 'catamaran',
   'Sail on a luxurious catamaran through the Gulf of Nicoya | Swim and snorkel in tropical waters | Enjoy unlimited tropical drinks and fresh fruit onboard | Feast on a gourmet beachside lunch',
   'Full day', 9500,
   'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a',
   '["https://images.unsplash.com/photo-1567899378494-47b22a2ae96a","https://images.unsplash.com/photo-1544551763-46a013bb70d5","https://images.unsplash.com/photo-1540202404-a2f29016b523","https://images.unsplash.com/photo-1473496169904-658ba7c44d8a"]',
   1),

  ('tour-003', 'sup-001', 'Private Charter Isla Tortuga', 'private-charter-isla-tortuga', 'catamaran',
   'Exclusive private catamaran experience for your group only | Customizable itinerary | Premium open bar | Personalized gourmet meal by private chef',
   'Full day (flexible)', 45000,
   'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
   '["https://images.unsplash.com/photo-1544551763-46a013bb70d5","https://images.unsplash.com/photo-1567899378494-47b22a2ae96a","https://images.unsplash.com/photo-1520443240718-fce21cc0cb0b","https://images.unsplash.com/photo-1473496169904-658ba7c44d8a"]',
   1),

  ('tour-004', 'sup-001', 'Sport Fishing Jaco Costa Rica', 'fishing-jaco-costa-rica', 'fishing',
   'Deep sea fishing for marlin, sailfish, and dorado | Professional captain and first mate | Top-quality gear provided | Catch cleaning included',
   '9 hours (5:30 AM - 3:00 PM)', 35000,
   'https://images.unsplash.com/photo-1544943910-4c1dc44aab44',
   '["https://images.unsplash.com/photo-1544943910-4c1dc44aab44","https://images.unsplash.com/photo-1559675553-f369aea7e83b","https://images.unsplash.com/photo-1535591273668-578e31182c4f","https://images.unsplash.com/photo-1534043464124-3be32fe000c9"]',
   1),

  ('tour-005', 'sup-001', 'Catamaran Sunset Cruise', 'catamaran-sunset', 'catamaran',
   'Romantic sunset sailing along Costa Rica''s coast | Unlimited premium cocktails and wine | Live music on select nights | Watch dolphins and sea turtles',
   '4.5 hours (4:00 PM - 8:30 PM)', 8500,
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
   '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4","https://images.unsplash.com/photo-1495954484750-af469f2f9be5","https://images.unsplash.com/photo-1518709268805-4e9042af9f23","https://images.unsplash.com/photo-1473496169904-658ba7c44d8a"]',
   1),

  ('tour-006', 'sup-001', 'Isla Tortuga 2 Costa Rica', 'isla-tortuga-2-costa-rica', 'catamaran',
   'Snorkel in crystal-clear waters | Relax on pristine white sand beach | Enjoy a delicious lunch buffet | Kayaking and stand-up paddleboarding',
   'Full day (approx 12 hours)', 12000,
   'https://lh3.googleusercontent.com/p/AF1QipNQAPWSwElfntfAu0_VPsUcA4LxauIUnwdqOqaF=s1360-w1360-h1020-rw',
   '["https://costacat.b-cdn.net/wp-content/uploads/2025/04/DSC5373-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/06/Wahoo-1024x682.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC3532-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC6659-1024x683.jpg"]',
   1),

  ('tour-007', 'sup-001', 'Isla Tortuga 3 Costa Rica', 'isla-tortuga-3-costa-rica', 'catamaran',
   'Snorkel in crystal-clear waters | Relax on pristine white sand beach | Enjoy a delicious lunch buffet | Kayaking and stand-up paddleboarding',
   'Full day (approx 12 hours)', 12000,
   'https://lh3.googleusercontent.com/p/AF1QipNQAPWSwElfntfAu0_VPsUcA4LxauIUnwdqOqaF=s1360-w1360-h1020-rw',
   '["https://costacat.b-cdn.net/wp-content/uploads/2025/04/DSC5373-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/06/Wahoo-1024x682.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC3532-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC6659-1024x683.jpg"]',
   1),

  ('tour-008', 'sup-001', 'Isla Tortuga 4 Costa Rica', 'isla-tortuga-4-costa-rica', 'catamaran',
   'Snorkel in crystal-clear waters | Relax on pristine white sand beach | Enjoy a delicious lunch buffet | Kayaking and stand-up paddleboarding',
   'Full day (approx 12 hours)', 12000,
   'https://lh3.googleusercontent.com/p/AF1QipNQAPWSwElfntfAu0_VPsUcA4LxauIUnwdqOqaF=s1360-w1360-h1020-rw',
   '["https://costacat.b-cdn.net/wp-content/uploads/2025/04/DSC5373-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/06/Wahoo-1024x682.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC3532-1024x683.jpg","https://costacat.b-cdn.net/wp-content/uploads/2025/10/DSC6659-1024x683.jpg"]',
   1);

-- Sites
INSERT INTO sites (id, slug, cf_project_name, supplier_id, tour_ids, tagline, whatsapp_number, is_live, meta_title, meta_description)
VALUES
  ('site-001', 'isla-tortuga-costa-rica', 'isla-tortuga-costa-rica', 'sup-001', '["tour-001"]',
   'The Ultimate Isla Tortuga Experience', '+506-8450-9498', 1,
   'Isla Tortuga Costa Rica | Best Day Tour From Jacó',
   'Book the best Isla Tortuga day tour from Jacó, Costa Rica. Snorkeling, beach, and lunch included.'),

  ('site-002', 'catamaran-tour-isla-tortuga', 'catamaran-tour-isla-tortuga', 'sup-001', '["tour-002"]',
   'Sail to Paradise on a Luxury Catamaran', '+506-8450-9498', 1,
   'Catamaran Tour Isla Tortuga | Luxury Sailing Costa Rica',
   'Luxury catamaran tour to Isla Tortuga. Unlimited drinks, snorkeling, beach time and gourmet lunch included.'),

  ('site-003', 'private-charter-isla-tortuga', 'private-charter-isla-tortuga', 'sup-001', '["tour-003"]',
   'Your Private Slice of Paradise', '+506-8450-9498', 1,
   'Private Charter Isla Tortuga | Exclusive Catamaran Costa Rica',
   'Exclusive private catamaran charter to Isla Tortuga. Fully customizable, premium service for groups.'),

  ('site-004', 'fishing-jaco-costa-rica', 'fishing-jaco-costa-rica', 'sup-001', '["tour-004"]',
   'World-Class Sport Fishing in Costa Rica', '+506-8450-9498', 1,
   'Sport Fishing Jacó Costa Rica | Deep Sea Fishing Charter',
   'Deep sea fishing for marlin, sailfish and dorado out of Jacó, Costa Rica. Professional crew and equipment.'),

  ('site-005', 'catamaran-sunset', 'catamaran-sunset', 'sup-001', '["tour-005"]',
   'Romance on the Pacific at Sunset', '+506-8450-9498', 1,
   'Sunset Catamaran Cruise Costa Rica | Romantic Sailing',
   'A romantic sunset catamaran cruise along Costa Rica''s Pacific coast. Unlimited cocktails, dolphins, and stunning views.'),

  ('site-006', 'isla-tortuga-2-costa-rica', 'isla-tortuga-2-costa-rica', 'sup-001', '["tour-006"]',
   'The Ultimate Isla Tortuga Experience', '+506-8450-9498', 1,
   'Isla Tortuga Costa Rica | Best Day Tour From Jacó',
   'Book the best Isla Tortuga day tour from Jacó, Costa Rica. Snorkeling, beach, and lunch included.'),

  ('site-007', 'isla-tortuga-3-costa-rica', 'isla-tortuga-3-costa-rica', 'sup-001', '["tour-007"]',
   'The Ultimate Isla Tortuga Experience', '+506-8450-9498', 1,
   'Isla Tortuga Costa Rica | Best Day Tour From Jacó',
   'Book the best Isla Tortuga day tour from Jacó, Costa Rica. Snorkeling, beach, and lunch included.'),

  ('site-008', 'isla-tortuga-4-costa-rica', 'isla-tortuga-4-costa-rica', 'sup-001', '["tour-008"]',
   'The Ultimate Isla Tortuga Experience', '+506-8450-9498', 1,
   'Isla Tortuga Costa Rica | Best Day Tour From Jacó',
   'Book the best Isla Tortuga day tour from Jacó, Costa Rica. Snorkeling, beach, and lunch included.');
