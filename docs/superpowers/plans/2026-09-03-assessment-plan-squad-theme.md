# Assessment Plan, Squad Management, Dark Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an onboarding assessment that drives a replaced, goal-aware plan generator; a 20-move library with in-plan browse/filter/swap; squad add/remove with status + streak; and a real dark theme with a persisted toggle.

**Architecture:** Three independent slices built in order (1 → 2 → 3), each verified before the next. Slice 1 keeps the `WorkoutPlan` wire format byte-identical so existing consumers are untouched; the generator and catalog are replaced internally. Slice 2 makes a Zustand `squadStore` authoritative in offline mode while TanStack Query stays the read path. Slice 3 keeps the light palette as the token baseline and layers dark overrides.

**Tech Stack:** React 19, Vite 6, TypeScript strict, Tailwind v4 (`@theme`), TanStack Query 5, Zustand 5 (+ `persist`, `immer`), Zod, react-hook-form + `@hookform/resolvers/zod`, react-i18next, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-03-assessment-plan-squad-theme-design.md`

## Global Constraints

- Feature-internal folders: `api/ model/ lib/ ui/ i18n/` only. Zustand stores live in `model/`. Routes live in `src/app/routes/`.
- Architecture boundary (ESLint `import/no-restricted-paths`): `app → features → shared`, never sideways. Cross-feature imports go through the target feature's `index.ts` barrel only.
- Every new user-facing string ships in **both** `en` and `ar` (real translation, not a copy). Zod messages are i18n keys (`'plan:error.weight_range'`), resolved by `Field` via `t()`.
- Tailwind: logical properties only (`ps-`, `pe-`, `text-start`, `border-s`) — never `pl-`, `text-left`, `border-l`.
- Numbers render via `formatNumber` / `formatPercent` from `@/shared/lib/formatters`.
- The `WorkoutPlan` / `PlanDay` / `PlannedExercise` shapes do **not** change. `plan.types.ts`, `plan.schema.ts`, `progressionTable.ts`, `splitTemplates.ts` are **not** modified.
- Branded IDs via `asId` / `nowIso` from `@/shared/types/ids`. `Result<T,E>` / `Ok` / `Err` from `@/shared/types/result`.
- Exercise catalog id scheme: `00000000-0000-4000-9000-0000000000NN` (NN zero-padded).
- Verification gate per task: `npm run typecheck` clean, `npm run lint` clean, `npm test` green, and for the last task of each slice also `npm run build` + a manual browser pass.

---

## SLICE 1 — Assessment + Plan

### Task 1: Movement library (`moves.ts`)

**Files:**
- Create: `src/features/plan/lib/moves.ts`
- Create: `src/features/plan/lib/moves.test.ts`
- Delete: `src/features/plan/lib/exerciseCatalog.ts`
- Modify: `src/features/plan/lib/exerciseName.ts` (import `exerciseById` from `./moves` instead of `./exerciseCatalog`)

**Interfaces:**
- Produces:
  - `type MuscleGroup = 'push' | 'pull' | 'legs' | 'core'`
  - `interface Move { id: ExerciseId; slug: string; nameKey: string; muscleGroup: MuscleGroup; measure: 'reps'|'hold'; difficulty: FitnessLevel; defaultSets: number; defaultReps: number|null; defaultHoldSeconds: number|null; restSeconds: number; cueKeys: readonly [string,string,string]; regressionOf: ExerciseId|null }`
  - `const MOVES: readonly Move[]` (20 entries — the 19 current slugs + `decline_push_up` id 6, push/reps/intermediate/regressionOf id 1)
  - `const moveById: Map<ExerciseId, Move>`, `const moveBySlug: Map<string, Move>`
  - `const EXERCISES: Exercise[]`, `const exerciseById: Map<ExerciseId, Exercise>`, `const exerciseBySlug: Map<string, Exercise>` — derived from `MOVES`, exact current `Exercise` shape (`{id, slug, pattern, measure, minLevel, regressionOf}`; `pattern = muscleGroup`, `minLevel = difficulty`)

**Steps:**
- [ ] **Step 1: Write failing test** `src/features/plan/lib/moves.test.ts`:
  - `MOVES` has length 20; all `id` values unique; all `slug` values unique.
  - Every `regressionOf` is either `null` or present in `moveById`.
  - `exerciseBySlug.get('push_up')` is defined and `.measure === 'reps'`.
  - Every `Move.nameKey === 'plan:exercise.' + slug`; every `cueKeys[i] === 'plan:cue.' + slug + '.' + i`.
  - `EXERCISES` length 20 and each entry's `pattern` ∈ push/pull/legs/core.
- [ ] **Step 2: Run** `npx vitest run src/features/plan/lib/moves.test.ts` — expect FAIL (module missing).
- [ ] **Step 3: Implement `moves.ts`.** Define the 20 `Move` objects (values for sets/reps/hold/rest taken from `progressionTable.ts` where the slug appears, otherwise: reps moves `3×10 rest 90`, hold moves `3× 30s rest 60`; `decline_push_up` `3×10 rest 90`). Derive `moveById`, `moveBySlug`, `EXERCISES`, `exerciseById`, `exerciseBySlug`.
- [ ] **Step 4: Update `exerciseName.ts`** import path to `./moves`.
- [ ] **Step 5: Delete `exerciseCatalog.ts`.**
- [ ] **Step 6: Run** `npx vitest run src/features/plan/lib/moves.test.ts` — expect PASS. Then `npm run typecheck` (barrel still imports `exerciseCatalog` — expected to fail here; fixed in Task 6). Run `npx tsc -b --noEmit 2>&1 | grep -v "exerciseCatalog\|index.ts"` to confirm no *other* new errors.
- [ ] **Step 7: Commit** `feat(plan): 20-move library replacing exerciseCatalog`

### Task 2: Assessment model + store

**Files:**
- Create: `src/features/plan/model/assessment.types.ts`
- Create: `src/features/plan/model/assessment.schema.ts`
- Create: `src/features/plan/model/assessmentStore.ts`
- Create: `src/features/plan/model/assessmentStore.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `assessment.types.ts`: `type TrainingGoal = 'strength'|'hypertrophy'|'mastery'|'fat_loss'`; `type BmiCategory = 'underweight'|'normal'|'overweight'|'obese'`; `interface Assessment { goal: TrainingGoal; weightKg: number; heightCm: number; pushUps: number; pullUps: number; dips: number; takenAt: IsoDateTime }`; `interface AssessmentResult { bmi: number; bmiCategory: BmiCategory; tier: FitnessLevel; benchmarkScore: number; daysPerWeek: 3|4|5|6 }`
  - `assessment.schema.ts`: `assessmentInputSchema` (Zod, `Assessment` minus `takenAt`), `type AssessmentInput = z.infer<...>`, `persistedAssessmentSchema` (input fields + `takenAt: z.string().datetime()`)
  - `assessmentStore.ts`: `useAssessmentStore` (Zustand) with state `{ assessment: Assessment | null }`, actions `save(input: AssessmentInput): void`, `clear(): void`; `const selectHasAssessment = (s) => s.assessment !== null`

