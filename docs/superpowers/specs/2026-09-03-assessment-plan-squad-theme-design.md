# Assessment-Driven Plan, Squad Management, Dark Theme — Design

**Date:** 2026-09-03
**Status:** Approved for implementation
**Branch:** `feat/assessment-plan-squad-theme`

## Summary

Three independent slices, delivered in order. Each is shippable on its own.

| Slice | Delivers |
| --- | --- |
| 1. Assessment + Plan | Onboarding/assessment form; BMI + fitness-tier math; goal-driven plan generator that **replaces** the current one; 20-movement library with coaching cues; in-plan browse / filter / swap / customize / save |
| 2. Squad management | `squadStore` (Zustand + persist); add member by username-or-ID; remove member; per-member active status + training streak; feedback toasts |
| 3. Dark theme | Token overrides (light baseline kept); persisted `useTheme` store (`light` / `dark` / `system`); `ThemeToggle` in the app header; sweep of shared UI primitives off hard-coded `black/5` / `white` |

### Delivery

One spec (this document). Implement slice 1 fully and verify, then slice 2, then slice 3.

### Cross-cutting constraints (from brainstorming)

- **Follow repo conventions**, not the literal paths in the original request. Concretely:
  - Feature-internal folders are `api/ model/ lib/ ui/ i18n/`. No `types.ts`, `constants/`, `components/`, or `store/` folders.
  - Zustand stores live in `model/` (e.g. `authStore.ts`, `sessionStore.ts`).
  - Routes live in `src/app/routes/`. There is no `src/routes/`.
- **Architecture rule holds** (`import/no-restricted-paths` in `eslint.config.js`): `app → features → shared`, never sideways; a feature imports another feature only through its `index.ts` barrel. Every new cross-feature import must go through a barrel.
- **All new user-facing strings ship in both `en` and `ar`.** Validation messages are i18n keys returned by Zod schemas (e.g. `'plan:error.weight_range'`), resolved by the `Field` component — never English string literals.
- Use **logical properties** in Tailwind (`ps-`, `pe-`, `text-start`, `border-s`) — never `pl-`, `text-left`, `border-l`.
- Numbers render through `formatNumber` / `formatPercent` from `@/shared/lib/formatters` (forces Western digits even in Arabic).
- **The `WorkoutPlan` wire format does not change.** `plan.types.ts`, `plan.schema.ts`, `progressionTable.ts`, and `splitTemplates.ts` are **not** rewritten. The generator is replaced *internally*; every current consumer (`PlanDayCard`, `PlanWeekView`, `usePlan`, `statsApi`, `aggregateMonthly`) keeps working untouched. The only sanctioned rewrites in the plan feature are `generatePlan.test.ts` → `planGenerator.test.ts` and the `aggregateMonthly` wiring (which only needs the `moves.ts` catalog to keep exporting a compatible `exerciseById`).

---

## Slice 1 — Assessment + Plan (`features/plan`)

### 1.1 Data model

#### `src/features/plan/model/assessment.types.ts` (new)

```ts
export type TrainingGoal = 'strength' | 'hypertrophy' | 'mastery' | 'fat_loss';
export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface Assessment {
  goal: TrainingGoal;
  weightKg: number;   // 30–250
  heightCm: number;   // 120–230
  pushUps: number;    // 0–150  max reps in one set
  pullUps: number;    // 0–100
  dips: number;       // 0–100
  takenAt: IsoDateTime;
}

export interface AssessmentResult {
  bmi: number;                 // 1 decimal
  bmiCategory: BmiCategory;
  tier: FitnessLevel;          // 'beginner' | 'intermediate' | 'advanced'
  benchmarkScore: number;      // weighted total, for display + debugging
  daysPerWeek: 3 | 4 | 5 | 6;  // derived from goal
}
```

`IsoDateTime` from `@/shared/types/ids`; `FitnessLevel` from `@/features/auth`.

#### `src/features/plan/model/assessment.schema.ts` (new)

Zod object mirroring `Assessment` minus `takenAt`, with ranged `.int()` / `.min` / `.max` and i18n-key messages:

- `goal`: `z.enum(['strength','hypertrophy','mastery','fat_loss'])`
- `weightKg`: `z.number().min(30, 'plan:error.weight_range').max(250, 'plan:error.weight_range')`
- `heightCm`: `z.number().min(120, 'plan:error.height_range').max(230, 'plan:error.height_range')`
- `pushUps` / `pullUps` / `dips`: `z.number().int().min(0, 'plan:error.benchmark_range').max(150|100|100, 'plan:error.benchmark_range')`

