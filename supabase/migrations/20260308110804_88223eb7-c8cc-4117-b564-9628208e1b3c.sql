
-- Drop the broken restrictive policies
DROP POLICY "Allow public delete" ON public.scheduled_notifications;
DROP POLICY "Allow public insert" ON public.scheduled_notifications;
DROP POLICY "Allow public select" ON public.scheduled_notifications;

-- Create proper permissive policies
CREATE POLICY "Allow public select" ON public.scheduled_notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert" ON public.scheduled_notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.scheduled_notifications FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "Allow public update" ON public.scheduled_notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
