create table nutrition_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  calorie_adjustment int not null default 0 check (calorie_adjustment between -500 and 500)
);

create table nutrition_recipes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  calories int not null check (calories between 0 and 10000),
  protein numeric not null check (protein between 0 and 1000),
  carbs numeric not null check (carbs between 0 and 2000),
  fats numeric not null check (fats between 0 and 1000),
  created_at timestamptz not null default now()
);

create table nutrition_meals (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_on date not null,
  name text not null check (char_length(name) between 1 and 80),
  calories int not null check (calories between 0 and 10000),
  protein numeric not null check (protein between 0 and 1000),
  carbs numeric not null check (carbs between 0 and 2000),
  fats numeric not null check (fats between 0 and 1000),
  created_at timestamptz not null default now()
);
create index nutrition_meals_user_date on nutrition_meals (user_id, logged_on desc);

create table weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  measured_on date not null,
  weight_kg numeric not null check (weight_kg between 30 and 250),
  unique (user_id, measured_on)
);

alter table nutrition_settings enable row level security;
alter table nutrition_recipes enable row level security;
alter table nutrition_meals enable row level security;
alter table weigh_ins enable row level security;

create policy nutrition_settings_own on nutrition_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy nutrition_recipes_own on nutrition_recipes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy nutrition_meals_own on nutrition_meals for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy weigh_ins_own on weigh_ins for all using (user_id = auth.uid()) with check (user_id = auth.uid());
