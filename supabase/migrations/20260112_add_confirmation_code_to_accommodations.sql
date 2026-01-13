-- Add confirmation_code column to accommodations table
ALTER TABLE accommodations 
ADD COLUMN IF NOT EXISTS confirmation_code text;
