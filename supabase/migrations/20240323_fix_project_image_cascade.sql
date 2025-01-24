-- Drop existing foreign key if it exists
ALTER TABLE garden_images
DROP CONSTRAINT IF EXISTS garden_images_project_id_fkey;

-- Add foreign key with cascade delete
ALTER TABLE garden_images
ADD CONSTRAINT garden_images_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES garden_projects(id)
ON DELETE CASCADE; 