Export `assessmentInputSchema` and `type AssessmentInput = z.infer<...>`.

#### `src/features/plan/model/assessmentStore.ts` (new)

Zustand + `persist` + `immer`, mirroring `sessionStore`'s shape:

- key: `ct.assessment`, `version: 1`
- `merge` validates the persisted blob with a `persistedAssessmentSchema` (assessment fields + `takenAt`); a corrupt blob falls back to `null`.
- State: `{ assessment: Assessment | null }`
- Actions: `save(input: AssessmentInput): void` (stamps `takenAt: nowIso()`), `clear(): void`
- Selector: `selectHasAssessment = (s) => s.assessment !== null`

This is **localStorage only** — no Supabase column, no migration.

### 1.2 Calculation + generation — `src/features/plan/lib/planGenerator.ts` (new)

Replaces `src/features/plan/lib/generatePlan.ts` (deleted). All functions pure; `Date.now` only via injected `now`.

```ts
export const TIER_WEIGHTS = { pushUps: 1, pullUps: 2, dips: 1.5 } as const;
export const TIER_CUTOFFS = { intermediate: 20, advanced: 55 } as const;

export function computeBmi(weightKg: number, heightCm: number): number;
// weightKg / (heightCm/100)^2, rounded to 1 decimal

export function bmiCategory(bmi: number): BmiCategory;
// <18.5 underweight · <25 normal · <30 overweight · else obese

export function benchmarkScore(a: Pick<Assessment,'pushUps'|'pullUps'|'dips'>): number;
// pushUps*1 + pullUps*2 + dips*1.5

export function assessTier(a: Pick<Assessment,'pushUps'|'pullUps'|'dips'>): FitnessLevel;
// score < 20 → beginner · < 55 → intermediate · else advanced

export function assess(a: Assessment): AssessmentResult;
// bundles computeBmi + bmiCategory + assessTier + benchmarkScore + goalDays(goal)

export interface GeneratePlanArgs {
  userId: UserId;
  assessment: Assessment;
  now?: () => string;
  planId?: string;
}
export function generatePlan(args: GeneratePlanArgs): WorkoutPlan;
```

**`generatePlan` algorithm:**

1. `result = assess(assessment)`.
2. `level = result.tier`, `daysPerWeek = result.daysPerWeek`.
3. Base days from the **existing** `SPLIT_TEMPLATES[daysPerWeek]` and base exercises from the **existing** `PROGRESSION[level][split]` (unchanged files).
4. **Goal-modifier pass** — map each `PlannedExercise` through `GOAL_MODIFIERS[goal]`:

   | Goal | sets Δ | reps ×  | hold ×  | rest Δ | extra |
   | --- | --- | --- | --- | --- | --- |
   | `strength` | +1 (first move of a day only) | ×0.6 (min 3) | ×1.0 | +30s | — |
   | `hypertrophy` | +1 (all) | ×1.15 | ×1.15 | −15s | — |
   | `mastery` | +0 | ×0.8 | ×1.3 | +0 | — |
   | `fat_loss` | +0 | ×1.3 | ×1.2 | −30s (min 30) | append a `core` finisher move on every non-rest, non-core day |

   Clamp to the ranges `plan.schema.ts` already enforces: `sets 1–10`, `targetReps 1–100`, `targetHoldSeconds 3–300`, `restSeconds 15–300`. Round reps/holds to the nearest integer.
5. **BMI nudge** — if `bmiCategory` is `overweight` or `obese`: cap any `targetReps > 20` at 20 and add `+15s` rest (protect joints, keep volume moderate). If `underweight`: `+1` set on pull-pattern moves (encourage mass). Applied after the goal pass, re-clamped.
6. Return a `WorkoutPlan` with `level`, `daysPerWeek`, `generatedAt: now()`, `archivedAt: null`, `days` — **identical shape to today**.

The `fat_loss` finisher: pick the highest `minLevel <= tier` `core` move from `moves.ts` not already in that day, `sets: 2`, `targetHoldSeconds: 30` (or `targetReps: 15` for rep-measured), `restSeconds: 30`, `noteKey: 'plan:cue.finisher'`.

### 1.3 Movement library — `src/features/plan/lib/moves.ts` (new)

Replaces `src/features/plan/lib/exerciseCatalog.ts` (deleted). **Single source of truth**; the DB-shaped exports are derived.

