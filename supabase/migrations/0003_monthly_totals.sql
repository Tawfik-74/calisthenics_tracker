-- Aggregate where the data lives. Don't fetch a year of sessions to the browser.
create or replace function monthly_exercise_totals(p_user uuid, p_month text)
returns table (
  exercise_id uuid, slug text, measure text,
  total_reps bigint, total_hold_seconds bigint,
  total_sets bigint, session_count bigint, best_set_reps int
) language sql stable as $$
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
    -- Bucket by the user's own time zone: a 00:30 workout on Oct 1 in
    -- Istanbul should still count as September.
    and to_char(
      w.finished_at at time zone (select time_zone from profiles where id = p_user),
      'YYYY-MM'
    ) = p_month
  group by e.id, e.slug, e.measure
  order by 4 desc;
$$;
