-- Add scenes array to avatars table
ALTER TABLE avatars ADD COLUMN IF NOT EXISTS scenes text[] DEFAULT ARRAY['studio'];

-- Update elisa to have all 3 scenes
UPDATE avatars SET scenes = ARRAY['studio', 'street', 'beach'] WHERE id = 'elisa';

-- Add scene_type to clothing_generations
ALTER TABLE clothing_generations ADD COLUMN IF NOT EXISTS scene_type text DEFAULT 'studio';
