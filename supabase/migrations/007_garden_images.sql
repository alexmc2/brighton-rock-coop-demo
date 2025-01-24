-- Create garden_images table
create table garden_images (
    id uuid primary key default uuid_generate_v4(),
    public_id text not null,
    secure_url text not null,
    task_id uuid references garden_tasks(id) on delete cascade,
    uploaded_by uuid references auth.users(id) not null,
    caption text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table garden_images enable row level security;

-- Policies for garden_images
create policy "Garden images are viewable by all authenticated users"
    on garden_images for select
    to authenticated
    using (true);

create policy "Garden images can be created by authenticated users"
    on garden_images for insert
    to authenticated
    with check (auth.uid() = uploaded_by);

create policy "Garden images can be deleted by authenticated users"
    on garden_images for delete
    to authenticated
    using (auth.uid() = uploaded_by);

-- Create updated_at trigger
create trigger set_garden_images_updated_at
    before update on garden_images
    for each row
    execute function update_updated_at_column(); 