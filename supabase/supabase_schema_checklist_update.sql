-- Add due_date column to checklist_tasks table
-- Run this in your Supabase SQL Editor
ALTER TABLE checklist_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
