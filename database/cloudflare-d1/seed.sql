-- ====================================================================
-- SparkFest / Diwali Dhamaka - Cloudflare D1 Initial Seed Data
-- ====================================================================

-- 1. Insert Admin Credentials (Configured permanently)
DELETE FROM admins;
INSERT INTO admins (email, password_hash, two_factor_setup_complete, failed_attempts) 
VALUES ('kirankumarmoopuri@gmail.com', 'klan@lucky', 0, 0);

-- 2. Insert Initial Draw
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

-- 4. Insert Verified Seed Winners
INSERT OR REPLACE INTO winners (id, draw_id, winner_name, masked_name, ticket_number, short_ticket, prize_title, prize_amount, tier, draw_date, city, announced_at) VALUES
('win-1', 'draw-diwali-2026', 'Ramesh Sharma', 'R*** S***', 'DD-2026-45872', '#45872', '1st Prize', '₹10,000', 'gold', 'Diwali Mega Gala', 'Mumbai', '2026-09-15T18:30:00.000Z'),
('win-2', 'draw-diwali-2026', 'Priya Kulkarni', 'P*** K***', 'DD-2026-37261', '#37261', '2nd Prize', '₹9,500', 'gold', 'Festival Kickoff', 'Pune', '2026-09-12T18:30:00.000Z'),
('win-3', 'draw-diwali-2026', 'Suresh Menon', 'S*** M***', 'DD-2026-42903', '#42903', '3rd Prize', '₹9,000', 'gold', 'Auspicious Round', 'Bengaluru', '2026-09-08T18:30:00.000Z'),
('win-4', 'draw-diwali-2026', 'Ananya Roy', 'A*** R***', 'DD-2026-18459', '#18459', '4th Prize', '₹8,500', 'gold', 'Grand Bumper Draw', 'Kolkata', '2026-09-05T18:30:00.000Z'),
('win-5', 'draw-diwali-2026', 'Kiran Nair', 'K*** N***', 'DD-2026-51024', '#51024', '5th Prize', '₹8,000', 'gold', 'Weekly Spark', 'Delhi', '2026-09-01T18:30:00.000Z'),
('win-6', 'draw-diwali-2026', 'Meena Iyer', 'M*** I***', 'DD-2026-63291', '#63291', '6th Prize', '₹7,500', 'silver', 'Festive Special', 'Chennai', '2026-08-28T18:30:00.000Z'),
('win-7', 'draw-diwali-2026', 'Rajesh Patel', 'R*** P***', 'DD-2026-74812', '#74812', '7th Prize', '₹7,000', 'silver', 'Diwali Round 2', 'Ahmedabad', '2026-08-25T18:30:00.000Z'),
('win-8', 'draw-diwali-2026', 'Sunita Joshi', 'S*** J***', 'DD-2026-82047', '#82047', '8th Prize', '₹6,500', 'silver', 'Bumper Draw', 'Hyderabad', '2026-08-22T18:30:00.000Z'),
('win-9', 'draw-diwali-2026', 'Arjun Verma', 'A*** V***', 'DD-2026-91365', '#91365', '9th Prize', '₹6,000', 'silver', 'Grand Finale', 'Jaipur', '2026-08-18T18:30:00.000Z'),
('win-10', 'draw-diwali-2026', 'Kavita Singh', 'K*** S***', 'DD-2026-10583', '#10583', '10th Prize', '₹5,500', 'silver', 'Lucky Dip', 'Lucknow', '2026-08-15T18:30:00.000Z'),
('win-11', 'draw-diwali-2026', 'Vikram Reddy', 'V*** R***', 'DD-2026-29147', '#29147', 'Festival Special', '₹10,000', 'bronze', 'Festival Special Draw', 'Visakhapatnam', '2026-08-12T18:30:00.000Z'),
('win-12', 'draw-diwali-2026', 'Deepa Krishnan', 'D*** K***', 'DD-2026-36820', '#36820', 'Festival Special', '₹10,000', 'bronze', 'Festival Special Draw', 'Kochi', '2026-08-10T18:30:00.000Z'),
('win-13', 'draw-diwali-2026', 'Mohan Das', 'M*** D***', 'DD-2026-47593', '#47593', 'Early Bird Bonus', '₹10,000', 'purple', 'Early Bird Special', 'Bhopal', '2026-08-08T18:30:00.000Z'),
('win-14', 'draw-diwali-2026', 'Neha Gupta', 'N*** G***', 'DD-2026-58406', '#58406', 'Early Bird Bonus', '₹10,000', 'purple', 'Early Bird Special', 'Chandigarh', '2026-08-06T18:30:00.000Z');

