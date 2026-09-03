import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Field, TextInput, toast } from '@/shared/ui';
import type { SquadId } from '@/shared/types/ids';
import { inviteFriendsSchema, type InviteFriendsInput } from '../model/squad.schema';
import { useInviteFriends } from '../lib/useSquad';
import { SQUAD_MAX_MEMBERS } from '../model/squad.types';

export function InviteForm({ squadId, onDone }: { squadId: SquadId; onDone?: () => void }) {
  const { t } = useTranslation('social');
  const invite = useInviteFriends();
  const [raw, setRaw] = useState('');

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InviteFriendsInput>({
    resolver: zodResolver(inviteFriendsSchema),
    defaultValues: { squadId, emails: [], messageKey: 'invite.default' },
  });

  function sync(value: string) {
    setRaw(value);
    setValue(
      'emails',
      value
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      { shouldValidate: true },
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((v) =>
        invite.mutate(v, {
          onSuccess: (r) => {
            toast({ message: t('invited', { count: r.invited }), tone: 'squad' });
            onDone?.();
          },
          onError: () => toast({ message: t('error.invite_failed'), tone: 'danger' }),
        }),
      )}
      noValidate
    >
      <Field
        label={t('field.emails')}
        hint={t('field.emails_hint', { max: SQUAD_MAX_MEMBERS - 1 })}
        error={errors.emails && t(errors.emails.message ?? errors.emails.root?.message ?? '')}
      >
        {(p) => (
          <TextInput
            {...p}
            value={raw}
            onChange={(e) => sync(e.target.value)}
            placeholder="layla@example.com, sami@example.com"
          />
        )}
      </Field>

      <Button type="submit" size="lg" block disabled={invite.isPending}>
        {t('action.send_invites')}
      </Button>
    </form>
  );
}
