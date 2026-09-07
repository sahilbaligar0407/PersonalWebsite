-- SmartCal Calendar App - Initial Schema
-- Run this in Supabase SQL Editor to create tables and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles: user metadata (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendars: user calendar subscriptions
CREATE TABLE IF NOT EXISTS calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Assignments: calendar events/tasks
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  name TEXT NOT NULL,
  due_date DATE NOT NULL,
  due_time TEXT,
  link TEXT,
  color TEXT DEFAULT 'blue',
  source TEXT DEFAULT 'manual', -- 'manual' | 'ics' | 'ai_text' | 'ai_image'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calendar_id, course, name, due_date)
);

-- AI usage tracking for rate limiting (20/month per user)
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- format: 'YYYY-MM'
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- Course colors: per-user course color preferences
CREATE TABLE IF NOT EXISTS course_colors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course)
);

-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_colors ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Calendars: users can CRUD own
CREATE POLICY "Users can manage own calendars" ON calendars
  FOR ALL USING (auth.uid() = user_id);

-- Assignments: through calendar ownership
CREATE POLICY "Users can manage assignments in own calendar" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM calendars
      WHERE calendars.id = assignments.calendar_id
      AND calendars.user_id = auth.uid()
    )
  );

-- AI usage: users can read/insert/update own
CREATE POLICY "Users can manage own ai_usage" ON ai_usage
  FOR ALL USING (auth.uid() = user_id);

-- Course colors: users can CRUD own
CREATE POLICY "Users can manage own course_colors" ON course_colors
  FOR ALL USING (auth.uid() = user_id);
