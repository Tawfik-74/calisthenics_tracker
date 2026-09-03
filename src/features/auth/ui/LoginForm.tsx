import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Field, TextInput } from '@/shared/ui';
import { loginSchema, type LoginInput } from '../model/auth.schema';
import { useAuthStore } from '../model/authStore';

export function LoginForm() {
  const { t } = useTranslation(['auth', 'common']);
  const signIn = useAuthStore((s) => s.signIn);
  const status = useAuthStore((s) => s.status);
  const serverError = useAuthStore((s) => s.error);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'demo@calisthenics.app', password: 'demo1234', rememberMe: true },
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((v) => signIn(v))} noValidate>
      <Field label={t('auth:field.email')} error={errors.email && t(errors.email.message!)}>
        {(p) => <TextInput type="email" autoComplete="email" placeholder="you@example.com" {...p} {...register('email')} />}
      </Field>

      <Field label={t('auth:field.password')} error={errors.password && t(errors.password.message!)}>
        {(p) => <TextInput type="password" autoComplete="current-password" {...p} {...register('password')} />}
      </Field>

      <label className="flex items-center gap-2 text-sm text-[var(--color-steel)]">
        <input type="checkbox" className="h-4 w-4" {...register('rememberMe')} />
        {t('auth:field.remember_me')}
      </label>

      {serverError && (
        <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
          {t(serverError)}
        </p>
      )}

      <Button type="submit" size="lg" block disabled={status === 'loading'}>
        {status === 'loading' ? t('common:state.loading') : t('auth:action.sign_in')}
      </Button>
    </form>
  );
}
