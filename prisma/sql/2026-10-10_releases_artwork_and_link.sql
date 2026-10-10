-- Releases: cover art and a listening link. Additive and nullable, so
-- existing rows and the currently deployed code keep working. Safe to re-run.
ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS artwork_url text,
  ADD COLUMN IF NOT EXISTS link_url    text;
