-- Create missing database functions with proper security settings

-- Fix existing functions to include search_path for security
CREATE OR REPLACE FUNCTION public.is_trial_expired(user_profile profiles)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT user_profile.plan = 'trial' AND user_profile.trial_ends_at < now();
$function$;

CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_type text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE  
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT CASE 
    WHEN plan_type = 'trial' THEN '{"projects": 1, "keywords": 10, "reports": 5, "competitors": 0}'::jsonb
    WHEN plan_type = 'basic' THEN '{"projects": 3, "keywords": 25, "reports": 15, "competitors": 1}'::jsonb
    WHEN plan_type = 'gold' THEN '{"projects": 10, "keywords": 50, "reports": 50, "competitors": -1}'::jsonb
    ELSE '{}'::jsonb
  END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create triggers for new user registration and updated_at
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add updated_at triggers for tables that need them
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();