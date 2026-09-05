import { supabase } from '@/shared/lib/supabase';
import { env } from '@/shared/config/env';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export type PushSupport = 'unsupported' | 'denied' | 'default' | 'granted';

const ALERTS_KEY = 'ct.alerts';

export function pushSupport(): PushSupport {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  return Notification.permission as PushSupport;
}

/** Whether the user has turned squad alerts on (real grant or the mock flag). */
export function alertsEnabled(): boolean {
  try {
    if (localStorage.getItem(ALERTS_KEY) === 'on') return true;
  } catch {
    /* storage unavailable */
  }
  return pushSupport() === 'granted';
}

/**
 * Turns alerts on. With a real backend this subscribes via VAPID; without one
 * (workshop / offline mode) it still asks the OS for permission when possible
 * and records the preference so the prompt stops nagging.
 *
 * @returns `'real'` when a push subscription was created, `'mock'` when only
 * the local preference was stored, or `'denied'` when the OS refused.
 */
export async function enableAlerts(): Promise<'real' | 'mock' | 'denied'> {
  // Real backend: a genuine OS grant is required for Web Push to reach a
  // closed app.
  if (supabase && env.vapidPublicKey) {
    if ('Notification' in window && Notification.permission === 'denied') return 'denied';
    const ok = await enablePush();
    if (ok) {
      persistAlertsFlag();
      return 'real';
    }
    return 'denied';
  }

  // Offline / workshop mode: ask once as a courtesy, but the in-app Realtime
  // toast works regardless, so we never block on the answer.
  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      /* browser refused to prompt — fine, the in-app path still works */
    }
  }
  persistAlertsFlag();
  return 'mock';
}

function persistAlertsFlag(): void {
  try {
    localStorage.setItem(ALERTS_KEY, 'on');
  } catch {
    /* storage unavailable */
  }
}

/** SW registration + VAPID subscribe. Never blocks the feature if it fails. */
export async function enablePush(): Promise<boolean> {
  if (pushSupport() === 'unsupported' || !env.vapidPublicKey) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const reg = await navigator.serviceWorker.register('/sw.js');
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey) as BufferSource,
  });

  const json = sub.toJSON();
  if (supabase && json.keys) {
    await supabase.from('push_subscriptions').upsert({
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
  }
  return true;
}
