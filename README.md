# Calisthenics Tracker

Count every rep. Keep the ledger honest.

React 19 + Vite + TypeScript (strict) · Tailwind v4 · TanStack Query · Zustand · Zod · react-i18next · Supabase.

```bash
npm install
```

```bash
npm run dev
```

## It runs without a backend

There are no Supabase credentials in `.env`, and that is the intended default. Every `api/` module
checks `supabase === null` and falls back to a local mock, so the whole app — login, plan generation,
session logging, monthly stats, squads, nudges — is usable offline on first clone.

Sign in with any valid-looking credentials; the form is pre-filled. To point at a real project, copy
`.env.example` to `.env.local` and fill it in — no code changes needed.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Typecheck + production build |
| `npm run typecheck` | `tsc -b` only |
| `npm test` | Vitest — the pure `generatePlan` and `aggregateMonthly` functions |
| `npm run lint` | ESLint, including the architecture boundary rule |

## The architecture rule

> `app → features → shared`. Never sideways.

A feature may import `shared`. A feature may **not** reach into another feature's internals — only its
`index.ts` barrel. Features meet in `app/routes`.

This is enforced, not just documented. `import/no-restricted-paths` in `eslint.config.js` generates a
zone for every ordered pair of features with `except: ['./index.ts']`:

```bash
npx eslint .
```

Importing `@/features/workouts/model/sessionStore` from `features/stats` fails the lint; importing
`@/features/workouts` passes. The barrel is the contract — the inside of a feature can be rewritten
without breaking anything else.

> Note: a `from` glob like `./src/features/!(stats)/!(index.ts)` looks like it does this but only
> matches *direct* children, so `workouts/model/sessionStore` slips through silently. `except` is what
> actually makes it hold.

## Where things live

- `src/app/` — composition root. Providers, router, and the routes where features are combined.
- `src/features/{auth,plan,workouts,social,stats}/` — each owns its `api/ model/ lib/ ui/ i18n/` and a public `index.ts`.
- `src/shared/` — design-system components, i18n plumbing, Supabase client, branded IDs. Knows nothing about features.
- `supabase/` — schema, RLS policies, the `monthly_exercise_totals` aggregate, and the `send-nudge` Edge Function.

## Three decisions worth knowing

**Server data isn't state, it's a cache.** Plans, stats, and the squad roster go through TanStack
Query. Only the active workout session — which ticks dozens of times per session and must survive a
phone lock — lives in Zustand, with `persist` writing to `localStorage` and a Zod schema guarding
rehydration so a corrupt blob can't crash the app.

**Validation messages are i18n keys, not English strings.** Schemas return `'auth:error.email_invalid'`
and the `Field` component calls `t()` on it. This is the thing bilingual apps usually get wrong —
validation silently ships in one language.

**The client never notifies anyone; it asks the server to.** The VAPID private key cannot ship in a
bundle, and only the server knows who is in the squad, who is rate-limited, and who is asleep in
another time zone. `send-nudge` broadcasts over Realtime (app open) *and* Web Push (app closed), and
the receiving client dedupes on the nudge id.

## RTL

Both locales are wired from commit one, because retrofitting RTL is miserable and starting with it is
free. Use logical properties only — `ps-4` not `pl-4`, `text-start` not `text-left`, `border-s` not
`border-l`. Two deliberate exceptions: numerals are forced to Western digits (`numberingSystem: 'latn'`)
even in Arabic, and the rest timer is pinned `dir="ltr"` — text mirrors, a clock doesn't.
