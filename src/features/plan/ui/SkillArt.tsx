import { type ReactNode, useId, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import type { SkillId } from '../model/skill.types';

/**
 * Real-photo overrides. Each entry points at a file in `public/skills/`; if the
 * file is missing (or fails to load) the component falls back to the built-in
 * silhouette, so these can be filled in at any time with no other change.
 */
const PHOTOS: Record<SkillId, string> = {
  handstand: '/skills/handstand.jpg',
  muscle_up: '/skills/muscle_up.jpg',
  pistol_squat: '/skills/pistol_squat.jpg',
  planche: '/skills/planche.jpg',
  front_lever: '/skills/front_lever.jpg',
  human_flag: '/skills/human_flag.jpg',
  dragon_flag: '/skills/dragon_flag.jpg',
};

// Shared presentation attributes — SVG <style> is not scoped, so keep it inline.
const APP = {
  stroke: 'var(--color-effort)',
  strokeWidth: 7,
  strokeLinecap: 'round' as const,
};
const FIG = {
  stroke: 'currentColor',
  strokeWidth: 13,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
  opacity: 0.92,
};
const DOT = { fill: 'currentColor', stroke: 'none' };
const HEAD = { fill: 'currentColor', opacity: 0.92 };

/** Gesture-drawing silhouettes, one per skill. viewBox is 300×300. */
const FIGURES: Record<SkillId, ReactNode> = {
  handstand: (
    <>
      <g {...APP}>
        <line x1="55" y1="258" x2="245" y2="258" />
      </g>
      <g {...FIG}>
        <line x1="151" y1="248" x2="151" y2="205" />
        <line x1="151" y1="205" x2="152" y2="115" />
        <line x1="152" y1="115" x2="140" y2="34" />
        <line x1="152" y1="115" x2="164" y2="34" />
        <circle cx="141" cy="250" r="6" {...DOT} />
        <circle cx="161" cy="250" r="6" {...DOT} />
      </g>
      <circle cx="151" cy="224" r="13" {...HEAD} />
    </>
  ),
  muscle_up: (
    <>
      <g {...APP}>
        <line x1="100" y1="120" x2="200" y2="120" />
        <line x1="100" y1="120" x2="100" y2="176" />
        <line x1="200" y1="120" x2="200" y2="176" />
      </g>
      <g {...FIG}>
        <polyline points="138,120 126,95 150,105" />
        <polyline points="162,120 174,95 150,105" />
        <line x1="150" y1="106" x2="160" y2="150" />
        <polyline points="160,150 152,196 177,214" />
      </g>
      <circle cx="150" cy="83" r="12" {...HEAD} />
    </>
  ),
  pistol_squat: (
    <>
      <g {...APP}>
        <line x1="60" y1="260" x2="240" y2="260" />
      </g>
      <g {...FIG}>
        <polyline points="150,256 180,214 150,206" />
        <line x1="150" y1="206" x2="138" y2="150" />
        <line x1="140" y1="152" x2="212" y2="150" />
        <polyline points="150,206 258,196 258,190" />
      </g>
      <circle cx="142" cy="130" r="12" {...HEAD} />
    </>
  ),
  planche: (
    <>
      <g {...APP}>
        <line x1="45" y1="252" x2="255" y2="252" />
      </g>
      <g {...FIG}>
        <line x1="110" y1="246" x2="140" y2="222" />
        <polyline points="140,222 205,214 272,206" />
        <circle cx="110" cy="246" r="6" {...DOT} />
      </g>
      <circle cx="162" cy="234" r="11" {...HEAD} />
    </>
  ),
  front_lever: (
    <>
      <g {...APP}>
        <line x1="95" y1="55" x2="205" y2="55" />
        <line x1="95" y1="55" x2="95" y2="22" />
        <line x1="205" y1="55" x2="205" y2="22" />
      </g>
      <g {...FIG}>
        <line x1="150" y1="55" x2="150" y2="118" />
        <polyline points="120,118 150,118 238,121 296,124" />
      </g>
      <circle cx="104" cy="118" r="12" {...HEAD} />
    </>
  ),
  human_flag: (
    <>
      <g {...APP}>
        <line x1="70" y1="24" x2="70" y2="286" />
      </g>
      <g {...FIG}>
        <line x1="70" y1="120" x2="122" y2="150" />
        <line x1="70" y1="178" x2="122" y2="150" />
        <polyline points="122,150 210,156 280,160" />
      </g>
      <circle cx="152" cy="146" r="12" {...HEAD} />
    </>
  ),
  dragon_flag: (
    <>
      <g {...APP}>
        <line x1="35" y1="250" x2="150" y2="250" />
        <line x1="55" y1="250" x2="55" y2="283" />
        <line x1="140" y1="250" x2="140" y2="283" />
      </g>
      <g {...FIG}>
        <line x1="95" y1="246" x2="135" y2="244" />
        <polyline points="135,244 220,175 282,122" />
        <circle cx="95" cy="246" r="6" {...DOT} />
      </g>
      <circle cx="152" cy="232" r="12" {...HEAD} />
    </>
  ),
};

export interface SkillArtProps {
  skillId: SkillId;
  /** `hero` fills its container; `thumb` is a fixed 64px square. */
  variant?: 'hero' | 'thumb';
  className?: string;
}

export function SkillArt({ skillId, variant = 'hero', className }: SkillArtProps) {
  const gradId = useId();
  const [broken, setBroken] = useState<Set<SkillId>>(() => new Set());
  const photo = broken.has(skillId) ? null : PHOTOS[skillId];

  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)]',
        variant === 'hero'
          ? 'aspect-[4/3] w-full rounded-[12px]'
          : 'h-16 w-16 shrink-0 rounded-[10px]',
        className,
      )}
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          onError={() => setBroken((s) => new Set(s).add(skillId))}
          className="h-full w-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 300 300"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full text-[var(--color-ink)]"
        >
          <defs>
            <radialGradient id={gradId} cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="var(--color-raised)" />
              <stop offset="100%" stopColor="var(--color-surface)" />
            </radialGradient>
          </defs>
          <rect width="300" height="300" fill={`url(#${gradId})`} />
          <g stroke="var(--color-line)" strokeWidth="1" opacity="0.45">
            {[42, 84, 126, 168, 210, 252].map((p) => (
              <line key={`v${p}`} x1={p} y1="0" x2={p} y2="300" />
            ))}
            {[42, 84, 126, 168, 210, 252].map((p) => (
              <line key={`h${p}`} x1="0" y1={p} x2="300" y2={p} />
            ))}
          </g>
          {FIGURES[skillId]}
        </svg>
      )}
    </div>
  );
}