```ts
export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core';

export interface Move {
  id: ExerciseId;
  slug: string;               // stable i18n + stats key
  nameKey: string;            // `plan:exercise.${slug}`
  muscleGroup: MuscleGroup;
  measure: 'reps' | 'hold';
  difficulty: FitnessLevel;
  defaultSets: number;
  defaultReps: number | null;
  defaultHoldSeconds: number | null;
  restSeconds: number;
  cueKeys: [string, string, string];  // `plan:cue.${slug}.${0|1|2}`
  regressionOf: ExerciseId | null;
}

export const MOVES: Move[];                        // 20 entries
export const moveById: Map<ExerciseId, Move>;
export const moveBySlug: Map<string, Move>;

// Backward-compat: exact current `Exercise` shape, derived from MOVES.
export const EXERCISES: Exercise[];
export const exerciseById: Map<ExerciseId, Exercise>;
export const exerciseBySlug: Map<string, Exercise>;
```

`id` helper reuses the current scheme: `00000000-0000-4000-9000-0000000000NN`.

**The 20 moves** (19 carried over verbatim from the current catalog + 1 new):

| # | slug | group | measure | difficulty | regressionOf |
| --- | --- | --- | --- | --- | --- |
| 1 | push_up | push | reps | beginner | — |
| 2 | incline_push_up | push | reps | beginner | 1 |
| 3 | pike_push_up | push | reps | intermediate | 1 |
| 4 | dip | push | reps | intermediate | 1 |
| 5 | pseudo_planche_push_up | push | reps | advanced | 3 |
| 6 | **decline_push_up** *(new)* | push | reps | intermediate | 1 |
| 10 | australian_row | pull | reps | beginner | — |
| 11 | pull_up | pull | reps | intermediate | 10 |
| 12 | chin_up | pull | reps | intermediate | 10 |
| 13 | archer_pull_up | pull | reps | advanced | 11 |
| 20 | bodyweight_squat | legs | reps | beginner | — |
| 21 | split_squat | legs | reps | beginner | 20 |
| 22 | shrimp_squat | legs | reps | intermediate | 21 |
| 23 | pistol_squat | legs | reps | advanced | 22 |
| 24 | nordic_curl | legs | reps | advanced | 21 |
| 30 | plank | core | hold | beginner | — |
| 31 | hollow_hold | core | hold | beginner | 30 |
| 32 | hanging_knee_raise | core | reps | intermediate | 30 |
| 33 | l_sit | core | hold | intermediate | 31 |
| 34 | front_lever_tuck | core | hold | advanced | 33 |

`defaultSets` / `defaultReps` / `defaultHoldSeconds` / `restSeconds` per move come from the values already in `progressionTable.ts` where present, sensible defaults otherwise. Every move gets 3 `cueKeys` with real coaching text in both locales.

### 1.4 API + hooks

#### `src/features/plan/api/planApi.ts` (modified)

- Import `generatePlan` from `../lib/planGenerator`.
- New private helper `readAssessment(): Assessment | null` — reads `localStorage['ct.assessment']`, validates with `persistedAssessmentSchema`, returns `assessment` or `null`. (Reads localStorage directly rather than importing the store, to stay non-React.)
- `getCurrent(userId, level, daysPerWeek)`:
  - mock mode: if a cached `ct.plan` validates, return it; else if an assessment exists → `generatePlan({ userId, assessment })`, cache, return; else fall back to a **profile-based** plan built from a synthetic assessment (`goalless` default: `goal: 'strength'`-neutral modifier of `1.0`… actually use a dedicated `planFromProfile(userId, level, daysPerWeek)` that skips the goal pass). Cache and return.
  - real mode: unchanged (row lookup → `regenerate`), except `regenerate` also uses the assessment when present.
- New `savePlan(userId, plan): Promise<WorkoutPlan>` — persists a user-edited plan. Mock: overwrite `ct.plan`. Real: `update` the active row's `days`. Returns the saved plan.
- `regenerate(userId, level, daysPerWeek)`: if an assessment exists, `generatePlan({ userId, assessment })`; else `planFromProfile(...)`. Rest unchanged.

`usePlan.ts` is **unchanged**.

#### `src/features/plan/lib/useAssessment.ts` (new)

```ts
export function useAssessment(): {
  assessment: Assessment | null;
  result: AssessmentResult | null;   // assess(assessment), memoized, or null
  save: (input: AssessmentInput) => Promise<void>;
  clear: () => void;
};
```

