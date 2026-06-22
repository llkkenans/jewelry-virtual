-- Remove beach from elisa avatar — only studio and street are available
UPDATE avatars SET scenes = ARRAY['studio', 'street'] WHERE id = 'elisa';
