import { type ReactNode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { queryClient } from '@/shared/config/queryClient';
import { initI18n, i18n, registerNamespaces, useDirection } from '@/shared/i18n';
import { useApplyTheme } from '@/shared/lib/theme';
import { Toaster } from '@/shared/ui';
import { authEn, authAr } from '@/features/auth';
import { planEn, planAr } from '@/features/plan';
import { workoutsEn, workoutsAr } from '@/features/workouts';
import { socialEn, socialAr } from '@/features/social';
import { statsEn, statsAr } from '@/features/stats';

// The composition root is the only place features meet — so it owns i18n wiring.
initI18n();
registerNamespaces([
  { ns: 'auth', en: authEn, ar: authAr },
  { ns: 'plan', en: planEn, ar: planAr },
  { ns: 'workouts', en: workoutsEn, ar: workoutsAr },
  { ns: 'social', en: socialEn, ar: socialAr },
  { ns: 'stats', en: statsEn, ar: statsAr },
]);

function DirectionProvider({ children }: { children: ReactNode }) {
  useDirection();
  return <>{children}</>;
}

function ThemeProvider({ children }: { children: ReactNode }) {
  useApplyTheme();
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('ct.locale');
    if (saved && saved !== i18n.language) void i18n.changeLanguage(saved);
    const onChange = (lng: string) => localStorage.setItem('ct.locale', lng);
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <DirectionProvider>
            {children}
            <Toaster />
          </DirectionProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}
