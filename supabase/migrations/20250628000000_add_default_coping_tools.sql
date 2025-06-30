-- Add default coping tools table and data
-- This provides new users with basic coping strategies

-- First, ensure the coping_tools table exists
CREATE TABLE IF NOT EXISTS coping_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('breathing', 'mindfulness', 'grounding', 'cognitive', 'physical')),
  duration TEXT NOT NULL,
  steps TEXT[] NOT NULL,
  is_recommended BOOLEAN DEFAULT false,
  therapist_approved BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coping_tools ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own coping tools"
  ON coping_tools FOR SELECT
  USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can insert their own coping tools"
  ON coping_tools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own coping tools"
  ON coping_tools FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coping tools"
  ON coping_tools FOR DELETE
  USING (auth.uid() = user_id);

-- Insert default coping tools (available to all users)
INSERT INTO coping_tools (
  id,
  user_id,
  title,
  description,
  category,
  duration,
  steps,
  is_recommended,
  therapist_approved,
  is_default
) VALUES 
(
  gen_random_uuid(),
  NULL, -- NULL user_id means it's a default tool
  '4-7-8 Breathing',
  'A calming breathing technique to reduce anxiety and promote relaxation',
  'breathing',
  '2-3 minutes',
  ARRAY[
    'Sit comfortably with your back straight',
    'Inhale through your nose for 4 counts',
    'Hold your breath for 7 counts',
    'Exhale through your mouth for 8 counts',
    'Repeat 3-4 times'
  ],
  true,
  true,
  true
),
(
  gen_random_uuid(),
  NULL,
  '5-4-3-2-1 Grounding',
  'Use your senses to ground yourself in the present moment',
  'grounding',
  '3-5 minutes',
  ARRAY[
    'Notice 5 things you can see',
    'Notice 4 things you can touch',
    'Notice 3 things you can hear',
    'Notice 2 things you can smell',
    'Notice 1 thing you can taste'
  ],
  true,
  true,
  true
),
(
  gen_random_uuid(),
  NULL,
  'Progressive Muscle Relaxation',
  'Systematically tense and relax muscle groups to reduce physical tension',
  'physical',
  '10-15 minutes',
  ARRAY[
    'Find a comfortable position',
    'Start with your toes - tense for 5 seconds, then relax',
    'Move up to your calves, thighs, abdomen',
    'Continue with arms, shoulders, and face',
    'Notice the difference between tension and relaxation'
  ],
  true,
  true,
  true
),
(
  gen_random_uuid(),
  NULL,
  'Mindful Observation',
  'Focus your attention on a single object to cultivate mindfulness',
  'mindfulness',
  '5-10 minutes',
  ARRAY[
    'Choose an object nearby (flower, stone, photo)',
    'Look at it as if seeing it for the first time',
    'Notice colors, textures, shapes, shadows',
    'When your mind wanders, gently return to the object',
    'End by taking three deep breaths'
  ],
  true,
  true,
  true
);

-- Create a function to automatically assign default coping tools to new users
CREATE OR REPLACE FUNCTION assign_default_coping_tools()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default coping tools for the new user
  INSERT INTO coping_tools (
    user_id,
    title,
    description,
    category,
    duration,
    steps,
    is_recommended,
    therapist_approved,
    is_default
  )
  SELECT 
    NEW.id,
    title,
    description,
    category,
    duration,
    steps,
    is_recommended,
    therapist_approved,
    false -- Not default for user's personal copy
  FROM coping_tools 
  WHERE is_default = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to assign default tools to new users
CREATE TRIGGER assign_default_coping_tools_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_coping_tools(); 