# Exercise demo clips

`ExerciseMedia` (`src/features/workouts/ui/player/ExerciseMedia.tsx`) plays a
looping clip behind the Active Exercise view of the workout player.

Drop a file here named `<slug>.mp4` (the movement slug from
`src/features/plan/lib/moves.ts` — `push_up`, `pull_up`, `dip`, `l_sit`, …) and
add its entry to the `CLIPS` map in `ExerciseMedia.tsx`. Anything missing falls
back to the animated placeholder, so clips can be added incrementally.

Recommended: short (3–6 s) seamless loop, muted, 720×1280 portrait, H.264,
< 1.5 MB each. `.webm` also works if you change the extension in `CLIPS`.
