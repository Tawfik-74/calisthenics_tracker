// Edge Function: the ONLY place that can send a nudge.
// Holds the VAPID private key; the client just asks it to run.
//
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3';

const RATE_LIMIT_MINUTES = 30;
const QUIET_START = 22;
const QUIET_END = 7;

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
);

Deno.serve(async (req) => {
  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  );

  // 2. verify JWT -> senderId
  const { data: userData } = await supabase.auth.getUser();
  const sender = userData.user;
  if (!sender) return json({ error: 'unauthorized' }, 401);

  const { squadId, messageKey } = await req.json();
  if (!['nudge.workout_time', 'nudge.finished', 'nudge.streak'].includes(messageKey)) {
    return json({ error: 'bad_message_key' }, 400);
  }

  // 3. AUTHZ: sender in squad?
  const { data: membership } = await supabase
    .from('squad_members')
    .select('squad_id')
    .eq('squad_id', squadId)
    .eq('user_id', sender.id)
    .maybeSingle();
  if (!membership) return json({ error: 'not_in_squad' }, 403);

  // 4. RATE LIMIT: 1 nudge / 30 min
  const since = new Date(Date.now() - RATE_LIMIT_MINUTES * 60_000).toISOString();
  const { count } = await supabase
    .from('nudges')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', sender.id)
    .eq('squad_id', squadId)
    .gte('sent_at', since);
  if ((count ?? 0) > 0) return json({ error: 'rate_limited' }, 429);

  // 5. INSERT audit row
  const { data: nudge } = await supabase
    .from('nudges')
    .insert({ squad_id: squadId, sender_id: sender.id, message_key: messageKey })
    .select()
    .single();

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: senderProfile } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', sender.id)
    .single();

  const { data: members } = await admin
    .from('squad_members')
    .select('user_id, profiles(time_zone)')
    .eq('squad_id', squadId)
    .neq('user_id', sender.id);

  const payload = {
    id: nudge.id,
    squadId,
    senderId: sender.id,
    senderName: senderProfile?.display_name ?? 'A squadmate',
    messageKey,
    sentAt: nudge.sent_at,
  };

  // 6a. Realtime broadcast -> apps that are open
  await admin.channel(`squad:${squadId}`).send({
    type: 'broadcast',
    event: 'nudge',
    payload,
  });

  // 6b. Web Push -> apps that are closed, skipping quiet hours per recipient
  let deliveredTo = 0;
  for (const m of members ?? []) {
    const tz = (m as any).profiles?.time_zone ?? 'UTC';
    const localHour = Number(
      new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(
        new Date(),
      ),
    );
    if (localHour >= QUIET_START || localHour < QUIET_END) continue; // audit row already written

    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', (m as any).user_id);

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: payload.senderName, body: messageKey, url: '/session', tag: nudge.id }),
        );
        deliveredTo++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }
  }

  return json({ deliveredTo }, 202);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
