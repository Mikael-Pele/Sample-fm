-- Artist dashboard: Releases, EPK and Payouts.
-- New tables only; nothing existing is altered, so the currently deployed
-- code keeps working. Safe to re-run.
-- users.id is uuid in production, so the foreign keys are uuid too.

CREATE TABLE IF NOT EXISTS public.releases (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('live', 'soon', 'draft')),
  distributor  text,
  release_date date,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS releases_user_id_idx ON public.releases (user_id);

CREATE TABLE IF NOT EXISTS public.payouts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  distributor text NOT NULL,
  amount      numeric(12, 2) NOT NULL CHECK (amount >= 0),
  currency    text NOT NULL DEFAULT 'GHS',
  period      text NOT NULL,
  status      text NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payouts_user_id_idx ON public.payouts (user_id);

CREATE TABLE IF NOT EXISTS public.epk_profiles (
  user_id         uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  handle          text NOT NULL UNIQUE,
  display_name    text,
  bio             text,
  photo_url       text,
  monthly_streams integer CHECK (monthly_streams >= 0),
  booking_contact text,
  press_quotes    jsonb NOT NULL DEFAULT '[]'::jsonb,
  visibility      jsonb NOT NULL DEFAULT '{}'::jsonb,
  published       boolean NOT NULL DEFAULT false,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Same as the existing tables: the app talks to Postgres through Prisma
-- with the service connection, never through Supabase's public API.
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epk_profiles ENABLE ROW LEVEL SECURITY;
