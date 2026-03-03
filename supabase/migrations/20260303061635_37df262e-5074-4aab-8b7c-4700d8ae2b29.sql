
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create scheduled notifications table
CREATE TABLE public.scheduled_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fcm_token TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '⏱️ Period Ended!',
  body TEXT NOT NULL DEFAULT 'Time''s up!',
  send_at TIMESTAMPTZ NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed - this is a public app without auth
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert and delete (no auth in this app)
CREATE POLICY "Allow public insert" ON public.scheduled_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.scheduled_notifications FOR DELETE USING (true);
CREATE POLICY "Allow public select" ON public.scheduled_notifications FOR SELECT USING (true);

-- Cron job: every 30 seconds, call the process-notifications edge function
SELECT cron.schedule(
  'process-scheduled-notifications',
  '30 seconds',
  $$
  SELECT net.http_post(
    url := 'https://rbnithbyfgzrahwwyshl.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibml0aGJ5Zmd6cmFod3d5c2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc4MjIsImV4cCI6MjA4NjE0MzgyMn0.B6d0fRWgti3HyQ5OJv9tQS_JEY1s6gsoLR63rQmyXzA'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
