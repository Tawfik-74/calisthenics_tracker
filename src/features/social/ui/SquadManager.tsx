import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Card, Field, Tag, TextInput, toast } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import { useAuthStore } from '@/features/auth';
import type { UserId } from '@/shared/types/ids';
import { addMemberSchema, type AddMemberInput } from '../model/squad.schema';
import { SQUAD_MAX_MEMBERS } from '../model/squad.types';
import { useAddMember, useRemoveMember, useSquad } from '../lib/useSquad';
import { MemberRow } from './MemberRow';

export function SquadManager() {
  const { t, i18n } = useTranslation('social');
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const { data: squad } = useSquad();
  const currentUserId = useAuthStore((s) => s.session?.user.id ?? null);
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberInput>({ resolver: zodResolver(addMemberSchema) });

  if (!squad) return null;
  const full = squad.members.length >= SQUAD_MAX_MEMBERS;

  const onSubmit = handleSubmit((values) => {
    addMember.mutate(values, {
      onSuccess: (member) => {
        reset({ handle: '' });
        toast({ message: t('toast.member_added', { name: member.displayName }), tone: 'banked' });
      },
      onError: (error) => toast({ message: t(error.message), tone: 'danger' }),
    });
  });

  const onRemove = (id: UserId) => {
    removeMember.mutate(id, {
      onSuccess: () => toast({ message: t('toast.member_removed'), tone: 'default' }),
      onError: (error) => toast({ message: t(error.message), tone: 'danger' }),
    });
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{t('manage.title')}</h2>
        <Tag tone="squad">
          {formatNumber(squad.members.length, locale)}/{formatNumber(SQUAD_MAX_MEMBERS, locale)}
        </Tag>
      </div>

      <ul className="divide-y divide-[var(--color-line)]">
        {squad.members.map((member) => (
          <li key={member.userId}>
            <MemberRow
              member={member}
              canRemove={member.role !== 'owner' && member.userId !== currentUserId}
              onRemove={onRemove}
            />
          </li>
        ))}
      </ul>

      <form className="flex flex-col gap-2" onSubmit={onSubmit} noValidate>
        <Field
          label={t('add.label')}
          hint={full ? t('add.full') : t('add.hint')}
          error={errors.handle && t(errors.handle.message!)}
        >
          {(p) => (
            <TextInput
              placeholder={t('add.placeholder')}
              autoComplete="off"
              disabled={full}
              {...p}
              {...register('handle')}
            />
          )}
        </Field>
        <Button type="submit" size="lg" block disabled={full || addMember.isPending}>
          {t('add.submit')}
        </Button>
      </form>
    </Card>
  );
}
