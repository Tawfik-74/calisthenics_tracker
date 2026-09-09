import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import { LoginForm, LocalePicker, useAuthStore } from '@/features/auth';

export function LoginRoute() {
  const { t } = useTranslation(['auth', 'common']);
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'idle') void bootstrap();
  }, [status, bootstrap]);

  useEffect(() => {
    if (status === 'authenticated') navigate('/today', { replace: true });
  }, [status, navigate]);

  if (status === 'authenticated') return <Navigate to="/today" replace />;

  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: 'var(--ember-glow)' }}
      />
      <header className="relative flex items-center justify-between">
        <div>
          <p className="eyebrow">{t('common:app.name')}</p>
          <h1 className="font-display text-xl font-bold">{t('auth:title')}</h1>
        </div>
        <LocalePicker />
      </header>
      <p className="relative text-sm text-[var(--color-steel)]">{t('auth:subtitle')}</p>
      <Card className="relative">
        <LoginForm />
      </Card>
    </main>
  );
}
