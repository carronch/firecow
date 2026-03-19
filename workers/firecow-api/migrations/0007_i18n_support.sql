-- Add Spanish translation columns to the `sites` table
ALTER TABLE sites ADD COLUMN tagline_es TEXT;
ALTER TABLE sites ADD COLUMN meta_title_es TEXT;
ALTER TABLE sites ADD COLUMN meta_description_es TEXT;

-- Add Spanish translation columns to the `tours` table
ALTER TABLE tours ADD COLUMN name_es TEXT;
ALTER TABLE tours ADD COLUMN description_es TEXT;
ALTER TABLE tours ADD COLUMN duration_es TEXT;
