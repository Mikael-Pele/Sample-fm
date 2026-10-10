-- SmartLinks: TikTok platform link and a "Business & Bookings" button.
-- Additive and nullable, so existing links and the currently deployed code
-- keep working. Safe to re-run.
ALTER TABLE public.smartlinks
  ADD COLUMN IF NOT EXISTS url_tiktok    text,
  ADD COLUMN IF NOT EXISTS booking_url   text,
  ADD COLUMN IF NOT EXISTS booking_label text;
