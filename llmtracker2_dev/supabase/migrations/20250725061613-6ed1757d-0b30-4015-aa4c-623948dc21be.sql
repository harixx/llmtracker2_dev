-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'trial', 'basic', 'gold');

-- Create profiles table for user information and plan limits
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company TEXT,
  plan app_role NOT NULL DEFAULT 'trial',
  plan_expires_at TIMESTAMPTZ,
  projects_limit INTEGER NOT NULL DEFAULT 1,
  keywords_limit INTEGER NOT NULL DEFAULT 10,
  reports_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create projects table for user projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  competitors TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create keywords table for project keywords
CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create reports table for generated reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('keyword_tracking', 'competitor_analysis', 'citation_analysis')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata JSONB DEFAULT '{}',
  results JSONB DEFAULT '{}',
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create api_responses table for storing raw API outputs
CREATE TABLE public.api_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  keyword TEXT NOT NULL,
  raw_response JSONB NOT NULL,
  response_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscribers table for Stripe subscription data
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" ON public.projects
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON public.projects
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for keywords
CREATE POLICY "Users can view keywords in their projects" ON public.keywords
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keywords.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create keywords in their projects" ON public.keywords
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keywords.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update keywords in their projects" ON public.keywords
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keywords.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete keywords in their projects" ON public.keywords
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = keywords.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create RLS policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON public.reports
FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for api_responses
CREATE POLICY "Users can view api_responses for their reports" ON public.api_responses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = api_responses.report_id 
    AND reports.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create api_responses for their reports" ON public.api_responses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reports 
    WHERE reports.id = api_responses.report_id 
    AND reports.user_id = auth.uid()
  )
);

-- Create RLS policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
FOR SELECT USING (auth.uid() = user_id OR auth.email() = email);

CREATE POLICY "Users can update their own subscription" ON public.subscribers
FOR UPDATE USING (auth.uid() = user_id OR auth.email() = email);

CREATE POLICY "Users can insert their own subscription" ON public.subscribers
FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.email() = email);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_keywords_project_id ON public.keywords(project_id);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_project_id ON public.reports(project_id);
CREATE INDEX idx_api_responses_report_id ON public.api_responses(report_id);
CREATE INDEX idx_subscribers_user_id ON public.subscribers(user_id);
CREATE INDEX idx_subscribers_email ON public.subscribers(email);