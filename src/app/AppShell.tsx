import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { ThemeToggle } from '@/shared/ui';
import { LocalePicker, useAuthStore } from '@/features/auth';

const TABS = [
  { to: '/today', key: 'today' },
  { to: '/session', key: 'session' },
  { to: '/squad', key: 'squad' },
  { to: '/stats', key: 'stats' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const signOut = useAuthStore((s) => s.signOut);
  const name = useAuthStore((s) => s.session?.user.displayName ?? '');

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between p-4">
        <div>
          <p className="eyebrow">{t('app.name')}</p>
          <p className="font-display text-lg font-bold">{name}</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocalePicker />
          <button
            type="button"
            onClick={() => void signOut()}
            className="min-h-[36px] rounded-full px-3 text-sm text-[var(--color-steel)]"
          >
            ⎋
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-3xl border-t border-[var(--color-line)] bg-[var(--color-raised)]">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold',
                isActive ? 'text-[var(--color-effort)]' : 'text-[var(--color-steel)]',
              )
            }
          >
            {t(`nav.${tab.key}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