-- 5. Insert FAQs
INSERT OR REPLACE INTO faqs (id, category, question, answer, sort_order) VALUES
('faq-1', 'General', 'What is Diwali Dhamaka Lucky Draw?', 'Diwali Dhamaka is a festival rewards and lucky draw initiative designed to celebrate the Festival of Lights with exciting Gift prizes, gifts, and transparent verified digital participation.', 1),
('faq-2', 'Participation', 'How can I participate in the lucky draw?', 'Simply click "Enter Now", provide your mobile number, verify your OTP, complete your details, and an official unique ticket (e.g. DD-2026-XXXXX) will be generated instantly for you.', 2),
('faq-3', 'Participation', 'Can I participate multiple times?', 'Yes! With our Festival Special offer, additional participations earn you bonus lucky tickets, each entered into the draw pool with equal chance.', 3),
('faq-4', 'Tickets', 'How will I receive my lucky ticket?', 'Immediately upon confirmation, your digital lucky ticket will be shown on the screen with a downloadable voucher and sent via SMS/Email to your registered contact.', 4),
('faq-5', 'Draw', 'When and how will the draw be conducted?', 'The Grand Draw is scheduled for 10 November 2026 at 07:00 PM (IST). It is conducted live using our transparent, certified pseudorandom selection engine.', 5),
('faq-6', 'Prizes', 'How will winners be notified and claims processed?', 'Winners will be displayed live on the Winners and Live Draw pages, and notified directly via phone and email with straightforward claiming steps.', 6),
('faq-7', 'Security', 'Is this lucky draw secure and legitimate?', 'Yes, Diwali Dhamaka operates under strict compliance with transparent lucky draw governance standards, SSL encryption, and non-tamperable audit logs.', 7);

-- 6. Insert Verified Participants
INSERT OR REPLACE INTO participants (id, full_name, email, phone, city, verified, created_at) VALUES
('part-1', 'Ramesh Sharma', 'ramesh.sharma@gmail.com', '9876543210', 'Mumbai, Maharashtra', 1, '2026-09-10T10:05:00.000Z'),
('part-2', 'Priya Kulkarni', 'priya.kulkarni@gmail.com', '9822012345', 'Pune, Maharashtra', 1, '2026-09-12T11:20:00.000Z'),
('part-3', 'Suresh Menon', 'suresh.menon@gmail.com', '9845098765', 'Bengaluru, Karnataka', 1, '2026-09-14T14:35:00.000Z'),
('part-4', 'Ananya Roy', 'ananya.roy@gmail.com', '9830123456', 'Kolkata, West Bengal', 1, '2026-09-16T09:50:00.000Z'),
('part-5', 'Kiran Nair', 'kiran.nair@gmail.com', '9811234567', 'New Delhi, Delhi', 1, '2026-09-18T16:25:00.000Z'),
('part-6', 'Rajesh Patel', 'rajesh.patel@gmail.com', '9825123456', 'Ahmedabad, Gujarat', 1, '2026-09-20T12:05:00.000Z'),
('part-7', 'Sunita Joshi', 'sunita.joshi@gmail.com', '9849012345', 'Hyderabad, Telangana', 1, '2026-09-22T15:15:00.000Z'),
('part-8', 'Arjun Verma', 'arjun.verma@gmail.com', '9829012345', 'Jaipur, Rajasthan', 1, '2026-09-24T18:45:00.000Z'),
('part-9', 'Kavita Singh', 'kavita.singh@gmail.com', '9839012345', 'Lucknow, Uttar Pradesh', 1, '2026-09-25T10:10:00.000Z'),
('part-10', 'Vikram Malhotra', 'vikram.malhotra@gmail.com', '9819012345', 'Chennai, Tamil Nadu', 1, '2026-09-26T11:45:00.000Z'),
('part-11', 'Neha Sharma', 'neha.sharma@gmail.com', '9871012345', 'Chandigarh, Punjab', 1, '2026-09-27T13:15:00.000Z'),
('part-12', 'Deepak Gupta', 'deepak.gupta@gmail.com', '9899012345', 'Surat, Gujarat', 1, '2026-09-28T17:30:00.000Z'),
('part-13', 'Manish Tiwari', 'manish.tiwari@gmail.com', '9876012345', 'Jaipur, Rajasthan', 1, '2026-09-29T14:15:00.000Z'),
('part-14', 'Pooja Deshmukh', 'pooja.deshmukh@gmail.com', '9823012345', 'Nagpur, Maharashtra', 1, '2026-09-29T15:40:00.000Z');