**Steps:**
- [ ] **Step 1: Write failing test** `assessmentStore.test.ts`:
  - `assessmentInputSchema` rejects `weightKg: 10` with message `'plan:error.weight_range'`; rejects `heightCm: 300` with `'plan:error.height_range'`; rejects `pushUps: -1` with `'plan:error.benchmark_range'`; accepts a valid object.
  - Store: after `save({...valid})`, `getState().assessment` is non-null and `takenAt` is an ISO string; after `clear()`, it's `null`.
- [ ] **Step 2: Run** the test — expect FAIL.
- [ ] **Step 3: Implement** the three files. Ranges: `weightKg` 30–250, `heightCm` 120–230, `pushUps` 0–150, `pullUps` 0–100, `dips` 0–100 (all `.int()` for the three counts). Store uses `persist` (key `ct.assessment`, `version: 1`) + `immer`; `merge` runs `persistedAssessmentSchema.safeParse` and falls back to `{ assessment: null }` on failure. `save` stamps `takenAt: nowIso()`.
- [ ] **Step 4: Run** the test — expect PASS. `npm run lint` on the new files.
- [ ] **Step 5: Commit** `feat(plan): assessment model, schema, persisted store`

### Task 3: Plan generator math (`planGenerator.ts`)

**Files:**
- Create: `src/features/plan/lib/planGenerator.ts`
- Create: `src/features/plan/lib/planGenerator.test.ts`
- Delete: `src/features/plan/lib/generatePlan.ts`
- Delete: `src/features/plan/lib/generatePlan.test.ts`

**Interfaces:**
- Consumes: `MOVES`, `moveBySlug`, `moveById` (Task 1); `Assessment`, `AssessmentResult`, `TrainingGoal`, `BmiCategory` (Task 2); existing `PROGRESSION` (`./progressionTable`), `SPLIT_TEMPLATES` (`./splitTemplates`); `WorkoutPlan`, `PlanDay`, `PlannedExercise` (`../model/plan.types`); `planDaySchema` (`../model/plan.schema`) in tests.
- Produces:
  - `const TIER_WEIGHTS = { pushUps: 1, pullUps: 2, dips: 1.5 } as const`
  - `const TIER_CUTOFFS = { intermediate: 20, advanced: 55 } as const`
  - `const GOAL_DAYS: Record<TrainingGoal, 3|4|5|6>` = `{ strength: 4, hypertrophy: 5, mastery: 4, fat_loss: 5 }`
  - `function computeBmi(weightKg: number, heightCm: number): number` (1 decimal)
  - `function bmiCategory(bmi: number): BmiCategory`
  - `function benchmarkScore(a: Pick<Assessment,'pushUps'|'pullUps'|'dips'>): number`
  - `function assessTier(a: Pick<Assessment,'pushUps'|'pullUps'|'dips'>): FitnessLevel`
  - `function assess(a: Assessment): AssessmentResult`
  - `interface GeneratePlanArgs { userId: UserId; assessment: Assessment; now?: () => string; planId?: string }`
  - `function generatePlan(args: GeneratePlanArgs): WorkoutPlan`
  - `function planFromProfile(args: { userId: UserId; level: FitnessLevel; daysPerWeek: 3|4|5|6; now?: () => string; planId?: string }): WorkoutPlan` (neutral — no goal/BMI pass; used when no assessment exists)

**Steps:**
- [ ] **Step 1: Write failing test** `planGenerator.test.ts`:
  - `computeBmi(80, 180)` ≈ `24.7`; `computeBmi(60, 170)` ≈ `20.8`.
  - `bmiCategory`: `18.4 → underweight`, `18.5 → normal`, `24.9 → normal`, `25 → overweight`, `29.9 → overweight`, `30 → obese`.
  - `benchmarkScore({pushUps:10,pullUps:3,dips:4})` === `10 + 6 + 6` === `22`.
  - `assessTier`: score `19 → beginner`, `20 → intermediate`, `55 → intermediate`, `56 → advanced`.
  - `generatePlan` with a fixed `now` + `planId` and `goal:'strength'`: `days.length === 7`; `daysPerWeek === 4`; every non-`rest` day parses with `planDaySchema` and has `exercises.length >= 1`; `generatedAt` equals the injected value.
  - Same assessment with `goal:'hypertrophy'` vs `goal:'strength'`: for the first exercise of the first training day, strength `targetReps` < hypertrophy `targetReps` and strength `restSeconds` > hypertrophy `restSeconds`.
  - `goal:'fat_loss'`: at least one `core`-pattern exercise appears on a `push` day.
  - assessment with `weightKg:110, heightCm:170` (obese): no `PlannedExercise.targetReps` exceeds 20.
  - `planFromProfile({level:'beginner', daysPerWeek:3})`: 7 days, 3 non-rest.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement `planGenerator.ts`** per spec §1.2 (goal-modifier table, BMI nudge, clamps to `sets 1–10 / reps 1–100 / hold 3–300 / rest 15–300`, integer rounding, fat-loss finisher picks highest `difficulty <= tier` core move from `MOVES` not already in the day: `sets 2`, `targetHoldSeconds 30` or `targetReps 15`, `restSeconds 30`, `noteKey 'plan:cue.finisher'`). Reuse `buildExercises` logic against `PROGRESSION` for the base, mapping slug → `moveBySlug` for ids.
