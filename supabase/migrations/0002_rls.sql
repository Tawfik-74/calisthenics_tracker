alter table profiles            enable row level security;
alter table workout_plans       enable row level security;
alter table workout_sessions    enable row level security;
alter table logged_sets         enable row level security;
alter table squads              enable row level security;
alter table squad_members       enable row level security;
alter table push_subscriptions  enable row level security;
alter table nudges              enable row level security;
alter table exercises           enable row level security;

-- Everyone can read the exercise catalog.
create policy exercises_read on exercises for select using (true);

-- Profiles: read your own + squadmates'; write only your own.
create policy profiles_self on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_squadmates on profiles for select using (
  squad_id is not null and squad_id in (
    select squad_id from squad_members where user_id = auth.uid()
  )
);

-- Plans / sessions: your own only.
create policy plans_own on workout_plans
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sessions_own on workout_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sets_own on logged_sets
  for all using (
    session_id in (select id from workout_sessions where user_id = auth.uid())
  ) with check (
    session_id in (select id from workout_sessions where user_id = auth.uid())
  );

-- Squads: read one only if you're a member.
create policy squads_member_read on squads for select using (
  id in (select squad_id from squad_members where user_id = auth.uid())
);
create policy squad_members_read on squad_members for select using (
  squad_id in (select squad_id from squad_members where user_id = auth.uid())
);
create policy squad_members_self_insert on squad_members
  for insert with check (user_id = auth.uid());
create policy squad_members_self_delete on squad_members
  for delete using (user_id = auth.uid());

-- Nudges: insert only for a squad you belong to; read your squad's.
create policy nudges_insert on nudges for insert with check (
  sender_id = auth.uid() and squad_id in (
    select squad_id from squad_members where user_id = auth.uid()
  )
);
create policy nudges_read on nudges for select using (
  squad_id in (select squad_id from squad_members where user_id = auth.uid())
);

-- Push subscriptions: your own only.
create policy push_subs_own on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
