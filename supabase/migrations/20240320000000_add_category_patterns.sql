-- Create the category patterns table
CREATE TABLE demo_treasury_category_patterns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES demo_treasury_categories(id) ON DELETE CASCADE,
    pattern text NOT NULL,
    description text NOT NULL,
    is_expense boolean NOT NULL,
    confidence_score float NOT NULL DEFAULT 1.0,
    match_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_matched_at timestamptz,
    created_by uuid NOT NULL REFERENCES demo_profiles(id) ON DELETE CASCADE,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE demo_treasury_category_patterns ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view patterns
CREATE POLICY "Users can view patterns" ON demo_treasury_category_patterns
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to create patterns
CREATE POLICY "Users can create patterns" ON demo_treasury_category_patterns
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own patterns
CREATE POLICY "Users can update their patterns" ON demo_treasury_category_patterns
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own patterns
CREATE POLICY "Users can delete their patterns" ON demo_treasury_category_patterns
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Add updated_at trigger
CREATE TRIGGER set_demo_treasury_category_patterns_updated_at
    BEFORE UPDATE ON demo_treasury_category_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 