Wraps `assessmentStore` + `assess()`. Uses `useAuthStore` for the user id and `useQueryClient`. `save`: writes the store, `await planApi.regenerate(userId, tier, days)`, then `queryClient.setQueryData(queryKeys.plan.current(userId), plan)`. `clear`: clears the store and `queryClient.removeQueries` for the plan key. The side effects live in the hook so `PlanGeneratorForm` and `BmiCard` stay presentational.

#### `src/features/plan/lib/usePlanEditor.ts` (new)

Local editing state for the plan editor:

```ts
export function usePlanEditor(plan: WorkoutPlan): {
  draft: WorkoutPlan;
  isDirty: boolean;
  swapExercise: (dayIndex: number, exerciseId: ExerciseId, next: Move) => void;
  removeExercise: (dayIndex: number, exerciseId: ExerciseId) => void;
  addExercise: (dayIndex: number, move: Move) => void;
  setSets: (dayIndex: number, exerciseId: ExerciseId, sets: number) => void;
  reset: () => void;
  save: () => Promise<void>;   // planApi.savePlan + toast + query update
};
```

`swapExercise` builds a `PlannedExercise` from the `Move`'s defaults, preserving the swapped-out `sets` count. Uses `immer` for the draft.

### 1.5 UI (`src/features/plan/ui/`)

All new. Compose `@/shared/ui` primitives; tokens only.

| Component | Purpose |
| --- | --- |
| `GoalPicker.tsx` | `radiogroup` of the 4 goals, same pattern as `LevelPicker` (48px targets, `aria-checked`, `text-start`). |
| `PlanGeneratorForm.tsx` | `react-hook-form` + `zodResolver(assessmentInputSchema)`. Fields: `GoalPicker`, weight (`Field` + `TextInput` `inputMode="decimal"`), height, and three benchmark `NumberStepper`s (push-ups / pull-ups / dips). Live `BmiPreview` strip updates as weight/height change. Submit → `useAssessment().save` → toast `plan:toast.plan_ready` → the route re-renders into plan view. |
| `BmiCard.tsx` | Given `AssessmentResult`: BMI value (`formatNumber`, 1 decimal), `bmiCategory` badge (`Tag` tone by category), tier `Tag`, goal label, `benchmarkScore`. "Retake assessment" `Button variant="quiet"` → clears + shows form. |
| `MoveCard.tsx` | One library move: name, `muscleGroup` + `difficulty` badges, default prescription, 3 cues. Optional `onPick` for swap mode. |
| `ExerciseLibrarySheet.tsx` | `Sheet`-hosted browser. Filters: muscle group (all / push / pull / legs / core) + difficulty (all / beginner / intermediate / advanced). Lists `MoveCard`s. In "swap" mode it's opened with a `(move) => void` and a `lockGroup` so only same-group moves are pickable (filter still adjustable). |
| `PlanEditor.tsx` | Wraps `usePlanEditor(plan)`. Renders the 7 days; per non-rest exercise: name, `sets × reps/hold`, a `NumberStepper` for sets, "Swap" (opens `ExerciseLibrarySheet` locked to that group), "Remove". Per day: "Add exercise". Footer: "Save plan" (disabled unless `isDirty`) + "Discard". Save → toast `plan:toast.plan_saved`. |
| `PlanLibraryButton.tsx` | Opens `ExerciseLibrarySheet` in browse-only mode from the route header. |

### 1.6 Route — `src/app/routes/today.route.tsx` (modified)

```
const { assessment, result } = useAssessment();

if (!assessment || !result) → <PlanGeneratorForm />

else:
  <BmiCard result={result} onRetake={...} />
  <section> h1 plan:title
    header row: "Edit plan" toggle + <PlanLibraryButton />
    {editing ? <PlanEditor plan={plan} onDone={...} /> : <PlanWeekView onStartDay={startDay} />}
  </section>
  <section> squad (unchanged <SquadBar />) </section>
  {active-session resume banner — unchanged}
```

`startDay` unchanged. Editing is local route state (`useState`).

### 1.7 Barrel — `src/features/plan/index.ts` (modified)

