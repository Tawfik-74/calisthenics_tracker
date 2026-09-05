import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tag } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import type { UserId } from '@/shared/types/ids';
import type { SquadMember } from '../model/squad.types';

export function MemberRow({
  member,
  canRemove,
  onRemove,
}: {
  member: SquadMember;
  canRemove: boolean;
  onRemove: (id: UserId) => void;
}) {
  const { t, i18n } = useTranslation('social');
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-3 py-2">
      <span
        aria-hidden="true"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-effort)] text-sm font-bold text-[var(--color-on-effort)]"
      >
        {member.displayName.charAt(0).toUpperCase()}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{member.displayName}</span>
          {member.role === 'owner' && <span className="eyebrow">{t('owner')}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tag tone={member.status === 'active' ? 'banked' : 'neutral'}>
            {t(`status.${member.status}`)}
          </Tag>
          {member.streak > 0 && (
            <span className="font-numeric text-xs text-[var(--color-steel)]">
              {'🔥'} {formatNumber(member.streak, locale)}
            </span>
          )}
        </div>
      </div>

      {canRemove && (
        <Button
          variant={confirming ? 'danger' : 'quiet'}
          size="md"
          onClick={() => (confirming ? onRemove(member.userId) : setConfirming(true))}
          onBlur={() => setConfirming(false)}
        >
          {confirming ? t('remove.confirm') : t('action.remove')}
        </Button>
      )}
    </div>
  );
}