- [ ] **Step 4: Delete** `generatePlan.ts` + `generatePlan.test.ts`.
- [ ] **Step 5: Run** `npx vitest run src/features/plan/lib/planGenerator.test.ts` — expect PASS.
- [ ] **Step 6: Commit** `feat(plan): goal- and BMI-aware plan generator replacing generatePlan`

### Task 4: `planApi` + `useAssessment` + `usePlanEditor`

**Files:**
- Modify: `src/features/plan/api/planApi.ts`
- Create: `src/features/plan/lib/useAssessment.ts`
- Create: `src/features/plan/lib/usePlanEditor.ts`
- Create: `src/features/plan/api/planApi.test.ts`

**Interfaces:**
- Consumes: `generatePlan`, `planFromProfile`, `assess` (Task 3); `persistedAssessmentSchema` (Task 2); `moveById` (Task 1); `queryKeys` (`@/shared/config/queryKeys`); `useAuthStore` (`@/features/auth`); `toast` (`@/shared/ui`).
- Produces:
  - `planApi.getCurrent(userId, level, daysPerWeek)` — unchanged signature; internally prefers a stored assessment.
  - `planApi.regenerate(userId, level, daysPerWeek)` — unchanged signature; uses assessment when present.
  - `planApi.savePlan(userId: UserId, plan: WorkoutPlan): Promise<WorkoutPlan>` — NEW.
  - `useAssessment(): { assessment: Assessment|null; result: AssessmentResult|null; save: (input: AssessmentInput) => Promise<void>; clear: () => void }`
  - `usePlanEditor(plan: WorkoutPlan): { draft: WorkoutPlan; isDirty: boolean; swapExercise(dayIndex:number, exerciseId:ExerciseId, next:Move):void; removeExercise(dayIndex:number, exerciseId:ExerciseId):void; addExercise(dayIndex:number, move:Move):void; setSets(dayIndex:number, exerciseId:ExerciseId, sets:number):void; reset():void; save():Promise<void> }`

**Steps:**
- [ ] **Step 1: Write failing test** `planApi.test.ts` (mock `@/shared/lib/supabase` to export `supabase: null`; use a fresh `localStorage` per test via `vi.stubGlobal` or `beforeEach` clear):
  - With no `ct.assessment` and no `ct.plan`: `getCurrent(uId,'beginner',3)` resolves to a 7-day plan and writes `ct.plan`.
  - After writing a valid `ct.assessment` for `goal:'strength'` and clearing `ct.plan`: `regenerate(uId,'beginner',3)` returns a plan with `daysPerWeek === 4` (goal-derived) and `level` equal to the assessed tier.
  - `savePlan(uId, plan)` writes `ct.plan` and returns the same plan; a subsequent `getCurrent` returns the saved plan unchanged.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement.** `planApi`: add `readAssessment()` (localStorage `ct.assessment` → `persistedAssessmentSchema` → `Assessment | null`); `getCurrent` mock branch: cached plan → assessment plan → `planFromProfile`; real branch unchanged except `regenerate` uses assessment. Add `savePlan`. `useAssessment`: wraps `useAssessmentStore`, memoizes `result = assessment && assess(assessment)`, `save` writes store then `await planApi.regenerate(...)` then `queryClient.setQueryData(queryKeys.plan.current(userId), plan)`; `clear` clears store + `queryClient.removeQueries({ queryKey: queryKeys.plan.current(userId) })`. `usePlanEditor`: `immer`-based draft state, `isDirty` via structural compare to the input plan, `save` calls `planApi.savePlan` + `queryClient.setQueryData` + `toast({ message: 'plan:toast.plan_saved', tone: 'banked' })` (component resolves — pass the key; **actually** `toast` needs a resolved string: the hook takes an optional `t` or the calling component owns the toast — mirror Task 11 decision: the hook does NOT toast; `PlanEditor` toasts). Revise: `usePlanEditor.save` returns `Promise<void>` and does the persistence + query update only; `PlanEditor` shows the toast.
- [ ] **Step 4: Run** — expect PASS. `npm run typecheck` (barrel still broken — Task 6).
- [ ] **Step 5: Commit** `feat(plan): assessment-aware planApi, useAssessment, usePlanEditor`

### Task 5: Plan UI components

**Files:**
- Create: `src/features/plan/ui/GoalPicker.tsx`
- Create: `src/features/plan/ui/PlanGeneratorForm.tsx`
- Create: `src/features/plan/ui/BmiCard.tsx`
- Create: `src/features/plan/ui/MoveCard.tsx`
- Create: `src/features/plan/ui/ExerciseLibrarySheet.tsx`
- Create: `src/features/plan/ui/PlanLibraryButton.tsx`
- Create: `src/features/plan/ui/PlanEditor.tsx`

