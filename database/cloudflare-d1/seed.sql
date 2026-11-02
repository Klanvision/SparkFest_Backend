-- ====================================================================
-- SparkFest / Diwali Dhamaka - Cloudflare D1 Initial Seed Data
-- ====================================================================

-- 1. Insert Initial Draw
INSERT OR REPLACE INTO draws (
  id, name, description, scheduled_at, display_date, display_time, status, total_prize_pool, entry_fee, total_participants, total_tickets, rules
) VALUES (
  'draw-diwali-2026',
  'Diwali Dhamaka Grand Lucky Draw 2026',
  'Celebrate the Festival of Lights with our exclusive corporate lucky draw. Grand rewards, total transparency, and verified random draws.',
  '2026-11-10T13:30:00.000Z',
  '10 Nov 2026',
  '07:00 PM (IST)',
  'SCHEDULED',
  'Exclusive',
  'ticket',
  4280,
  6850,
  '["Participation is open to verified participants aged 18 and above.","Unique cryptographic ticket numbers are issued immediately upon confirmed registration.","Winners are selected through an automated, provably fair pseudorandom draw mechanism.","Prize disbursement requires official government ID verification within 30 days."]'
);

-- 2. Insert Prizes
INSERT OR REPLACE INTO prizes (id, draw_id, tier, title, amount, numeric_amount, icon, theme, description, winners_count, eligibility) VALUES
('prize-1', 'draw-diwali-2026', '1st Prize', '1st Prize', '₹10,000', 10000, 'trophy', 'gold', 'Mega Bumper Cracker Stash: An ultimate collection of premium multi-shot aerial cakes, sky lanterns, and exclusive display fireworks delivered safely to your door.', 1, 'All confirmed tickets'),
('prize-2', 'draw-diwali-2026', '2nd Prize', '2nd Prize', '₹9,500', 9500, 'award', 'silver', 'Elite Celebration Box: Packed with high-end aerial shells, dazzling sparklers, and spectacular festive crackers for an unforgettable night.', 1, 'All confirmed tickets'),
('prize-3', 'draw-diwali-2026', '3rd Prize', '3rd Prize', '₹9,000', 9000, 'medal', 'bronze', 'Royal Diwali Hamper: A majestic assortment of beautiful ground spinners, colorful fountains, and premium family-friendly crackers.', 1, 'All confirmed tickets'),
('prize-4', 'draw-diwali-2026', '4th Prize', '4th Prize', '₹8,500', 8500, 'star', 'purple', 'Luxury Sparkler Kit: Exclusive premium sparklers and safe, low-smoke color fountains perfect for celebrating with family.', 1, 'All confirmed tickets'),
('prize-5', 'draw-diwali-2026', '5th Prize', '5th Prize', '₹8,000', 8000, 'gift', 'blue', 'Festive Joy Bundle: A delightful mix of classic flower pots, charkhis, and assorted color rockets.', 1, 'All confirmed tickets'),
('prize-6', 'draw-diwali-2026', '6th Prize', '6th Prize', '₹7,500', 7500, 'crown', 'emerald', 'Premium Aerial Assortment: High-quality aerial fireworks and sky shots securely packed for your celebration.', 1, 'All confirmed tickets'),
('prize-7', 'draw-diwali-2026', '7th Prize', '7th Prize', '₹7,000', 7000, 'sparkles', 'ruby', 'Classic Cracker Combo: A beautifully crafted box of traditional Diwali crackers and color matches.', 1, 'All confirmed tickets'),
('prize-8', 'draw-diwali-2026', '8th Prize', '8th Prize', '₹6,500', 6500, 'diamond', 'sapphire', 'Family Fiesta Pack: Safe, brilliant, and noise-free light displays designed for joyous family gatherings.', 1, 'All confirmed tickets'),
('prize-9', 'draw-diwali-2026', '9th Prize', '9th Prize', '₹6,000', 6000, 'heart', 'rose', 'Starlight Collection: Premium quality sparklers, pencil crackers, and magical glowing wires.', 1, 'All confirmed tickets'),
('prize-10', 'draw-diwali-2026', '10th Prize', '10th Prize', '₹5,500', 5500, 'shield', 'amber', 'Spark & Glow Hamper: A charming set of miniature fountains and vibrant ground fireworks to light up your evening.', 1, 'All confirmed tickets');

