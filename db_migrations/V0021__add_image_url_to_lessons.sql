-- Add image_url column to lessons_v2 table
ALTER TABLE lessons_v2 ADD COLUMN IF NOT EXISTS image_url TEXT;