**Interfaces:**
- Consumes: `useAssessment`, `usePlanEditor` (Task 4); `MOVES`, `moveById`, `moveBySlug`, `Move`, `MuscleGroup` (Task 1); `assessmentInputSchema`, `AssessmentInput`, `TrainingGoal`, `AssessmentResult`, `BmiCategory` (Task 2); `exerciseName` (existing); shared UI `Button`, `Field`, `TextInput`, `NumberStepper`, `Sheet`, `Card`, `Tag`, `toast`; `formatNumber`.
- Produces (all default-free named exports): `GoalPicker`, `PlanGeneratorForm`, `BmiCard`, `MoveCard`, `ExerciseLibrarySheet`, `PlanLibraryButton`, `PlanEditor`.
  - `GoalPicker: (props: { value: TrainingGoal; onChange: (g: TrainingGoal) => void }) => JSX.Element`
  - `PlanGeneratorForm: () => JSX.Element` (self-contained; calls `useAssessment().save`)
  - `BmiCard: (props: { result: AssessmentResult; onRetake: () => void }) => JSX.Element`
  - `MoveCard: (props: { move: Move; onPick?: (m: Move) => void }) => JSX.Element`
  - `ExerciseLibrarySheet: (props: { open: boolean; onClose: () => void; onPick?: (m: Move) => void; lockGroup?: MuscleGroup }) => JSX.Element`
  - `PlanLibraryButton: () => JSX.Element`
  - `PlanEditor: (props: { plan: WorkoutPlan; onDone: () => void }) => JSX.Element`

