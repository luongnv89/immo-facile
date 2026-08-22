-- Migration: Add Payment Tracking Fields to Receipts Table
-- Task: 1.1.1 - Database Schema for Payment Tracking
-- Date: 2025-10-09
-- Description: Adds payment tracking fields to support payment status management,
--              payment methods, reminders, and notes

-- Add payment_status column (enum: pending, paid, late, partial)
ALTER TABLE receipts ADD COLUMN payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'late', 'partial')) DEFAULT 'pending';

-- Add payment_date column (nullable datetime for when payment was received)
ALTER TABLE receipts ADD COLUMN payment_date DATETIME;

-- Add payment_method column (enum: bank_transfer, check, cash, other)
ALTER TABLE receipts ADD COLUMN payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'check', 'cash', 'other'));

-- Add reminder_sent_count column (tracks number of reminders sent)
ALTER TABLE receipts ADD COLUMN reminder_sent_count INTEGER DEFAULT 0;

-- Add last_reminder_sent_at column (timestamp of last reminder)
ALTER TABLE receipts ADD COLUMN last_reminder_sent_at DATETIME;

-- Add notes column (text field for payment-related notes)
ALTER TABLE receipts ADD COLUMN notes TEXT;

-- Create index on payment_status for faster filtering
CREATE INDEX IF NOT EXISTS idx_receipts_payment_status ON receipts(payment_status);

-- Create index on payment_date for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_receipts_payment_date ON receipts(payment_date);