-- 7. Insert Verified Tickets (10rs, 30rs, 50rs plans strictly)
INSERT OR REPLACE INTO tickets (id, ticket_number, participant_id, draw_id, plan, status, prize, issued_at) VALUES
('tick-1', 'DD-2026-45872', 'part-1', 'draw-diwali-2026', '30rs Plan', 'WON', '1st Prize - Smart LED TV (55-inch)', '2026-09-10T10:05:00.000Z'),
('tick-2', 'DD-2026-37261', 'part-2', 'draw-diwali-2026', '10rs Plan', 'WON', '2nd Prize - Latest 5G Smartphone', '2026-09-12T11:20:00.000Z'),
('tick-3', 'DD-2026-42903', 'part-3', 'draw-diwali-2026', '50rs Plan', 'ACTIVE', NULL, '2026-09-14T14:35:00.000Z'),
('tick-4', 'DD-2026-18459', 'part-4', 'draw-diwali-2026', '30rs Plan', 'ACTIVE', NULL, '2026-09-16T09:50:00.000Z'),
('tick-5', 'DD-2026-51024', 'part-5', 'draw-diwali-2026', '10rs Plan', 'ACTIVE', NULL, '2026-09-18T16:25:00.000Z'),
('tick-6', 'DD-2026-74812', 'part-6', 'draw-diwali-2026', '50rs Plan', 'ACTIVE', NULL, '2026-09-20T12:05:00.000Z'),
('tick-7', 'DD-2026-82047', 'part-7', 'draw-diwali-2026', '30rs Plan', 'ACTIVE', NULL, '2026-09-22T15:15:00.000Z'),
('tick-8', 'DD-2026-91365', 'part-8', 'draw-diwali-2026', '10rs Plan', 'ACTIVE', NULL, '2026-09-24T18:45:00.000Z'),
('tick-9', 'DD-2026-10583', 'part-9', 'draw-diwali-2026', '30rs Plan', 'ACTIVE', NULL, '2026-09-25T10:10:00.000Z'),
('tick-10', 'DD-2026-61928', 'part-10', 'draw-diwali-2026', '50rs Plan', 'ACTIVE', NULL, '2026-09-26T11:45:00.000Z'),
('tick-11', 'DD-2026-38291', 'part-11', 'draw-diwali-2026', '10rs Plan', 'ACTIVE', NULL, '2026-09-27T13:15:00.000Z'),
('tick-12', 'DD-2026-72819', 'part-12', 'draw-diwali-2026', '30rs Plan', 'ACTIVE', NULL, '2026-09-28T17:30:00.000Z'),
('tick-13', 'DD-2026-88392', 'part-13', 'draw-diwali-2026', '50rs Plan', 'ACTIVE', NULL, '2026-09-29T14:15:00.000Z'),
('tick-14', 'DD-2026-99481', 'part-14', 'draw-diwali-2026', '50rs Plan', 'ACTIVE', NULL, '2026-09-29T15:40:00.000Z');