- Remove: `generatePlan` (from `./lib/generatePlan`), `EXERCISES`/`exerciseById`/`exerciseBySlug` re-export path stays but now from `./lib/moves`.
- Keep: `exerciseName`, `usePlan`, `PlanWeekView`, `PlanDayCard`, `LevelPicker`, `planApi`, `planEn`/`planAr`, all `plan.types` exports.
- Add: `generatePlan`, `assess`, `computeBmi`, `bmiCategory`, `assessTier` from `./lib/planGenerator`; `MOVES`, `moveById`, `moveBySlug` from `./lib/moves`; `useAssessment`, `usePlanEditor`; `PlanGeneratorForm`, `BmiCard`, `ExerciseLibrarySheet`, `PlanEditor`, `GoalPicker`; `assessmentInputSchema` + `AssessmentInput`, `Assessment`, `AssessmentResult`, `TrainingGoal`, `BmiCategory`, `Move`, `MuscleGroup` types.

### 1.8 i18n — `src/features/plan/i18n/{en,ar}.json` (modified)

Add namespaced keys:

- `goal.{strength,hypertrophy,mastery,fat_loss}` + `goal.label` + `goal.{...}_hint`
- `assessment.title`, `assessment.subtitle`, `assessment.submit`, `assessment.retake`
- `field.weight` / `field.weight_hint` (kg), `field.height` / `field.height_hint` (cm), `field.push_ups`, `field.pull_ups`, `field.dips`
- `bmi.label`, `bmi.category.{underweight,normal,overweight,obese}`, `bmi.tier_label`, `bmi.score_label`
- `tier.{beginner,intermediate,advanced}` (short badge form — distinct from the existing `level.*` sentences)
- `library.title`, `library.filter.group`, `library.filter.difficulty`, `library.all`, `library.swap_title`, `muscle.{push,pull,legs,core}`, `difficulty.{beginner,intermediate,advanced}`
- `editor.title`, `editor.swap`, `editor.remove`, `editor.add`, `editor.save`, `editor.discard`, `editor.sets`
- `cue.finisher`, `cue.<slug>.{0,1,2}` for all 20 moves
- `exercise.decline_push_up` (the one new name)
- `toast.plan_ready`, `toast.plan_saved`, `toast.plan_regenerated`, `toast.assessment_cleared`
- `error.weight_range`, `error.height_range`, `error.benchmark_range`

Arabic values are real translations, not copies.

### 1.9 Tests — `src/features/plan/lib/planGenerator.test.ts` (new, replaces `generatePlan.test.ts`)

- `computeBmi`: known pairs (e.g. 80kg / 180cm → 24.7).
- `bmiCategory`: boundary values 18.5, 25, 30.
- `benchmarkScore` / `assessTier`: score 19 → beginner, 20 → intermediate, 55 → intermediate, 56 → advanced.
- `generatePlan`: returns 7 days; `daysPerWeek` matches goal mapping; non-rest days have ≥1 exercise; all `PlannedExercise` values inside `plan.schema.ts` ranges (validate each day with `planDaySchema`); `strength` yields lower reps + higher rest than `hypertrophy` for the same assessment; `fat_loss` adds a core move to push/pull/legs days; `obese` category caps reps at 20; deterministic given injected `now` + `planId`.
- `assess`: end-to-end bundle for one fixture.

### 1.10 Deletions

- `src/features/plan/lib/generatePlan.ts`
- `src/features/plan/lib/generatePlan.test.ts`
- `src/features/plan/lib/exerciseCatalog.ts`

Update the two importers of `exerciseCatalog`: `exerciseName.ts` and the barrel → import from `./moves`. `aggregateMonthly` imports `exerciseById` from the `@/features/plan` barrel — unaffected because the barrel still exports it.

---

## Slice 2 — Squad management (`features/social`)

### 2.1 `src/features/social/model/squadStore.ts` (new)

Zustand + `persist` + `immer`. **Authoritative in offline/mock mode only.**

- key: `ct.squad`, `version: 1`, `merge` guarded by `persistedSquadSchema` (falls back to the seed on corruption).
- Seed on first run: the current `MOCK_SQUAD` three members (Omer/owner, Layla, Sami), each given `status` + `streak` (see 2.2).
- State: `{ squadName: string; members: SquadMember[] }`
- Actions:
  - `addMember(handle: string): Result<SquadMember, SquadError>` — trims/normalizes; rejects if `members.length >= SQUAD_MAX_MEMBERS` (`'squad_full'`), if the handle already maps to a member (`'duplicate'`). Builds a synthetic member: `userId = asId(uuidFromHandle(handle))` (deterministic v4-shaped hash so re-adds are stable), `displayName = handle`, `avatarUrl: null`, `role: 'member'`, `joinedAt: nowIso()`, `status`/`streak` from `syntheticStanding(handle)`.
  - `removeMember(userId: UserId): Result<void, SquadError>` — rejects removing the `owner` (`'cannot_remove_owner'`) or an unknown id (`'not_found'`).
  - `reset()` — back to seed.