-- 3. Insert Offers
INSERT OR REPLACE INTO offers (id, title, subtitle, description, badge, gradient, icon, cta_text, cta_link, sort_order) VALUES
('offer-1', 'ticket Entry', 'Special Entry Pass', 'Just ticket for a chance to win amazing prizes and participate in the grand festival draw!', 'Popular', 'from-purple-900 via-indigo-900 to-purple-800', 'sparkles', 'JOIN NOW >', '/participate?offer=ten_entry', 1),
('offer-2', 'Festival Special', 'Double Celebration Bonus', 'Get bonus entry ticket with every additional participation. Maximize your winning probability!', 'Festive High Value', 'from-red-950 via-rose-900 to-maroon-800', 'gift', 'PARTICIPATE NOW >', '/participate?offer=festival_special', 2),
('offer-3', 'Early Bird Bonus', 'Priority Tier Reward', 'Register early and get extra lucky tickets automatically allotted to your festive profile!', 'Limited Slots', 'from-emerald-950 via-teal-900 to-cyan-900', 'star', 'REGISTER NOW >', '/participate?offer=early_bird', 3);

-- 4. Verified Winners table initialized dynamically (no static rows)

-- 5. Insert FAQs
INSERT OR REPLACE INTO faqs (id, category, question, answer, sort_order) VALUES
('faq-1', 'General', 'What is Diwali Dhamaka Lucky Draw?', 'Diwali Dhamaka is a festival rewards and lucky draw initiative designed to celebrate the Festival of Lights with exciting Gift prizes, gifts, and transparent verified digital participation.', 1),
('faq-2', 'Participation', 'How can I participate in the lucky draw?', 'Simply click "Enter Now", provide your mobile number, verify your OTP, complete your details, and an official unique ticket (e.g. DD-2026-XXXXX) will be generated instantly for you.', 2),
('faq-3', 'Participation', 'Can I participate multiple times?', 'Yes! With our Festival Special offer, additional participations earn you bonus lucky tickets, each entered into the draw pool with equal chance.', 3),
('faq-4', 'Tickets', 'How will I receive my lucky ticket?', 'Immediately upon confirmation, your digital lucky ticket will be shown on the screen with a downloadable voucher and sent via SMS/Email to your registered contact.', 4),
('faq-5', 'Draw', 'When and how will the draw be conducted?', 'The Grand Draw is scheduled for 10 November 2026 at 07:00 PM (IST). It is conducted live using our transparent, certified pseudorandom selection engine.', 5),
('faq-6', 'Prizes', 'How will winners be notified and claims processed?', 'Winners will be displayed live on the Winners and Live Draw pages, and notified directly via phone and email with straightforward claiming steps.', 6),
('faq-7', 'Security', 'Is this lucky draw secure and legitimate?', 'Yes, Diwali Dhamaka operates under strict compliance with transparent lucky draw governance standards, SSL encryption, and non-tamperable audit logs.', 7);

-- 6. Verified Participants table initialized dynamically (no static rows)

-- 7. Verified Tickets table initialized dynamically (no static rows)

-- 8. Insert Default Administrator
INSERT OR REPLACE INTO admins (id, email, password_hash, role, created_at) VALUES
('admin-1', 'admin@diwalidhamaka.com', '$2a$10$w8uR3Ue0jK8wKx9l9jG.QOB5rK9mG3q9sYfG5pP2mD9kH7wQ8x6Y2', 'ADMIN', '2026-09-01T00:00:00.000Z');
