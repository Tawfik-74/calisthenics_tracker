-- ── Profiles ────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  days_per_week int not null default 3 check (days_per_week between 3 and 6),
  locale text not null default 'en' check (locale in ('en','ar')),
  time_zone text not null default 'UTC',
  scheduled_workout_time text not null default '18:30',
  squad_id uuid,
  created_at timestamptz not null default now()
);

-- ── Exercise catalog (seeded) ───────────────────────────────
create table exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  pattern text not null check (pattern in ('push','pull','legs','core')),
  measure text not null check (measure in ('reps','hold')),
  min_level text not null check (min_level in ('beginner','intermediate','advanced')),
  regression_of uuid references exercises(id)
);

-- ── Plans ───────────────────────────────────────────────────
create table workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null,
  days_per_week int not null,
  generated_at timestamptz not null default now(),
  archived_at timestamptz,
  days jsonb not null
);
create index workout_plans_active on workout_plans (user_id) where archived_at is null;

-- ── Sessions & sets ─────────────────────────────────────────
create table workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id uuid references workout_plans(id),
  plan_day_index int not null check (plan_day_index between 0 and 6),
  split text not null check (split in ('push','pull','legs','core')),
  status text not null default 'active' check (status in ('active','completed','abandoned')),
  started_at timestamptz not null,
  finished_at timestamptz,
  notes text
);
create index workout_sessions_user_month on workout_sessions (user_id, finished_at);

create table logged_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references workout_sessions(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  set_number int not null check (set_number between 1 and 50),
  reps int check (reps between 0 and 500),
  hold_seconds int check (hold_seconds between 0 and 1800),
  effort int check (effort between 1 and 10),
  completed_at timestamptz not null default now(),
  unique (session_id, exercise_id, set_number)
);

-- ── Squads ──────────────────────────────────────────────────
create table squads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table squad_members (
  squad_id uuid references squads(id) on delete cascade,
  user_id  uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (squad_id, user_id)
);

-- Enforce "up to 4" in the database, not just in Zod.
create or replace function enforce_squad_cap() returns trigger as $$
begin
  if (select count(*) from squad_members where squad_id = new.squad_id) >= 4 then
    raise exception 'SQUAD_FULL';
  end if;
  return new;
end $$ language plpgsql;

create trigger squad_cap before insert on squad_members
  for each row execute function enforce_squad_cap();

create table push_subscriptions (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table nudges (
  id uuid primary key default gen_random_uuid(),
  squad_id uuid not null references squads(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  message_key text not null,
  sent_at timestamptz not null default now()
);
-- Rate limit lives in the index.
create index nudges_recent on nudges (sender_id, sent_at desc);