- `Result` type from `@/shared/types/result`; `SquadError` union local to the store.
- Selectors: `selectMembers`, `selectMemberCount`.

`uuidFromHandle` / `syntheticStanding`: small pure helpers in `src/features/social/lib/squadMock.ts` (new) — a seeded hash → `status: 'active' | 'resting'` and `streak: 0–21`, deterministic per handle.

### 2.2 `src/features/social/model/squad.types.ts` (modified — additive only)

```ts
export type SquadMemberStatus = 'active' | 'resting';

export interface SquadMember {
  userId: UserId;
  displayName: string;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: IsoDateTime;
  status: SquadMemberStatus;   // NEW
  streak: number;              // NEW — consecutive training days, 0+
}
```

Every producer of `SquadMember` fills the two new fields:
- `squadStore` seed + `addMember` — full behavior (see 2.1). This is the only tested path.
- `squadApi.mine()` **real mode** — fills `status: 'active'` and `streak: 0` as safe constant defaults. Deriving real-mode standing from `workout_sessions` is explicitly out of scope for this slice (see "Out of scope"); the field types are in place so it can be added later without another type change.

### 2.3 `src/features/social/model/squad.schema.ts` (modified)

Add:

```ts
export const addMemberSchema = z.object({
  handle: z.string()
    .trim()
    .min(2, 'social:error.handle_short')
    .max(24, 'social:error.handle_long')
    .regex(/^[a-z0-9_.-]+$/i, 'social:error.handle_chars'),
});
export type AddMemberInput = z.infer<typeof addMemberSchema>;
```

### 2.4 `src/features/social/api/squadApi.ts` (modified)

When `supabase === null`, delegate to `squadStore.getState()`:

- `mine()` → `{ id: MOCK_SQUAD.id, name: squadName, createdAt: MOCK_SQUAD.createdAt, members }`
- `addMember(input: AddMemberInput)` → `squadStore.getState().addMember(input.handle)`; throw on `err` with `new Error('social:error.' + code)` so mutations surface an i18n key.
- `removeMember(userId)` → same pattern.

Real mode:
- `addMember` — `select id from profiles where display_name ilike handle`; if none → `throw new Error('social:error.handle_not_found')`; else `insert into squad_members {squad_id, user_id, role:'member'}` (the DB trigger enforces the cap → catch `SQUAD_FULL` → `social:error.squad_full`).
- `removeMember` — `delete from squad_members where squad_id = <mine> and user_id = <id>`.

Keep `invite`, `leave`, `create` as they are.

### 2.5 `src/features/social/lib/useSquad.ts` (modified)

Add `useAddMember()` and `useRemoveMember()`. Each returns a `useMutation` whose `mutationFn` calls `squadApi.addMember` / `squadApi.removeMember` and whose `onSettled` invalidates `queryKeys.squad.mine()`. The hooks are **`t`-free** — they do not toast. The calling component (`SquadManager`) owns feedback: it has `useTranslation('social')` and passes per-call `onSuccess` / `onError` to `mutate(input, { … })`, resolving `social:toast.member_added` / `social:toast.member_removed` on success and `t(error.message)` (the thrown i18n key) with `tone: 'danger'` on failure. This matches how `useSendNudge` is consumed today.

### 2.6 `src/features/social/ui/` (new)

- `MemberRow.tsx` — avatar initial, `displayName`, `status` badge (`Tag` tone `banked` for `active`, `neutral` for `resting`, label from `social:status.*`), streak `🔥 {formatNumber(streak)}` (hidden when 0), owner `Tag`, trailing "Remove" `Button variant="quiet" size="md"` — **not rendered** for `role === 'owner'` or the current user. Confirm via `Sheet` or a simple inline confirm.
- `SquadManager.tsx` — `Card` with: title + `count/4` `Tag`; `MemberRow` list; add form (`react-hook-form` + `zodResolver(addMemberSchema)`, `Field` + `TextInput` + `Button size="lg" block`), disabled + hint `social:add.full` when at cap; toasts on both actions.

### 2.7 `src/app/routes/squad.route.tsx` (modified)

