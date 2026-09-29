-- ====================================================================
-- SparkFest / Diwali Dhamaka - Cloudflare D1 Database Schema
-- Compatible with Cloudflare D1 (SQLite engine at the edge)
-- ====================================================================

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
  rules TEXT, -- JSON array string
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

-- 4. Participants Table
CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  city TEXT DEFAULT 'India',
  verified INTEGER DEFAULT 1, -- 1 = verified, 0 = unverified
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tickets Table
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

-- 6. Winners Table
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
  offer_tag TEXT,
  announced_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. FAQs Table
CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 8. Contact Inquiries Table
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

-- 9. OTP Sessions Table
CREATE TABLE IF NOT EXISTS otp_sessions (
  phone TEXT PRIMARY KEY,
  otp TEXT NOT NULL,
  expires_at INTEGER NOT NULL, -- Unix epoch in milliseconds
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 10. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  details TEXT, -- JSON string
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 11. Administrators Table
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'ADMIN',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Indexes for High Performance Queries
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_participant_id ON tickets(participant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_draw_id ON tickets(draw_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE INDEX IF NOT EXISTS idx_winners_draw_id ON winners(draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_tier ON winners(tier);
CREATE INDEX IF NOT EXISTS idx_winners_announced_at ON winners(announced_at);

CREATE INDEX IF NOT EXISTS idx_participants_phone ON participants(phone);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
