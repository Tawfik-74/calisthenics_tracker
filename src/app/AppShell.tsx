import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from '@/shared/ui';
import { LocalePicker, useAuthStore } from '@/features/auth';

type IconProps = { className?: string };
const ico = 'h-5 w-5 shrink-0';

function TodayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(ico, className)} aria-hidden>
      <path
        d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function SessionIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(ico, className)} aria-hidden>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}
function SkillsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(ico, className)} aria-hidden>
      <path
        d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8L6.4 20l1-6L3 9.9 9 9z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SquadIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(ico, className)} aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6S13.9 16 14.5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 5.2A3 3 0 0 1 16 11m2.5 7.4c-.3-2-1.2-3.4-2.6-4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function StatsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn(ico, className)} aria-hidden>
      <path d="M5 20V10m7 10V4m7 16v-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { to: '/today', key: 'today', Icon: TodayIcon },
  { to: '/session', key: 'session', Icon: SessionIcon },
  { to: '/skills', key: 'skills', Icon: SkillsIcon },
  { to: '/squad', key: 'squad', Icon: SquadIcon },
  { to: '/stats', key: 'stats', Icon: StatsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const signOut = useAuthStore((s) => s.signOut);
  const name = useAuthStore((s) => s.session?.user.displayName ?? '');

  const signOutBtn = (
    <button
      type="button"
      onClick={() => void signOut()}
      aria-label={t('action.sign_out', { defaultValue: 'Sign out' })}
      className="min-h-[36px] rounded-full px-3 text-sm text-[var(--color-steel)] hover:text-[var(--color-ink)]"
    >
      ⎋
    </button>
  );

  return (
    <div className="relative flex min-h-dvh flex-col md:flex-row">
      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside className="sticky top-0 z-20 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-e border-[var(--color-line)] bg-[var(--color-raised)] p-5 md:flex">
        <div className="flex flex-col gap-0.5">
          <p className="eyebrow">{t('app.name')}</p>
          <p className="truncate font-display text-lg font-bold">{name}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {TABS.map(({ to, key, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'bg-[var(--color-effort)]/12 text-[var(--color-effort-ink)]'
                    : 'text-[var(--color-steel)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]',
                )
              }
            >
              <Icon />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-between gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-1">
            <LocalePicker />
            {signOutBtn}
          </div>
        </div>
      </aside>

      {/* ── Content column ─────────────────────────────────── */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{ background: 'var(--ember-glow)' }}
        />

        {/* Mobile top bar */}
        <header className="relative flex items-center justify-between gap-2 p-4 md:hidden">
          <p className="min-w-0 flex-1 truncate font-display text-lg font-bold">{name}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <LocalePicker />
            {signOutBtn}
          </div>
        </header>

        <main className="relative flex-1 px-4 pb-28 md:px-8 md:pb-16 md:pt-10 lg:px-12">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>

      {/* ── Mobile bottom nav ──────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[var(--color-line)] bg-[var(--color-raised)] md:hidden">
        {TABS.map(({ to, key, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold',
                isActive ? 'text-[var(--color-effort)]' : 'text-[var(--color-steel)]',
              )
            }
          >
            <Icon />
            {t(`nav.${key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
