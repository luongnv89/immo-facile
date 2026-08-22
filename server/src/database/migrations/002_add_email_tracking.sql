-- Migration: Enhanced Email Tracking System
-- Task: 1.2.2 - Email Tracking System
-- Date: 2025-10-09
-- Description: Creates dedicated email_tracking table for comprehensive email analytics

-- Create email_tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_id INTEGER NOT NULL,
  email_type TEXT NOT NULL CHECK(email_type IN ('receipt', 'reminder', 'notification')),
  tracking_token TEXT UNIQUE NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  opened_at DATETIME,
  open_count INTEGER DEFAULT 0,
  last_opened_at DATETIME,
  user_agent TEXT,
  ip_address TEXT,
  device_type TEXT,
  email_client TEXT,
  is_mobile BOOLEAN DEFAULT 0,
  bounce_type TEXT CHECK(bounce_type IN ('hard', 'soft', 'none')) DEFAULT 'none',
  bounced_at DATETIME,
  unsubscribed BOOLEAN DEFAULT 0,
  unsubscribed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_receipt_id ON email_tracking(receipt_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON email_tracking(tracking_token);
CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_opened_at ON email_tracking(opened_at);
CREATE INDEX IF NOT EXISTS idx_email_tracking_email_type ON email_tracking(email_type);

-- Create email_events table for detailed event tracking
CREATE TABLE IF NOT EXISTS email_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
  event_data TEXT, -- JSON string for additional data
  user_agent TEXT,
  ip_address TEXT,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(tracking_id) REFERENCES email_tracking(id) ON DELETE CASCADE
);

-- Create index on email_events
CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON email_events(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at);
