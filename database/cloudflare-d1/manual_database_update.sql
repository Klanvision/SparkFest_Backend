-- ====================================================================
-- SparkFest / Diwali Dhamaka - Complete Manual Database Migration & Setup
-- All tables are clean, verified, and 100% dynamic (no static mock data)
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP 1: Purge any old static mock data from dynamic tables
-- --------------------------------------------------------------------
DELETE FROM winners;
DELETE FROM tickets;
DELETE FROM participants;
DROP TABLE IF EXISTS spin_records;

-- --------------------------------------------------------------------
-- STEP 2: Create All Required Tables (Schema)
-- --------------------------------------------------------------------

-- 1. Draws Table
CREATE TABLE IF NOT EXISTS draws (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  scheduled_at TEXT NOT NULL,
  display_date TEXT NOT NULL,
  display_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'PAUSED')),
  total_prize_pool TEXT DEFAULT 'Exclusive',
  entry_fee TEXT DEFAULT 'ticket',
  total_participants INTEGER DEFAULT 0,
  total_tickets INTEGER DEFAULT 0,
  rules TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. Prizes Table
CREATE TABLE IF NOT EXISTS prizes (
  id TEXT PRIMARY KEY,
  draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  title TEXT NOT NULL,
  amount TEXT NOT NULL,
  numeric_amount INTEGER NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'trophy',
  theme TEXT DEFAULT 'gold',
  description TEXT,
  winners_count INTEGER DEFAULT 1,
  eligibility TEXT DEFAULT 'All confirmed tickets',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  badge TEXT,
  gradient TEXT,
  icon TEXT,
  cta_text TEXT,
  cta_link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 4. Participants Table (Dynamic: Users saved upon registration)
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  city TEXT DEFAULT 'India',
  verified INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tickets Table (Dynamic: Unique tokens issued per participant)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  plan TEXT DEFAULT '10rs Plan',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'WON', 'EXPIRED', 'CANCELLED')),
  prize TEXT DEFAULT NULL,
  issued_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. Winners Table (Dynamic: Saved only when live draw or spin completes)