Insert `<SquadManager />` between `<SquadBar … />` and the invite `Button`. Everything else unchanged.

### 2.8 Barrel — `src/features/social/index.ts` (modified)

Add: `SquadManager`, `MemberRow`, `useAddMember`, `useRemoveMember`, `useSquadStore` (the store, for tests/route), `addMemberSchema` + `AddMemberInput`, `SquadMemberStatus`.

### 2.9 i18n — `src/features/social/i18n/{en,ar}.json` (modified)

Add: `manage.title`, `add.label`, `add.placeholder`, `add.hint`, `add.submit`, `add.full`, `status.active`, `status.resting`, `streak_label`, `action.remove`, `remove.confirm`, `toast.member_added`, `toast.member_removed`, `error.handle_short`, `error.handle_long`, `error.handle_chars`, `error.handle_not_found`, `error.duplicate`, `error.cannot_remove_owner`, `error.not_found`, `error.squad_full` (exists — reuse). Real Arabic.

### 2.10 Tests

`src/features/social/model/squadStore.test.ts` (new) — add up to cap then reject `squad_full`; reject duplicate handle; reject removing owner; deterministic synthetic standing per handle; `reset` restores seed. Pure store, no React.

---

## Slice 3 — Dark theme

### 3.1 `src/styles/tokens.css` (modified)

Keep the `@theme` block as the **light baseline**. Add one new token there: `--color-hover: rgba(0,0,0,0.05);` and `--color-hover-strong: rgba(0,0,0,0.1);`.

Append, after `@theme`:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-surface: #0f1214;
    --color-raised: #171b1e;
    --color-ink: #e7ebe9;   /* light text */
    --color-steel: #8a96a0;
    --color-line: #2b3236;
    --color-effort: #4f7cff;      /* lifted cobalt for contrast on dark */
    --color-effort-ink: #b9c9ff;
    --color-squad: #f0b13d;
    --color-banked: #3fae87;
    --color-danger: #e2564d;
    --color-hover: rgba(255,255,255,0.06);
    --color-hover-strong: rgba(255,255,255,0.12);
  }
}
:root[data-theme='dark'] {
  /* identical block — the toggle wins regardless of OS setting */
}
```

`html`/`body` already read `var(--color-surface)` / `var(--color-ink)` in `globals.css`, so the base flips for free.

### 3.2 `src/shared/lib/theme.ts` (new)

```ts
export type ThemeMode = 'light' | 'dark' | 'system';

export const useThemeStore = create<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>()(
  persist(/* key: ct.theme, version 1 */)
);