**Steps:**
- [ ] **Step 1:** No unit tests for presentational components (project has none; covered by the manual pass at end of slice). Skip straight to implementation.
- [ ] **Step 2: Implement `GoalPicker`** — copy `LevelPicker` structure; `role="radiogroup"`, 4 buttons, `aria-checked`, tokens, `text-start`, 48px min.
- [ ] **Step 3: Implement `PlanGeneratorForm`** — `useForm<AssessmentInput>({ resolver: zodResolver(assessmentInputSchema), defaultValues: { goal: 'strength', weightKg: 75, heightCm: 175, pushUps: 15, pullUps: 5, dips: 8 } })`. `GoalPicker` bound via `watch`/`setValue`. Weight + height as `Field`+`TextInput` `inputMode="decimal"` with `register(..., { valueAsNumber: true })`. Push/pull/dip via `NumberStepper` bound to `setValue`. Live BMI strip using `computeBmi`+`bmiCategory` on `watch('weightKg')`/`watch('heightCm')`. Submit → `await save(v)` → `toast({ message: t('plan:toast.plan_ready'), tone: 'banked' })`.
- [ ] **Step 4: Implement `BmiCard`** — `Card`; BMI `formatNumber(result.bmi, locale)` with 1 decimal via a local `formatDecimal` (Intl with `maximumFractionDigits: 1`, `numberingSystem: 'latn'`); category `Tag` (tone map: normal→banked, underweight/overweight→neutral, obese→`className` danger tint); tier `Tag tone="effort"`; goal label; score. "Retake" `Button variant="quiet"` → `onRetake`.
- [ ] **Step 5: Implement `MoveCard`** — `Card`; name via `t(move.nameKey)`; `Tag` for `muscle.${group}` + `difficulty.${level}`; prescription line; 3 cues from `move.cueKeys.map(t)`; if `onPick`, a "Choose" `Button size="md"`.
- [ ] **Step 6: Implement `ExerciseLibrarySheet`** — `Sheet`; two filter rows (group, difficulty) as button groups; `MOVES` filtered by `lockGroup ?? groupFilter` and difficulty; list of `MoveCard`; picking calls `onPick?.(m)` then `onClose()`.
- [ ] **Step 7: Implement `PlanLibraryButton`** — a `Button variant="quiet" size="md"` that opens `ExerciseLibrarySheet` (browse-only) via local `useState`.
- [ ] **Step 8: Implement `PlanEditor`** — `usePlanEditor(plan)`; render 7 `PlanDayCard`-like blocks (reuse spacing, but editable): per exercise show name + `sets × reps/hold`, a `NumberStepper` (min 1 max 10) for sets, "Swap" button (opens `ExerciseLibrarySheet` with `lockGroup` = that exercise's `moveById.get(id)?.muscleGroup` and `onPick` → `swapExercise`), "Remove". Per non-rest day an "Add exercise" opening the sheet with `onPick` → `addExercise`. Footer: "Save plan" (`disabled={!isDirty}`) → `await save()` then `toast({ message: t('plan:toast.plan_saved'), tone: 'banked' })` then `onDone()`; "Discard" → `reset()` + `onDone()`.
- [ ] **Step 9: Run** `npm run lint` on the new files; fix logical-property / unused-var issues.
- [ ] **Step 10: Commit** `feat(plan): assessment form, BMI card, library sheet, plan editor UI`

### Task 6: Barrel + route wiring

**Files:**
- Modify: `src/features/plan/index.ts`
- Modify: `src/app/routes/today.route.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces (barrel additions): `generatePlan`, `planFromProfile`, `assess`, `computeBmi`, `bmiCategory`, `assessTier`, `benchmarkScore` (from `./lib/planGenerator`); `MOVES`, `moveById`, `moveBySlug` (from `./lib/moves`); `useAssessment`, `usePlanEditor`; `PlanGeneratorForm`, `BmiCard`, `ExerciseLibrarySheet`, `PlanLibraryButton`, `GoalPicker`, `MoveCard`, `PlanEditor`; types `Assessment`, `AssessmentResult`, `AssessmentInput`, `TrainingGoal`, `BmiCategory`, `Move`, `MuscleGroup`; `assessmentInputSchema`. Keep `EXERCISES`, `exerciseById`, `exerciseBySlug` exports (now sourced from `./lib/moves`). Remove the `./lib/generatePlan` and `./lib/exerciseCatalog` export lines.

**Steps:**
- [ ] **Step 1: Update `index.ts`** — swap the two removed source paths, add all new exports.
- [ ] **Step 2: Update `today.route.tsx`** — add `const { assessment, result } = useAssessment();` and `const [editing, setEditing] = useState(false);`. Early return `<PlanGeneratorForm />` when `!assessment || !result`. Otherwise render `<BmiCard result={result} onRetake={() => { clear(); }} />` (from `useAssessment`), then the plan section header with an "Edit plan" toggle button + `<PlanLibraryButton />`, then `editing ? <PlanEditor plan={plan!} onDone={() => setEditing(false)} /> : <PlanWeekView onStartDay={startDay} />`. Keep the resume banner and squad section as-is.
- [ ] **Step 3: Run** `npm run typecheck` — expect clean now. `npm run lint` — expect clean (watch the boundary rule: `today.route` importing `@/features/plan` barrel is fine; `PlanEditor` importing shared UI is fine).
- [ ] **Step 4: Run** `npm test` — all green.
- [ ] **Step 5: Commit** `feat(plan): wire assessment + editor into the Today route`

### Task 7: Plan i18n

**Files:**
- Modify: `src/features/plan/i18n/en.json`
- Modify: `src/features/plan/i18n/ar.json`

**Steps:**
- [ ] **Step 1: Add keys to `en.json`** (see spec §1.8 for the full list): `goal.*` (+ `label`, `*_hint`), `assessment.*`, `field.weight`/`weight_hint`/`height`/`height_hint`/`push_ups`/`pull_ups`/`dips`, `bmi.label`/`category.*`/`tier_label`/`score_label`, `tier.{beginner,intermediate,advanced}`, `library.*`, `muscle.*`, `difficulty.*`, `editor.*`, `cue.finisher`, `cue.<slug>.{0,1,2}` for all 20 slugs, `exercise.decline_push_up`, `toast.{plan_ready,plan_saved,plan_regenerated,assessment_cleared}`, `error.{weight_range,height_range,benchmark_range}`.
- [ ] **Step 2: Add the same keys to `ar.json`** with real Arabic translations.
- [ ] **Step 3: Verify** both files are valid JSON: `node -e "JSON.parse(require('fs').readFileSync('src/features/plan/i18n/en.json'));JSON.parse(require('fs').readFileSync('src/features/plan/i18n/ar.json'))"`.
- [ ] **Step 4: Run** `npm run typecheck` (JSON imports typed) + `npm run build`.
- [ ] **Step 5: Commit** `feat(plan): en + ar strings for assessment, library, editor`

### Task 8: Slice 1 verification

- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `npm test` green (`moves`, `assessmentStore`, `planGenerator`, `planApi`).
- [ ] `npm run build` succeeds.
- [ ] Manual: `npm run dev` → `/today` shows the assessment form on a fresh profile (clear `localStorage`); submitting generates a plan; BMI card shows correct BMI + category + tier; "Edit plan" → swap an exercise (same muscle group only), change sets, Save → toast, reload → persisted; "Retake assessment" → form again; library button opens browsable/filterable list. Toggle `ar` → RTL layout holds, digits Western.
- [ ] Commit any fixes: `fix(plan): slice 1 verification adjustments` (only if needed).

---

## SLICE 2 — Squad management

### Task 9: `squadMock` helpers + `squad.types` + `squad.schema`

**Files:**
- Create: `src/features/social/lib/squadMock.ts`
- Create: `src/features/social/lib/squadMock.test.ts`
- Modify: `src/features/social/model/squad.types.ts`
- Modify: `src/features/social/model/squad.schema.ts`

**Interfaces:**
- Produces:
  - `squad.types.ts`: `type SquadMemberStatus = 'active' | 'resting'`; `SquadMember` gains `status: SquadMemberStatus` and `streak: number`.
  - `squad.schema.ts`: `addMemberSchema = z.object({ handle: z.string().trim().min(2,'social:error.handle_short').max(24,'social:error.handle_long').regex(/^[a-z0-9_.-]+$/i,'social:error.handle_chars') })`; `type AddMemberInput = z.infer<...>`.
  - `squadMock.ts`: `uuidFromHandle(handle: string): string` (deterministic v4-shaped: hash handle → hex, format `xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx`); `syntheticStanding(handle: string): { status: SquadMemberStatus; streak: number }` (seeded from the same hash: `streak` 0–21, `status` `active` when `hash % 3 !== 0` else `resting`).

**Steps:**
- [ ] **Step 1: Write failing test** `squadMock.test.ts`: `uuidFromHandle('layla')` matches `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/` and is stable across calls; two different handles give different ids; `syntheticStanding('sami')` returns the same object on repeat calls and `streak` ∈ [0,21]; `addMemberSchema` rejects `'a'` (`handle_short`), `'x'.repeat(25)` (`handle_long`), `'bad name!'` (`handle_chars`), accepts `'coach_omar'`.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement.** Hash: a small FNV-1a over the handle's code points → unsigned 32-bit; expand to 16 bytes by rehashing with a counter; format as the UUID string. `squad.types.ts`: add the two fields + the status type. `squad.schema.ts`: add `addMemberSchema`.
- [ ] **Step 4:** Fix every existing `SquadMember` literal that now lacks `status`/`streak`: `squadApi.ts` `MOCK_SQUAD` members (add `status: 'active', streak: <n>`), and the `mine()` real-mode `.map` (add `status: 'active', streak: 0`). This keeps `typecheck` green.
- [ ] **Step 5: Run** the test + `npm run typecheck` — expect PASS/clean.
- [ ] **Step 6: Commit** `feat(social): squad member status + streak, addMember schema, mock helpers`

### Task 10: `squadStore`

**Files:**
- Create: `src/features/social/model/squadStore.ts`
- Create: `src/features/social/model/squadStore.test.ts`

**Interfaces:**
- Consumes: `uuidFromHandle`, `syntheticStanding` (Task 9); `SQUAD_MAX_MEMBERS`, `SquadMember` (`./squad.types`); `Result`/`Ok`/`Err`; `asId`/`nowIso`.
- Produces:
  - `type SquadError = 'squad_full' | 'duplicate' | 'cannot_remove_owner' | 'not_found'`
  - `useSquadStore` (Zustand + persist key `ct.squad` v1 + immer) state `{ squadName: string; members: SquadMember[] }`
  - actions `addMember(handle: string): Result<SquadMember, SquadError>`, `removeMember(userId: UserId): Result<void, SquadError>`, `reset(): void`
  - `const SQUAD_SEED: SquadMember[]` (Omer owner + Layla + Sami, ids matching the current `MOCK_SQUAD`, `status`/`streak` from `syntheticStanding` of their names)
  - selectors `selectMembers`, `selectMemberCount`

**Steps:**
- [ ] **Step 1: Write failing test** `squadStore.test.ts` (clear `localStorage` in `beforeEach`; call `useSquadStore.getState().reset()`):
  - Seed has 3 members, one `role: 'owner'`.
  - `addMember('nina')` → `ok: true`, members length 4, new member `role: 'member'`, has `status` + `streak`.
  - A second `addMember('bruno')` → `ok: false, error: 'squad_full'`.
  - After `reset()`, `addMember('nina')` twice → second is `ok: false, error: 'duplicate'`.
  - `removeMember(ownerId)` → `ok: false, error: 'cannot_remove_owner'`.
  - `removeMember(<nina's id>)` after adding → `ok: true`, length back to 3.
  - `removeMember(asId('unknown'))` → `ok: false, error: 'not_found'`.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement.** `merge` guarded by a `persistedSquadSchema` (`squadName: string`, `members: array` of a loose member shape incl. `status`/`streak`), fallback to `{ squadName: 'Bar Brothers', members: SQUAD_SEED }`. `addMember`: normalize `handle.trim().toLowerCase()` for identity, keep original for `displayName`; check cap, check duplicate by `uuidFromHandle`; build member; push; return `Ok(member)`. `removeMember`: find by id; not found → `Err('not_found')`; `role === 'owner'` → `Err('cannot_remove_owner')`; splice; `Ok(undefined)`.
- [ ] **Step 4: Run** — expect PASS. `npm run lint`.
- [ ] **Step 5: Commit** `feat(social): squadStore with add/remove and offline persistence`

### Task 11: `squadApi` delegation + `useSquad` mutations

**Files:**
- Modify: `src/features/social/api/squadApi.ts`
- Modify: `src/features/social/lib/useSquad.ts`
- Modify: `src/features/social/api/squadApi.test.ts` (create if absent)

**Interfaces:**
- Consumes: `useSquadStore` (Task 10); `addMemberSchema`, `AddMemberInput` (Task 9); `queryKeys`.
- Produces:
  - `squadApi.addMember(input: AddMemberInput): Promise<SquadMember>` — mock: delegates to `useSquadStore.getState().addMember(input.handle)`, throws `new Error('social:error.' + err.error)` on failure; real: profile lookup + `squad_members` insert (catch `SQUAD_FULL` → throw `'social:error.squad_full'`, no profile → throw `'social:error.handle_not_found'`).
  - `squadApi.removeMember(userId: UserId): Promise<void>` — mock: delegates; real: delete row scoped to current squad.
  - `squadApi.mine()` — mock branch now returns `{ id: MOCK_SQUAD.id, name: getState().squadName, createdAt: MOCK_SQUAD.createdAt, members: getState().members }`.
  - `useSquad.ts`: `useAddMember()` and `useRemoveMember()` — each a `useMutation` calling the api, `onSettled` invalidates `queryKeys.squad.mine()`. No toasts in the hooks.
- Later tasks rely on: `useAddMember().mutate(input, { onSuccess, onError })` and `useRemoveMember().mutate(userId, { onSuccess, onError })`.

**Steps:**
- [ ] **Step 1: Write failing test** `squadApi.test.ts` (mock `supabase: null`, clear `localStorage`, `useSquadStore.getState().reset()` in `beforeEach`):
  - `await squadApi.mine()` → 3 members.
  - `await squadApi.addMember({ handle: 'nina' })` → resolves with a member; `mine()` now 4.
  - Filling to cap then `addMember` → rejects with `Error` whose `message === 'social:error.squad_full'`.
  - `await squadApi.removeMember(<nina id>)` → `mine()` back to 3.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement** the api changes + the two hooks.
- [ ] **Step 4: Run** — expect PASS. `npm run typecheck`.
- [ ] **Step 5: Commit** `feat(social): squadApi add/remove delegation + useSquad mutations`

### Task 12: Squad UI + route + barrel + i18n

**Files:**
- Create: `src/features/social/ui/MemberRow.tsx`
- Create: `src/features/social/ui/SquadManager.tsx`
- Modify: `src/features/social/index.ts`
- Modify: `src/app/routes/squad.route.tsx`
- Modify: `src/features/social/i18n/en.json`
- Modify: `src/features/social/i18n/ar.json`

**Interfaces:**
- Consumes: `useSquad`, `useAddMember`, `useRemoveMember` (Task 11); `addMemberSchema`, `AddMemberInput`, `SquadMember`, `SquadMemberStatus`, `SQUAD_MAX_MEMBERS` (Tasks 9–10); `useAuthStore` (for current user id — to hide self-remove); shared UI `Card`, `Field`, `TextInput`, `Button`, `Tag`, `toast`; `formatNumber`.
- Produces: `MemberRow: (props: { member: SquadMember; canRemove: boolean; onRemove: (id: UserId) => void }) => JSX.Element`; `SquadManager: () => JSX.Element`. Barrel adds: `SquadManager`, `MemberRow`, `useAddMember`, `useRemoveMember`, `useSquadStore`, `addMemberSchema`, `AddMemberInput`, `SquadMemberStatus`.

**Steps:**
- [ ] **Step 1: Implement `MemberRow`** — flex row: avatar initial (`grid place-items-center rounded-full bg-[var(--color-effort)] text-white`), `displayName`, `status` `Tag` (`active`→`tone="banked"`, `resting`→`tone="neutral"`, label `t('social:status.'+status)`), streak `🔥 {formatNumber(streak, locale)}` when `streak > 0`, owner `Tag` when `role==='owner'`; trailing "Remove" `Button variant="quiet" size="md"` rendered only when `canRemove`. Confirm inline: first click sets local `confirming`, second click within the row calls `onRemove`.
- [ ] **Step 2: Implement `SquadManager`** — `Card`; header `t('social:manage.title')` + `Tag tone="squad"` count `{members.length}/{SQUAD_MAX_MEMBERS}`; `members.map` → `MemberRow` with `canRemove={member.role !== 'owner' && member.userId !== currentUserId}` and `onRemove` = `removeMember.mutate(id, { onSuccess: () => toast({ message: t('social:toast.member_removed'), tone: 'default' }), onError: (e) => toast({ message: t(e.message), tone: 'danger' }) })`. Add form: `useForm<AddMemberInput>({ resolver: zodResolver(addMemberSchema) })`, `Field` + `TextInput` (`placeholder={t('social:add.placeholder')}`) + `Button size="lg" block type="submit"`; disabled + hint `t('social:add.full')` when `members.length >= SQUAD_MAX_MEMBERS`; submit → `addMember.mutate(v, { onSuccess: (m) => { reset(); toast({ message: t('social:toast.member_added', { name: m.displayName }), tone: 'banked' }); }, onError: (e) => toast({ message: t(e.message), tone: 'danger' }) })`.
- [ ] **Step 3: Update `squad.route.tsx`** — insert `<SquadManager />` between `<SquadBar … />` and the invite `Button`.
- [ ] **Step 4: Update `index.ts`** barrel.
- [ ] **Step 5: Add i18n** to `en.json` + `ar.json` (spec §2.9): `manage.title`, `add.{label,placeholder,hint,submit,full}`, `status.{active,resting}`, `streak_label`, `action.remove`, `remove.confirm`, `toast.{member_added,member_removed}`, `error.{handle_short,handle_long,handle_chars,handle_not_found,duplicate,cannot_remove_owner,not_found}`. Real Arabic. (`error.squad_full` already exists.)
- [ ] **Step 6: Run** `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- [ ] **Step 7: Commit** `feat(social): squad manager UI with add/remove, status, streak`

### Task 13: Slice 2 verification

- [ ] typecheck / lint / test / build all clean.
- [ ] Manual: `/squad` lists members with status badges + streaks; add "nina" → toast, appears, count `4/4`, form disables at cap; remove a member → confirm → toast, count drops; reload → changes persisted (`ct.squad`); `ar` → RTL holds. Owner has no remove button.
- [ ] Commit fixes if needed.

---

## SLICE 3 — Dark theme

### Task 14: Tokens + theme store + `useApplyTheme`

**Files:**
- Modify: `src/styles/tokens.css`
- Create: `src/shared/lib/theme.ts`
- Create: `src/shared/lib/theme.test.ts`

**Interfaces:**
- Produces:
  - `tokens.css`: adds `--color-hover` + `--color-hover-strong` to `@theme`; appends `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) { …dark values… } }` and `:root[data-theme='dark'] { …same… }`.
  - `theme.ts`: `type ThemeMode = 'light' | 'dark' | 'system'`; `useThemeStore` (Zustand + persist key `ct.theme` v1) state `{ mode: ThemeMode }` + action `setMode(m: ThemeMode): void`; `function resolveTheme(mode: ThemeMode): 'light' | 'dark'` (reads `matchMedia` for `system`); `function useApplyTheme(): void`.

**Steps:**
- [ ] **Step 1: Write failing test** `theme.test.ts` (jsdom; stub `window.matchMedia`): `useThemeStore.getState().mode` defaults to `'system'`; `setMode('dark')` updates it; `resolveTheme('light') === 'light'`; `resolveTheme('system')` follows the stubbed `matches`.
- [ ] **Step 2: Run** — expect FAIL.
- [ ] **Step 3: Implement `theme.ts`.** `useApplyTheme`: `useEffect` on `mode` → if `mode === 'system'` remove `document.documentElement.dataset.theme` else set it to `mode`; set `<meta name="theme-color">` content to the computed `getComputedStyle(document.documentElement).getPropertyValue('--color-surface')`; when `system`, subscribe to `matchMedia('(prefers-color-scheme: dark)')` `change` to re-run the meta update; cleanup removes the listener.
- [ ] **Step 4: Implement `tokens.css`** dark blocks per spec §3.1 (surface `#0f1214`, raised `#171b1e`, ink `#e7ebe9`, steel `#8a96a0`, line `#2b3236`, effort `#4f7cff`, effort-ink `#b9c9ff`, squad `#f0b13d`, banked `#3fae87`, danger `#e2564d`, hover `rgba(255,255,255,0.06)`, hover-strong `rgba(255,255,255,0.12)`).
- [ ] **Step 5: Run** the test — expect PASS. `npm run build` (Tailwind compiles the CSS).
- [ ] **Step 6: Commit** `feat(theme): dark tokens + persisted theme store`

