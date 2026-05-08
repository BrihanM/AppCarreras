-- Migration: create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(50),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  reference_id UUID REFERENCES challenges(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
