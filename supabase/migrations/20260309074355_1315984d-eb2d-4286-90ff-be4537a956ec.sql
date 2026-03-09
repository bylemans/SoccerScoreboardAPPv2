
-- Drop ALL existing policies on scheduled_notifications
DROP POLICY IF EXISTS "Allow public delete" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public insert" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public select" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public update" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public delete " ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public insert " ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public select " ON public.scheduled_notifications;
DROP POLICY IF EXISTS "Allow public update " ON public.scheduled_notifications;

-- Create PERMISSIVE policies (default is PERMISSIVE)
CREATE POLICY "permissive_select" ON public.scheduled_notifications FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "permissive_insert" ON public.scheduled_notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "permissive_delete" ON public.scheduled_notifications FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "permissive_update" ON public.scheduled_notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