/** Applies data-theme to <html> and tracks the OS media query when mode==='system'. */
export function useApplyTheme(): void;
```

`useApplyTheme`: on `mode` change, if `system` → remove `data-theme`, else set it; also updates `<meta name="theme-color">` content to the resolved `--color-surface`. Adds/removes a `matchMedia('(prefers-color-scheme: dark)')` listener only while `system` (so the meta stays right).

This lives in `shared/lib/` (not `config/`) next to `cn.ts` — it's a client-runtime concern like `useDirection`.

### 3.3 `src/shared/ui/ThemeToggle.tsx` (new)

3-way segmented control, visually matched to `LocalePicker` (rounded-full border, 36px targets). Buttons: `☀` (light) / `⏾` (dark) / `A` (system, label `common:theme.system`). `role="radiogroup"`, `aria-checked`. Exported from `src/shared/ui/index.ts`.

### 3.4 `src/app/AppShell.tsx` (modified)

Add `<ThemeToggle />` in the header cluster, before `<LocalePicker />`.

### 3.5 `src/app/providers.tsx` (modified)

Call `useApplyTheme()` inside a small `ThemeProvider` component wrapping `children` (same pattern as `DirectionProvider`).

### 3.6 Shared-primitive sweep

Replace hard-coded near-black/near-white utilities with tokens. Files and changes:

| File | Change |
| --- | --- |
| `shared/ui/Button.tsx` | `quiet` variant `hover:bg-black/5` → `hover:bg-[var(--color-hover)]` |
| `shared/ui/Tag.tsx` | `neutral` tone `bg-black/5` → `bg-[var(--color-hover)]` |
| `shared/ui/NumberStepper.tsx` | `hover:bg-black/5` → `hover:bg-[var(--color-hover)]` |
| `shared/ui/Toast.tsx` | tone classes already token-based — verify `bg-[var(--color-raised)]` contrast; no change expected |
| `shared/ui/Card.tsx` | confirm it uses `--color-raised` / `--color-line` (read first); adjust only if it hard-codes white |
| `shared/ui/Sheet.tsx` | backdrop + panel: ensure panel is `--color-raised`, backdrop `rgba(0,0,0,.5)` (fine on both) |
| `shared/ui/Skeleton.tsx` | shimmer base → `--color-hover` |
| `features/social/ui/SquadBar.tsx` | member chips `bg-black/5` / `hover:bg-black/10` → `--color-hover` / `--color-hover-strong` |
| `features/plan/ui/PlanDayCard.tsx` | uses `text-white` on `--color-effort` (correct — no change); verify no bare white bg |
| `app/AppShell.tsx` | nav bar `bg-[var(--color-raised)]` already; no change |

`text-white` **on** a `--color-effort` background stays — it's correct in both themes.

### 3.7 i18n — `src/shared/i18n/common.{en,ar}.json` (modified)

Add `theme.light`, `theme.dark`, `theme.system`, `theme.label`.

### 3.8 Verification (manual, browser preview)

`npm run dev` → for each of light / dark / system: load `/today` (form + generated + editor), `/squad` (manager add/remove), `/session`, `/stats`; toggle `EN` ↔ `ar` and confirm RTL + Western digits hold; confirm no `prefers-reduced-motion` regressions; check focus rings visible on dark.

---

## Out of scope

- Supabase migrations / columns for the assessment (localStorage only, by decision).
- Real-mode derivation of squad `status` / `streak` from `workout_sessions` (mock mode is fully featured; real mode fills safe defaults).
- Retrofitting every feature screen for dark — the sweep covers shared primitives + the two screens being edited; other screens inherit via tokens and are spot-checked in verification.
- E2E / component test infrastructure (none exists; not added).
- `send-nudge` / push / Realtime changes.

## File inventory

**Slice 1 — new (15):** `model/assessment.types.ts`, `model/assessment.schema.ts`, `model/assessmentStore.ts`, `lib/planGenerator.ts`, `lib/planGenerator.test.ts`, `lib/moves.ts`, `lib/useAssessment.ts`, `lib/usePlanEditor.ts`, `ui/GoalPicker.tsx`, `ui/PlanGeneratorForm.tsx`, `ui/BmiCard.tsx`, `ui/MoveCard.tsx`, `ui/ExerciseLibrarySheet.tsx`, `ui/PlanEditor.tsx`, `ui/PlanLibraryButton.tsx`.
**Slice 1 — modified (6):** `api/planApi.ts`, `lib/exerciseName.ts`, `index.ts`, `i18n/en.json`, `i18n/ar.json`, `app/routes/today.route.tsx`.
**Slice 1 — deleted (3):** `lib/generatePlan.ts`, `lib/generatePlan.test.ts`, `lib/exerciseCatalog.ts`.

**Slice 2 — new (5):** `model/squadStore.ts`, `model/squadStore.test.ts`, `lib/squadMock.ts`, `ui/SquadManager.tsx`, `ui/MemberRow.tsx`.
**Slice 2 — modified (8):** `model/squad.types.ts`, `model/squad.schema.ts`, `api/squadApi.ts`, `lib/useSquad.ts`, `index.ts`, `i18n/en.json`, `i18n/ar.json`, `app/routes/squad.route.tsx`.

**Slice 3 — new (2):** `shared/lib/theme.ts`, `shared/ui/ThemeToggle.tsx`.
**Slice 3 — modified (~11):** `styles/tokens.css`, `shared/ui/index.ts`, `shared/ui/Button.tsx`, `shared/ui/Tag.tsx`, `shared/ui/NumberStepper.tsx`, `shared/ui/Skeleton.tsx`, `shared/ui/Card.tsx`*, `shared/ui/Sheet.tsx`*, `features/social/ui/SquadBar.tsx`, `app/AppShell.tsx`, `app/providers.tsx`, `shared/i18n/common.en.json`, `shared/i18n/common.ar.json`. (* only if they hard-code colors — confirm on read.)

## Verification gates per slice

1. `npm run typecheck` clean.
2. `npm run lint` clean (**including** the architecture boundary rule).
3. `npm test` green (slice 1 adds generator tests; slice 2 adds store tests).
4. `npm run build` succeeds.
5. Manual browser pass per the slice's UI (light+dark, en+ar for slice 3).