### Task 15: `ThemeToggle` + shell + providers wiring

**Files:**
- Create: `src/shared/ui/ThemeToggle.tsx`
- Modify: `src/shared/ui/index.ts`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/app/providers.tsx`
- Modify: `src/shared/i18n/common.en.json`
- Modify: `src/shared/i18n/common.ar.json`

**Interfaces:**
- Consumes: `useThemeStore`, `useApplyTheme`, `ThemeMode` (Task 14).
- Produces: `ThemeToggle: () => JSX.Element` (exported from `@/shared/ui`).

**Steps:**
- [ ] **Step 1: Implement `ThemeToggle`** — mirror `LocalePicker`: `inline-flex rounded-full border p-0.5`; 3 buttons `☀` / `⏾` / `A` with `aria-label` from `common:theme.{light,dark,system}`, `role="radiogroup"`, `aria-checked={mode===m}`, active style `bg-[var(--color-ink)] text-[var(--color-raised)]`.
- [ ] **Step 2: Export** from `src/shared/ui/index.ts`.
- [ ] **Step 3: `AppShell.tsx`** — render `<ThemeToggle />` before `<LocalePicker />` in the header cluster.
- [ ] **Step 4: `providers.tsx`** — add a `ThemeProvider` component `{ useApplyTheme(); return <>{children}</>; }` wrapping `children` inside `DirectionProvider` (or as a sibling); keep the existing locale effect untouched.
- [ ] **Step 5: i18n** — add `theme.{light,dark,system,label}` to `common.en.json` + `common.ar.json`.
- [ ] **Step 6: Run** `npm run typecheck`, `npm run lint`, `npm run build`.
- [ ] **Step 7: Commit** `feat(theme): ThemeToggle in the app header, applied on mount`

### Task 16: Shared-primitive dark sweep

**Files:**
- Modify: `src/shared/ui/Button.tsx` (`quiet` `hover:bg-black/5` → `hover:bg-[var(--color-hover)]`)
- Modify: `src/shared/ui/Tag.tsx` (`neutral` `bg-black/5` → `bg-[var(--color-hover)]`; `squad` `text-[var(--color-ink)]` stays)
- Modify: `src/shared/ui/NumberStepper.tsx` (`hover:bg-black/5` → `hover:bg-[var(--color-hover)]`)
- Modify: `src/shared/ui/Skeleton.tsx` (`bg-black/[0.06]` → `bg-[var(--color-hover)]`)
- Modify: `src/shared/ui/Card.tsx` (shadow uses hard rgba of ink — replace with a softer `shadow-[0_1px_2px_rgba(0,0,0,0.20),0_8px_24px_-12px_rgba(0,0,0,0.35)]` that reads acceptably on both, OR keep — decide on visual check; default: keep)
- Modify: `src/shared/ui/Toast.tsx` (`default` tone already token-based; verify only)
- Modify: `src/features/social/ui/SquadBar.tsx` (`bg-black/5` / `hover:bg-black/10` → `bg-[var(--color-hover)]` / `hover:bg-[var(--color-hover-strong)]`)

**Steps:**
- [ ] **Step 1:** Grep for offenders: `rg "black/\[?0" src/` and `rg "bg-white|text-black" src/`. Confirm the list above is complete; add any found.
- [ ] **Step 2:** Apply the replacements. Leave `text-white` where the background is `--color-effort` / `--color-danger` (correct in both themes).
- [ ] **Step 3: Run** `npm run lint`, `npm run build`.
- [ ] **Step 4: Commit** `refactor(ui): route hover/skeleton surfaces through theme tokens`

### Task 17: Slice 3 verification

- [ ] typecheck / lint / test / build all clean.
- [ ] Manual: `npm run dev` → toggle ☀/⏾/A. Dark: `/today` (form, generated plan, editor), `/squad` (manager), `/session`, `/stats` all legible — text contrast, card edges, hover states, focus rings visible. `system` mode follows OS setting; `<meta name="theme-color">` updates. Toggle `ar` in dark → RTL + Western digits hold. Reload → theme persists (`ct.theme`). `prefers-reduced-motion` still honored.
- [ ] Commit fixes if needed.

---

## Self-Review

**Spec coverage:**
- Onboarding form (goal, weight, height, push/pull/dip) → Task 5 Step 3. ✓
- BMI + category → Task 3 (`computeBmi`/`bmiCategory`), Task 5 Step 4 (display). ✓
- Fitness tier from benchmark totals → Task 3 (`benchmarkScore`/`assessTier`). ✓
- Plan generation from tier + BMI + goal → Task 3 (`generatePlan`). ✓
- Browse / filter / customize / swap → Task 5 (`ExerciseLibrarySheet`, `PlanEditor`, `usePlanEditor`). ✓
- 20-move catalog with i18n keys, difficulty, group, default reps/sets, cues → Task 1 + Task 7. ✓
- Squad add by username/ID → Tasks 9–12 (`addMemberSchema`, `squadStore.addMember`, `SquadManager`). ✓
- Squad remove → Tasks 10–12. ✓
- Member list with active status + streak → Task 9 (fields), Task 12 (`MemberRow`). ✓
- Dark aesthetic + tokens → Slice 3. ✓
- Transitions / accessible inputs / status badges / toasts → `Field`/`Tag`/`toast` used throughout Tasks 5 & 12; `transition-colors` already on `Button`. ✓

**Placeholder scan:** Task 5 Step 1 says "no unit tests" — justified (project has zero component tests; manual pass covers it). Task 4 Step 3 contains a mid-step correction about toasts — resolved: `usePlanEditor.save` does persistence only, `PlanEditor` owns the toast (consistent with Task 11 / Task 12). Task 16 Card shadow — decision made explicit (default: keep, revisit on visual check). No `TODO`/`TBD`/"handle edge cases" left.

**Type consistency:** `Move` shape identical in Tasks 1, 3, 4, 5. `AssessmentInput`/`Assessment`/`AssessmentResult` identical Tasks 2–6. `addMember(handle: string)` on the store (Task 10) vs `squadApi.addMember(input: AddMemberInput)` (Task 11) — deliberate: api unwraps `input.handle` before delegating. `Result` uses `.ok`/`.value`/`.error` per `@/shared/types/result` — matches Task 10 tests. `useAddMember`/`useRemoveMember` names consistent Tasks 11–12.
