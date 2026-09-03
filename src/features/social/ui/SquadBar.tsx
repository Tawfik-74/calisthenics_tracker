import { useTranslation } from 'react-i18next';
import { Card, Skeleton, Tag } from '@/shared/ui';
import { currentMonthKey } from '@/shared/lib/dates';
import type { UserId } from '@/shared/types/ids';
import { useSquad } from '../lib/useSquad';
import { useNudgeChannel } from '../lib/useNudgeChannel';
import { usePrefetchMember } from '../lib/useMemberProfile';
import { SQUAD_MAX_MEMBERS } from '../model/squad.types';
import { NudgeButton } from './NudgeButton';

export function SquadBar({ onSelectMember }: { onSelectMember?: (userId: UserId) => void }) {
  const { t } = useTranslation('social');
  const { data: squad, isPending } = useSquad();
  useNudgeChannel(squad?.id ?? null);
  const prefetch = usePrefetchMember(currentMonthKey());

  if (isPending) return <Skeleton className="h-24" />;
  if (!squad) {
    return (
      <Card>
        <p className="text-sm text-[var(--color-steel)]">{t('no_squad')}</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{squad.name}</h2>
        <Tag tone="squad">
          {squad.members.length}/{SQUAD_MAX_MEMBERS}
        </Tag>
      </div>

      <ul className="flex flex-wrap gap-2">
        {squad.members.map((m) => (
          <li key={m.userId}>
            <button
              type="button"
              onClick={() => onSelectMember?.(m.userId)}
              // A squad is <= 4 people, so warming the profile on intent is
              // nearly free and makes the transition feel instant.
              onPointerEnter={() => prefetch(m.userId)}
              onFocus={() => prefetch(m.userId)}
              disabled={!onSelectMember}
              className="flex min-h-[48px] items-center gap-2 rounded-full bg-[var(--color-hover)] px-3 text-sm enabled:hover:bg-[var(--color-hover-strong)] disabled:cursor-default"
            >
              <span
                aria-hidden="true"
                className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-effort)] text-xs font-bold text-white"
              >
                {m.displayName.charAt(0)}
              </span>
              {m.displayName}
              {m.role === 'owner' && <span className="eyebrow">{t('owner')}</span>}
            </button>
          </li>
        ))}
      </ul>

      <NudgeButton squadId={squad.id} />
    </Card>
  );
}
