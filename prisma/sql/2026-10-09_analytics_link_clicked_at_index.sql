-- Analytics dashboard: speeds up the date-ranged click queries behind the
-- "clicks over time" chart (/api/analytics/summary?days=…&link_id=…).
-- Safe to re-run. CONCURRENTLY avoids locking the table against new clicks;
-- run it on its own, outside a transaction (e.g. the Supabase SQL editor).
CREATE INDEX CONCURRENTLY IF NOT EXISTS "analytics_link_id_clicked_at_idx"
  ON public.analytics (link_id, clicked_at);
