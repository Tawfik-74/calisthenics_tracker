-- ─────────────────────────────────────────────────────────────
-- Squad member profiles.
--
-- The problem this solves: `sessions_own` limits reads to auth.uid(), and
-- monthly_exercise_totals is invoker-rights. Calling it for a teammate returns
-- ZERO ROWS rather than an error — the feature would look built and silently
-- render zeros.
--
-- The fix is deliberately NOT "widen sessions_own to squadmates". That would
-- expose raw rows, including session `notes` (free text) and per-set RPE. It
-- follows the same reasoning as send-nudge: the aggregate escapes, the raw
-- rows never do.
-- ─────────────────────────────────────────────────────────────

-- squad_members is the source of truth. profiles.squad_id is denormalized and
-- can drift, so the old policy could leak (or wrongly deny) after a move.
drop policy if exists profiles_squadmates on profiles;
create policy profiles_squadmates on profiles for select using (
  id in (
    select them.user_id
    from squad_members me
    join squad_members them on them.squad_id = me.squad_id
    where me.user_id = auth.uid()
  )
);

-- search_path is pinned on every definer function below: without it, a caller
-- can shadow `squad_members` with a temp table and defeat the check.
create or replace function is_squadmate(p_user uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select p_user = auth.uid() or exists (
    select 1
    from squad_members me
    join squad_members them on them.squad_id = me.squad_id
    where me.user_id = auth.uid() and them.user_id = p_user
  );
$$;

-- Same signature as before, now safe to call for a squadmate.
-- Raises instead of returning empty, so a broken squad membership is loud.
create or replace function monthly_exercise_totals(p_user uuid, p_month text)
returns table (
  exercise_id uuid, slug text, measure text,
  total_reps bigint, total_hold_seconds bigint,
  total_sets bigint, session_count bigint, best_set_reps int
) language plpgsql stable security definer set search_path = public as $$
begin
  if not is_squadmate(p_user) then
    raise exception 'NOT_SQUADMATE' using errcode = '42501';
  end if;

  return query
  select
    e.id, e.slug, e.measure,
    coalesce(sum(s.reps), 0),
    coalesce(sum(s.hold_seconds), 0),
    count(s.id),
    count(distinct w.id),
    coalesce(max(s.reps), 0)
  from workout_sessions w
  join logged_sets s on s.session_id = w.id
  join exercises   e on e.id = s.exercise_id
  where w.user_id = p_user
    and w.status  = 'completed'
    and to_char(
      w.finished_at at time zone (select time_zone from profiles where id = p_user),
      'YYYY-MM'
    ) = p_month
  group by e.id, e.slug, e.measure
  order by 4 desc;
end $$;

-- One row per completed session in the month, pre-totalled.
-- `notes` is deliberately absent: it is the member's private free text.
create or replace function member_month_sessions(p_user uuid, p_month text)
returns table (
  session_id uuid, split text, finished_at timestamptz,
  total_reps bigint, total_hold_seconds bigint, total_sets bigint
) language plpgsql stable security definer set search_path = public as $$
begin
  if not is_squadmate(p_user) then
    raise exception 'NOT_SQUADMATE' using errcode = '42501';
  end if;

  return query
  select
    w.id, w.split, w.finished_at,
    coalesce(sum(s.reps), 0),
    coalesce(sum(s.hold_seconds), 0),
    count(s.id)
  from workout_sessions w
  join logged_sets s on s.session_id = w.id
  where w.user_id = p_user
    and w.status  = 'completed'
    and to_char(
      w.finished_at at time zone (select time_zone from profiles where id = p_user),
      'YYYY-MM'
    ) = p_month
  group by w.id, w.split, w.finished_at
  order by w.finished_at desc;
end $$;

revoke all on function is_squadmate(uuid) from public;
revoke all on function monthly_exercise_totals(uuid, text) from public;
revoke all on function member_month_sessions(uuid, text) from public;
grant execute on function is_squadmate(uuid) to authenticated;
grant execute on function monthly_exercise_totals(uuid, text) to authenticated;
grant execute on function member_month_sessions(uuid, text) to authenticated;
