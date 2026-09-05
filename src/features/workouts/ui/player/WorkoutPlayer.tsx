import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { nowIso } from '@/shared/types/ids';
import { toast } from '@/shared/ui';
import { usePlan } from '@/features/plan';
import { useSessionStore } from '../../model/sessionStore';
import {
  selectActiveRemainingMs,
  selectCurrentStep,
  selectElapsedMs,
  selectRestRemainingMs,
  usePlayerStore,
} from '../../model/playerStore';
import { buildSteps } from '../../lib/playerSteps';
import { usePlayerClock } from '../../lib/usePlayerClock';
import { useSessionSync } from '../../lib/sessionSync';
import { useFinishSession } from '../../lib/useFinishSession';
import type { FinishSessionInput } from '../../model/session.schema';
import { SessionSummary } from '../SessionSummary';
import { PlayerTopBar } from './PlayerTopBar';
import { ActiveExerciseView } from './ActiveExerciseView';
import { RestTimerView } from './RestTimerView';
import { PlayerSheet } from './PlayerSheet';

export interface WorkoutPlayerProps {
  onExit?: () => void;
  onNoSession?: () => void;
}

export function WorkoutPlayer({ onExit, onNoSession }: WorkoutPlayerProps) {
  const { t } = useTranslation(['workouts', 'plan', 'common']);
  const { data: plan } = usePlan();

  const session = useSessionStore((s) => s.session);
  const logSet = useSessionStore((s) => s.logSet);
  const setNotes = useSessionStore((s) => s.setNotes);
  const finishSession = useSessionStore((s) => s.finish);
  const abandon = useSessionStore((s) => s.abandon);

  const status = usePlayerStore((s) => s.status);
  const steps = usePlayerStore((s) => s.steps);
  const stepIndex = usePlayerStore((s) => s.stepIndex);
  const completedSteps = usePlayerStore((s) => s.completedSteps);
  const activeTotalMs = usePlayerStore((s) => s.activeTotalMs);
  const restTotalMs = usePlayerStore((s) => s.restTotalMs);
  const lastCompleted = usePlayerStore((s) => s.lastCompleted);
  const elapsedMs = usePlayerStore(selectElapsedMs);
  const restRemainingMs = usePlayerStore(selectRestRemainingMs);
  const activeRemainingMs = usePlayerStore(selectActiveRemainingMs);
  const currentStep = usePlayerStore(selectCurrentStep);

  const load = usePlayerStore((s) => s.load);
  const start = usePlayerStore((s) => s.start);
  const completeSet = usePlayerStore((s) => s.completeSet);
  const skipRest = usePlayerStore((s) => s.skipRest);
  const adjustRest = usePlayerStore((s) => s.adjustRest);
  const restartActive = usePlayerStore((s) => s.restartActive);
  const addSet = usePlayerStore((s) => s.addSet);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const reset = usePlayerStore((s) => s.reset);

  const finishMutation = useFinishSession();
  useSessionSync();
  usePlayerClock();

  const [summary, setSummary] = useState<FinishSessionInput | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);

  const day = useMemo(
    () => plan?.days.find((d) => d.dayIndex === session?.planDayIndex) ?? null,
    [plan, session],
  );

  // ── Load the machine once per session ──────────────────────
  const loadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!session || !day || loadedFor.current === session.id) return;
    const built = buildSteps(day);
    if (built.length === 0) return;
    const logged = session.exercises.reduce((n, e) => n + e.sets.length, 0);
    load(built, logged);
    start();
    loadedFor.current = session.id;
  }, [session, day, load, start]);

  // ── Log each completed set into the persistent session ─────
  const loggedKey = useRef<string | null>(null);
  useEffect(() => {
    if (!lastCompleted || loggedKey.current === lastCompleted.key) return;
    loggedKey.current = lastCompleted.key;
    logSet({
      exerciseId: lastCompleted.exerciseId,
      setNumber: lastCompleted.setNumber,
      measure: lastCompleted.measure,
      reps: lastCompleted.reps,
      holdSeconds: lastCompleted.holdSeconds,
      effort: null,
      completedAt: nowIso(),
    });
  }, [lastCompleted, logSet]);

  // ── Finish once the machine completes ─────────────────────
  const finishedRef = useRef(false);
  useEffect(() => {
    if (status !== 'completed' || finishedRef.current) return;
    finishedRef.current = true;
    const result = finishSession();
    if ('error' in result) {
      toast({ message: t(result.error), tone: 'danger' });
      reset();
      onExit?.();
      return;
    }
    setSummary(result.data);
    finishMutation.mutate(result.data);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function quit() {
    abandon();
    reset();
    loadedFor.current = null;
    finishedRef.current = false;
    onExit?.();
  }

  function closeSummary() {
    reset();
    loadedFor.current = null;
    finishedRef.current = false;
    onExit?.();
  }

  const accent = { '--player-accent': '#FF4500' } as CSSProperties;

  if (!session && !summary) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-black px-8 text-center text-white"
        style={accent}
      >
        <p className="text-lg text-[#8E8E93]">{t('player.no_session_title')}</p>
        <button
          type="button"
          onClick={onNoSession}
          className="rounded-xl px-6 py-3 font-bold text-black"
          style={{ backgroundColor: 'var(--player-accent)' }}
        >
          {t('player.no_session_cta')}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black" style={accent}>
      <div className="relative mx-auto flex h-full max-w-md flex-col overflow-hidden bg-black text-white">
        {summary ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
            <h1 className="font-display text-2xl font-bold text-white">
              {t('player.complete_title')}
            </h1>
            <div className="w-full max-w-sm">
              <SessionSummary session={summary} />
            </div>
            <button
              type="button"
              onClick={closeSummary}
              className="w-full max-w-sm rounded-xl py-4 font-bold text-black"
              style={{ backgroundColor: 'var(--player-accent)' }}
            >
              {t('player.close')}
            </button>
          </div>
        ) : (
          <>
            {status === 'resting' && currentStep ? (
              <RestTimerView
                restRemainingMs={restRemainingMs}
                restTotalMs={restTotalMs}
                nextStep={currentStep}
                onAdjust={adjustRest}
                onSkip={skipRest}
              />
            ) : (
              currentStep && (
                <ActiveExerciseView
                  step={currentStep}
                  activeRemainingMs={activeRemainingMs}
                  activeTotalMs={activeTotalMs}
                  paused={status === 'paused'}
                  onComplete={completeSet}
                  onRestart={restartActive}
                  onInfo={() => setInfoOpen(true)}
                />
              )
            )}

            <div className="absolute inset-x-0 top-0 z-20">
              <PlayerTopBar
                elapsedMs={elapsedMs}
                totalSteps={steps.length}
                completedSteps={completedSteps}
                activeIndex={status === 'active' ? stepIndex : -1}
                paused={status === 'paused'}
                onTogglePause={() => (status === 'paused' ? resume() : pause())}
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 bg-black/70 px-4 py-3 backdrop-blur">
              <button
                type="button"
                onClick={() => setJournalOpen(true)}
                className="flex items-center gap-2 py-2 text-sm font-semibold text-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5L14 3.5zM8 12h8v1.5H8zm0 3h8v1.5H8z" />
                </svg>
                {t('player.journal')}
              </button>
              <button
                type="button"
                onClick={() => {
                  addSet();
                  toast({ message: t('player.set_added'), tone: 'default' });
                }}
                className="flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
                </svg>
                {t('player.add_set')}
              </button>
            </div>

            {status === 'paused' && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-black/85">
                <h2 className="font-display text-3xl font-bold text-white">{t('player.paused')}</h2>
                <button
                  type="button"
                  onClick={resume}
                  className="w-52 rounded-xl py-3.5 font-bold text-black"
                  style={{ backgroundColor: 'var(--player-accent)' }}
                >
                  {t('player.resume')}
                </button>
                <button
                  type="button"
                  onClick={quit}
                  className="w-52 rounded-xl border border-white/25 py-3.5 font-semibold text-white"
                >
                  {t('player.quit')}
                </button>
              </div>
            )}

            <PlayerSheet
              open={infoOpen}
              onClose={() => setInfoOpen(false)}
              title={
                currentStep
                  ? t(currentStep.nameKey, { defaultValue: currentStep.slug.replace(/_/g, ' ') })
                  : t('player.exercise_info')
              }
            >
              {currentStep && (
                <ul className="flex flex-col gap-3">
                  {currentStep.cueKeys.map((key, i) => (
                    <li key={key} className="flex gap-3 text-sm text-white/80">
                      <span className="font-numeric font-bold" style={{ color: 'var(--player-accent)' }}>
                        {i + 1}
                      </span>
                      <span>{t(key, { defaultValue: '' })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </PlayerSheet>

            <PlayerSheet
              open={journalOpen}
              onClose={() => setJournalOpen(false)}
              title={t('player.notes_title')}
            >
              <textarea
                defaultValue={session?.notes ?? ''}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder={t('player.notes_placeholder')}
                className="w-full resize-none rounded-xl border border-white/15 bg-black/40 p-3 text-sm text-white placeholder:text-white/40"
              />
              <button
                type="button"
                onClick={() => setJournalOpen(false)}
                className="mt-4 w-full rounded-xl py-3 font-bold text-black"
                style={{ backgroundColor: 'var(--player-accent)' }}
              >
                {t('player.notes_save')}
              </button>
            </PlayerSheet>
          </>
        )}
      </div>
    </div>
  );
}