CREATE TABLE IF NOT EXISTS winners (
  id TEXT PRIMARY KEY,
  draw_id TEXT NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  ticket_id TEXT REFERENCES tickets(id),
  participant_id TEXT REFERENCES participants(id),
  winner_name TEXT NOT NULL,
  masked_name TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  short_ticket TEXT NOT NULL,
  prize_title TEXT NOT NULL,
  prize_amount TEXT NOT NULL,
  tier TEXT DEFAULT 'gold',
  draw_date TEXT NOT NULL,
  city TEXT DEFAULT 'India',
  plan TEXT,
  spin_number INTEGER,
  is_spin_winner INTEGER DEFAULT 0,
  offer_tag TEXT,
  announced_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. Spin Records Table (Dynamic: Records each Diwali Day spin execution)
CREATE TABLE IF NOT EXISTS spin_records (
  id TEXT PRIMARY KEY,
  plan_type TEXT NOT NULL,
  winner_name TEXT NOT NULL,
  token TEXT NOT NULL,
  short_ticket TEXT,
  prize TEXT NOT NULL,
  prize_title TEXT,
  prize_amount TEXT,
  tier TEXT DEFAULT 'gold',
  city TEXT DEFAULT 'India',
  spin_number INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 8. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 9. Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT DEFAULT 'General Inquiry',
  message TEXT NOT NULL,
  status TEXT DEFAULT 'NEW' CHECK(status IN ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 10. OTP Sessions Table
CREATE TABLE IF NOT EXISTS otp_sessions (
  phone TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 11. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 12. Administrators Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'ADMIN',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- STEP 3: Create High-Performance Database Indexes
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_participant_id ON tickets(participant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_draw_id ON tickets(draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_tier ON winners(tier);
CREATE INDEX IF NOT EXISTS idx_winners_announced_at ON winners(announced_at);

CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

CREATE INDEX IF NOT EXISTS idx_spin_records_plan_type ON spin_records(plan_type);
CREATE INDEX IF NOT EXISTS idx_spin_records_created_at ON spin_records(created_at);

-- --------------------------------------------------------------------
-- STEP 4: Insert Master Configuration & System Data
-- --------------------------------------------------------------------

-- 1. Master Grand Draw Configuration
INSERT OR REPLACE INTO draws (id, name, description, scheduled_at, display_date, display_time, status, total_prize_pool, entry_fee, total_participants, total_tickets, rules) VALUES
('draw-diwali-2026', 'Diwali Dhamaka Grand Lucky Draw 2026', 'Celebrate the Festival of Lights with our exclusive corporate lucky draw. Grand rewards, total transparency, and verified random draws.', '2026-11-10T13:30:00.000Z', '10 Nov 2026', '07:00 PM (IST)', 'SCHEDULED', 'Exclusive', 'ticket', 0, 0, '["Participation is open to verified participants aged 18 and above.","Unique cryptographic ticket numbers are issued immediately upon confirmed registration.","Winners are selected through an automated, provably fair pseudorandom draw mechanism.","Prize disbursement requires official government ID verification within 30 days."]');

-- 2. Official Prize Pool
INSERT OR REPLACE INTO prizes (id, draw_id, tier, title, amount, numeric_amount, icon, theme, description, winners_count, eligibility) VALUES
('prize-1', 'draw-diwali-2026', '1st Prize', '1st Prize', '₹10,000', 10000, 'trophy', 'gold', 'Mega Bumper Cracker Stash: Premium multi-shot aerial cakes, sky lanterns, and exclusive display fireworks.', 1, 'All confirmed tickets'),
('prize-2', 'draw-diwali-2026', '2nd Prize', '2nd Prize', '₹9,500', 9500, 'award', 'silver', 'Elite Celebration Box: Aerial shells, dazzling sparklers, and spectacular festive crackers.', 1, 'All confirmed tickets'),
('prize-3', 'draw-diwali-2026', '3rd Prize', '3rd Prize', '₹9,000', 9000, 'medal', 'bronze', 'Royal Diwali Hamper: Beautiful ground spinners, colorful fountains, and family crackers.', 1, 'All confirmed tickets'),
('prize-4', 'draw-diwali-2026', '4th Prize', '4th Prize', '₹8,500', 8500, 'star', 'purple', 'Luxury Sparkler Kit: Exclusive premium sparklers and safe color fountains.', 1, 'All confirmed tickets'),
('prize-5', 'draw-diwali-2026', '5th Prize', '5th Prize', '₹8,000', 8000, 'gift', 'blue', 'Festive Joy Bundle: Delightful flower pots, charkhis, and color rockets.', 1, 'All confirmed tickets'),
('prize-6', 'draw-diwali-2026', '6th Prize', '6th Prize', '₹7,500', 7500, 'crown', 'emerald', 'Premium Aerial Assortment: High-quality fireworks securely packed.', 1, 'All confirmed tickets'),
('prize-7', 'draw-diwali-2026', '7th Prize', '7th Prize', '₹7,000', 7000, 'sparkles', 'ruby', 'Classic Cracker Combo: Beautifully crafted traditional Diwali crackers.', 1, 'All confirmed tickets'),
('prize-8', 'draw-diwali-2026', '8th Prize', '8th Prize', '₹6,500', 6500, 'diamond', 'sapphire', 'Family Fiesta Pack: Safe, brilliant light displays for family celebrations.', 1, 'All confirmed tickets'),
('prize-9', 'draw-diwali-2026', '9th Prize', '9th Prize', '₹6,000', 6000, 'heart', 'rose', 'Starlight Collection: Premium sparklers, pencil crackers, and glowing wires.', 1, 'All confirmed tickets'),
('prize-10', 'draw-diwali-2026', '10th Prize', '10th Prize', '₹5,500', 5500, 'shield', 'amber', 'Spark & Glow Hamper: Miniature fountains and vibrant ground fireworks.', 1, 'All confirmed tickets');

-- 3. Festival Plan Offers
INSERT OR REPLACE INTO offers (id, title, subtitle, description, badge, gradient, icon, cta_text, cta_link, sort_order) VALUES
('offer-1', 'ticket Entry', 'Special Entry Pass', 'Just ticket for a chance to win amazing prizes and participate in the grand festival draw!', 'Popular', 'from-purple-900 via-indigo-900 to-purple-800', 'sparkles', 'JOIN NOW >', '/participate?offer=ten_entry', 1),
('offer-2', 'Festival Special', 'Double Celebration Bonus', 'Get bonus entry ticket with every additional participation. Maximize your winning probability!', 'Festive High Value', 'from-red-950 via-rose-900 to-maroon-800', 'gift', 'PARTICIPATE NOW >', '/participate?offer=festival_special', 2),
('offer-3', 'Early Bird Bonus', 'Priority Tier Reward', 'Register early and get extra lucky tickets automatically allotted to your festive profile!', 'Limited Slots', 'from-emerald-950 via-teal-900 to-cyan-900', 'star', 'REGISTER NOW >', '/participate?offer=early_bird', 3);

-- 4. FAQs
INSERT OR REPLACE INTO faqs (id, category, question, answer, sort_order) VALUES
('faq-1', 'General', 'What is Diwali Dhamaka Lucky Draw?', 'Diwali Dhamaka is a festival rewards and lucky draw initiative designed to celebrate the Festival of Lights with exciting Gift prizes, gifts, and transparent verified digital participation.', 1),
('faq-2', 'Participation', 'How can I participate in the lucky draw?', 'Simply click "Enter Now", provide your mobile number, verify your OTP, complete your details, and an official unique ticket (e.g. DD-2026-XXXXX) will be generated instantly for you.', 2),
('faq-3', 'Participation', 'Can I participate multiple times?', 'Yes! With our Festival Special offer, additional participations earn you bonus lucky tickets, each entered into the draw pool with equal chance.', 3),
('faq-4', 'Tickets', 'How will I receive my lucky ticket?', 'Immediately upon confirmation, your digital lucky ticket will be shown on the screen with a downloadable voucher and sent via SMS/Email to your registered contact.', 4),
('faq-5', 'Draw', 'When and how will the draw be conducted?', 'The Grand Draw is scheduled for 10 November 2026 at 07:00 PM (IST). It is conducted live using our transparent, certified pseudorandom selection engine.', 5),
('faq-6', 'Prizes', 'How will winners be notified and claims processed?', 'Winners will be displayed live on the Winners and Live Draw pages, and notified directly via phone and email with straightforward claiming steps.', 6),
('faq-7', 'Security', 'Is this lucky draw secure and legitimate?', 'Yes, Diwali Dhamaka operates under strict compliance with transparent lucky draw governance standards, SSL encryption, and non-tamperable audit logs.', 7);

-- 5. Default Administrator Credentials (Password: Admin@Diwali2026)
INSERT OR REPLACE INTO admins (id, email, password_hash, role, created_at) VALUES
('admin-1', 'admin@diwalidhamaka.com', '$2a$10$w8uR3Ue0jK8wKx9l9jG.QOB5rK9mG3q9sYfG5pP2mD9kH7wQ8x6Y2', 'ADMIN', '2026-09-01T00:00:00.000Z');

-- --------------------------------------------------------------------
-- STEP 5: Verification Query (All dynamic tables should return 0 rows)
-- --------------------------------------------------------------------
SELECT 'participants' AS table_name, COUNT(*) AS row_count FROM participants
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'winners', COUNT(*) FROM winners
UNION ALL
SELECT 'spin_records', COUNT(*) FROM spin_records;
