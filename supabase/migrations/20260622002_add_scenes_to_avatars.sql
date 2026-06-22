-- Add scenes array to avatars table
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS scenes text[] DEFAULT ARRAY['studio'];

-- Update elisa to studio and street only
UPDATE avatars SET scenes = ARRAY['studio', 'street'] WHERE id = 'elisa';

-- Add scene_type to clothing_generations
ALTER TABLE clothing_generations ADD COLUMN IF NOT EXISTS scene_type text DEFAULT 'studio';
