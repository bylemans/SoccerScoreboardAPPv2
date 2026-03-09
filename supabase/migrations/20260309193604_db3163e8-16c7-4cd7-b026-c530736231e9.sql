
DROP POLICY IF EXISTS "permissive_select" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "permissive_insert" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "permissive_delete" ON public.scheduled_notifications;
DROP POLICY IF EXISTS "permissive_update" ON public.scheduled_notifications;

CREATE POLICY "open_select" ON public.scheduled_notifications AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "open_insert" ON public.scheduled_notifications AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "open_delete" ON public.scheduled_notifications AS PERMISSIVE FOR DELETE TO anon, authenticated USING (true);
CREATE POLICY "open_update" ON public.scheduled_notifications AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
