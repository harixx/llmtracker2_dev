-- Update profiles table to support trial expiry and subscription management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '14 days');

-- Update the plan enum to include the correct values
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('trial', 'basic', 'gold');

-- Recreate the plan column with proper type
ALTER TABLE public.profiles 
ALTER COLUMN plan TYPE text;

ALTER TABLE public.profiles 
ALTER COLUMN plan TYPE app_role USING plan::app_role;

-- Update limits based on the new plan structure
UPDATE public.profiles SET 
  projects_limit = 1,
  keywords_limit = 10,
  reports_limit = 5
WHERE plan = 'trial';

-- Set basic plan limits
UPDATE public.profiles SET 
  projects_limit = 3,
  keywords_limit = 25,
  reports_limit = 15
WHERE plan = 'basic';

-- Set gold plan limits  
UPDATE public.profiles SET 
  projects_limit = 10,
  keywords_limit = 50,
  reports_limit = 50
WHERE plan = 'gold';

-- Create function to check if trial has expired
CREATE OR REPLACE FUNCTION public.is_trial_expired(user_profile profiles)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT user_profile.plan = 'trial' AND user_profile.trial_ends_at < now();
$$;

-- Create function to get plan limits
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_type app_role)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN plan_type = 'trial' THEN '{"projects": 1, "keywords": 10, "reports": 5, "competitors": 0}'::jsonb
    WHEN plan_type = 'basic' THEN '{"projects": 3, "keywords": 25, "reports": 15, "competitors": 1}'::jsonb
    WHEN plan_type = 'gold' THEN '{"projects": 10, "keywords": 50, "reports": 50, "competitors": -1}'::jsonb
    ELSE '{}'::jsonb
  END;
$$;