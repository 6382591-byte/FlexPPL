# VEKTR 2.0 — Masterpiece Rebuild

## Product standard

VEKTR must be sleek, clean, simple, functional, trustworthy, and visually consistent with the approved red/black concept. Every feature must remove friction. No decorative controls that do nothing. No fake data. No misleading exercise images. No setup-heavy workflows.

## Non-negotiable preservation

Preserve all existing user data and behavior unless explicitly changed:

- localStorage key compatibility
- workout history
- active workout
- exercise notes
- bodyweight entries
- Home/Travel state
- substitutions and replacement preferences
- progression records
- editable workout dates/history
- PWA offline capability

Use explicit state-version migrations. Never wipe user data during migration.

---

# 1. Architecture cleanup

Split the current monolithic `index.html` without moving to a new framework.

Recommended structure:

```text
index.html
styles.css
js/
  app.js
  state.js
  exercises.js
  programs.js
  workouts.js
  replacements.js
  progression.js
  plate-calculator.js
  progress.js
  history.js
  ui.js
assets/
  exercises/
```

Requirements:

- centralize state loading/saving/migrations
- centralize modal behavior
- centralize icons
- centralize exercise metadata
- centralize program templates
- centralize progression calculations
- keep the app dependency-light and offline-first

---

# 2. Canonical exercise library

Rebuild the exercise library as authoritative data, not regex guesses.

Each record must include:

- `id`
- `displayName`
- `aliases`
- `progressCategory`
- `primaryMuscleGroup`
- `secondaryMuscleGroups`
- `movementFamily`
- `movementVariant`
- `equipment`
- `exerciseType`
- `gymModes`
- `supportsPlateCalculator`
- `imageAsset`
- `validReplacementIds`
- `goodAlternativeIds`
- `fallbackIds`

Fix incorrect current mappings, including:

- Barbell Curl must not use an EZ-bar image
- Seal Row must be represented as a free-weight bench-supported row, not a selectorized machine
- Dumbbell Pullover and Cable Pullover must be distinct exercises
- Rope Pushdown and Bar Pushdown must be distinct exercises
- Pull-Up and Assisted Pull-Up must be distinct exercises
- historical aliases must map safely without merging genuinely different exercises

Progress should use canonical exercise IDs while preserving the historical display name used at the time.

---

# 3. Accurate exercise illustrations

Keep illustrations, but make them accurate and consistent with the approved concept.

Visual style:

- simple monochrome figure/equipment silhouette
- restrained red highlight on the primary muscle or motion path
- dark transparent background
- consistent canvas and proportions
- subtle and secondary to text
- no photos
- no generic unrelated fallback art

Rules:

- exact illustration preferred
- accurate movement-family illustration acceptable only when clearly valid
- if no accurate illustration exists, omit the image rather than show a wrong one
- never reuse a curl pose for a pullover or a seated-calf pose for unrelated movements
- validate every image path exists
- cache all assets in the service worker

Initial scope must cover:

- all exercises in the six PPL workouts
- all top replacement choices
- all More Options choices

Add an executable image audit mapping exercise ID to asset path and file existence.

---

# 4. Smart replacement engine

Use three honest replacement levels:

1. **Closest match** — same movement and primary muscles
2. **Good alternative** — same target with similar stimulus
3. **Fallback** — useful for the muscle, but a different movement

Strictly filter before ranking. Never fill empty slots with unrelated exercises.

Initial modal order:

1. Best replacement
2. Other option
3. Other option
4. More options
5. Cancel

Each card shows:

- accurate image when available
- exercise name
- equipment
- compound/isolation
- one concise reason

Useful reasons:

- Same movement pattern
- Same primary muscle
- Similar stimulus
- Travel-friendly option
- Your usual replacement
- Less-exact fallback

Do not repeat robotic labels such as “Approved exact replacement.”

More Options:

- maximum 8 additional valid choices
- no duplicates
- no unrelated muscles
- no filler
- fewer results when fewer valid options exist

Travel mode:

- prioritize barbell, bench, plate, dumbbell, kettlebell, trap bar, and bodyweight options
- do not assume cable, Smith machine, assisted pull-up machine, bands, or light dumbbells
- Travel equipment preference can reorder valid candidates but must never make an invalid movement valid

Allow after selection:

- Change exercise
- choose a different replacement
- rename displayed exercise
- restore original exercise
- preserve weight, sets, completion status, and notes

Track replacement preference counts quietly and use them as a ranking bonus.

---

# 5. Dual-mode plate calculator

Match the approved compact concept visually.

Only show the calculator for exercises where standard barbell loading is valid.

Do not show it for:

- selectorized machines
- cables
- dumbbells
- kettlebells
- bodyweight
- unknown plate-loaded machines
- Hack Squat / Leg Press without a known starting resistance

Bar options:

- 45 lb
- 35 lb

Plate denominations per side:

- 45
- 35
- 25
- 15
- 10
- 5

## Mode A — Target Weight

User enters target total. App returns:

- plates per side
- total
- nearest lower
- nearest higher

Optimization:

1. exact target
2. fewest individual plates per side
3. larger plates first when plate counts tie

Repeated plates allowed.

## Mode B — Plates Loaded

User taps plates loaded on one side.

Behavior:

- first tap adds one plate
- repeated tap adds another
- show count such as `45 × 2`
- allow removing one plate
- include Clear
- update Per Side and Total instantly
- retain selected bar

Formula:

`total = barWeight + 2 × sum(platesPerSide)`

Switching modes retains bar selection.

Apply Weight writes the calculated total to the exercise.
Close makes no change.
Do not mutate workout weight while the user is only experimenting inside the calculator.
Do not rebuild the entire modal on each keypress or steal focus.

Required tests:

- 95 with 45 bar = 25 per side
- 105 with 45 bar = 25 + 5
- 110 with 45 bar = lower 105 / higher 115
- 135 with 45 bar = 45
- 175 with 45 bar = 45 + 15 + 5
- 180 with 45 bar = lower 175 / higher 185
- 185 with 45 bar = 45 + 25
- 225 with 45 bar = 45 + 45
- 105 with 35 bar = 35
- 185 with 35 bar = 45 + 25 + 5
- blank, negative, decimal, below-bar, and very high targets

---

# 6. Active workout redesign

Match the approved concept more closely.

Use compact hierarchy:

- workout name
- Home/Travel and busy state
- elapsed timer
- date
- exercises

Exercise card:

- exercise name
- optional “Originally” subline
- target summary
- Weight, S1, S2, S3 aligned clearly
- calculator icon only when valid
- Notes
- Can’t do this?
- Skip
- Complete
- order arrows in upper-right

Avoid duplicated information. Do not show a giant target-weight card and then immediately repeat the same value in a large input.

Completed/skipped exercises:

- move to bottom
- collapsed section
- compact summary
- reopenable for editing
- skipped uses muted gray/dim red, not the same color as REDUCE coaching

Support variable set counts in the data model while keeping three sets as the current default UI.

---

# 7. Persistent live workout timer

Add a compact running elapsed timer to the active workout header.

Example:

```text
PULL A                         18:42
Travel · Normal
```

Requirements:

- starts automatically when workout begins
- derives from stored timestamps, not interval accumulation only
- survives navigation, refresh, PWA suspension, and reopening
- shows `MM:SS`, then `H:MM:SS` when needed
- stops when workout is completed
- saves final duration in History
- visually compact

Tap timer to open minimal controls:

- Pause
- Resume
- Adjust start time

For retroactive workout logging:

- editable date
- optional manual duration
- duration may be unknown

Do not add rest timers, lap timers, alarms, or other timer complexity in this release.

---

# 8. Progress redesign

The main Progress screen must be summary-first, not a continuous database dump.

## Top summary

Compact 2-column grid:

- Workouts
- Total volume
- Exercises progressing
- Recent PRs

## Recent highlights

Maximum 3 meaningful entries, such as:

- Bench Press increased to 180
- Barbell Curl rep PR: 65 × 10
- One-Arm Row repeated at 75

## Strength by muscle group

Collapsed categories:

- Chest
- Back
- Shoulders
- Biceps
- Triceps
- Quads
- Hamstrings / Glutes
- Calves
- Core
- Other

Only show categories containing logged exercises.

Category row example:

```text
Back
5 exercises · 2 increasing       ›
```

Expanded category rows:

```text
Barbell Row       135 → 140   green dot   ›
Lat Pulldown      110 → 110   yellow dot  ›
```

Status colors:

- green increase
- yellow repeat
- red reduce
- blue baseline
- gray no recent recommendation

## Exercise detail

Show:

- exercise name
- category
- most recent weight/reps
- next recommendation
- best weight
- estimated 1RM only when appropriate
- up to 6 recent sessions
- simple chart only with at least 2 valid points

No fake data.

## Bodyweight

One compact card on main Progress:

- latest
- change from previous
- last logged date
- View History

Do not show the full bodyweight list on the main screen.

## PRs

Show maximum 3 recent PRs with View All.

Valid PR types:

- highest weight
- most reps at a weight
- estimated 1RM improvement

Do not count skipped/incomplete exercises or zero-pound bodyweight entries as weight PRs.

---

# 9. Progression engine

Replace the current one-session simplistic rule.

Requirements:

- increase when all required working sets meet target
- repeat after a slight miss
- reduce only after at least two meaningful underperformances
- stall suggestion only after at least three sessions without progression
- rep progression for bodyweight or zero-increment exercises
- variable set counts
- manual next-weight override
- canonical exercise tracking
- separate Home/Travel working weights where useful
- preserve template context because the same exercise may use different rep targets in different programs

One bad workout must never trigger a reduction.

---

# 10. History redesign

Keep the list compact.

History row shows:

- workout name
- date
- Home/Travel
- duration
- completed/skipped count

Tapping opens workout detail:

- exercises
- weights/reps
- substitutions
- notes
- progression result
- core
- editing controls

Preserve current editing and deletion.

---

# 11. Core logging

Core must become genuinely loggable.

Before final save:

- Skip
- 5-minute core
- 10-minute core

Show a compact core block with exercises and completion controls.
Store completed core data in History and Progress.
Do not require an ab roller.

---

# 12. Program and split framework

Prepare VEKTR for future programs without shipping unfinished plans.

Separate:

1. Exercise Library
2. Program Template
3. Workout Record

Use structures such as:

```js
PROGRAMS = {
  ppl6: {
    id: 'ppl6',
    name: 'Push / Pull / Legs',
    description: 'Six-workout rotating PPL',
    scheduleType: 'rotation',
    workouts: ['pushA','pullA','legsA','pushB','pullB','legsB']
  }
}
```

Workout templates reference canonical exercise IDs, target reps, working sets, and increments.

Prepare architecture for future:

- PPL × 3
- Upper / Lower
- Full Body × 3
- Arnold split
- hypertrophy plans
- strength plans
- custom plans

Do not build a custom-program editor in this release.

Settings section:

```text
TRAINING PROGRAM
Push / Pull / Legs
6-workout rotation             ›
```

PPL remains the only active production-ready choice initially.
Historical progress remains exercise-based and survives future program changes.

---

# 13. Home / Travel

Keep only Home and Travel.

Migrate:

- Crunch Gym → Home
- Travel Gym → Travel
- Hotel Gym → Travel
- unknown old values → Home

No custom gym creation.
No profile setup.
No equipment checklist.

---

# 14. Settings cleanup

Final Settings hierarchy:

```text
TRAINING
Training Program
Home / Travel
Weight Units

DATA
Export Backup
Import Backup

APP
Version
Reset Data
```

Remove:

- install instructions
- Add to Home Screen guidance
- browser-specific PWA tutorials
- custom gym creation
- unfinished health integrations
- unnecessary technical text

Keep manifest and service worker functional.

---

# 15. Concept-level visual polish

Treat the attached approved concept as the UI source of truth.

Use:

- matte black
- deep crimson accents
- off-white text
- restrained gradients
- thin borders
- compact cards
- consistent modal headers
- consistent back/close controls
- line icons
- large clear numbers only where they help
- deliberate spacing

Avoid:

- oversized empty cards
- giant continuous lists
- repetitive labels
- fake tactical language
- excessive red
- excessive glow
- decorative dead controls

Every screen should be understandable in seconds.

---

# 16. Testing and acceptance

Before creating the PR, verify:

## Data and migration

- current production localStorage loads
- active workout survives migration
- history survives migration
- notes survive migration
- bodyweight survives migration
- replacements survive migration
- display names remain historically accurate

## Workouts

- all six PPL workouts start
- Home/Travel works
- Empty/Normal/Packed works
- timer survives refresh and reopening
- set logging works
- variable set model does not break current three-set UI
- complete, skip, reopen, reorder
- retroactive date and duration

## Replacement engine

- top 3 valid
- More Options valid and nonduplicated
- no unrelated muscles
- accurate illustrations
- image assets exist
- Travel ranking behaves sensibly
- rename/restore replacement preserves sets

## Plate calculator

- both modes
- all required math cases
- repeated plate counts
- remove/clear plates
- Apply and Close behavior
- focus stability
- calculator hidden for invalid exercise types

## Progress

- empty state
- one workout
- many workouts
- grouped categories
- canonical aliases
- substituted/renamed exercise history
- PRs and no-PR states
- bodyweight one/many entries
- exercise detail chart threshold

## Mobile/PWA

- Samsung-width viewport
- no horizontal overflow
- bottom navigation never overlaps content
- all taps at least 44px
- offline load
- service-worker cache updated
- manifest valid

---

# 17. Delivery process

Work in ordered checkpoints and commit after each:

1. architecture and migrations
2. exercise/program data model
3. accurate illustrations
4. replacement engine
5. dual-mode plate calculator
6. active workout/timer
7. progression engine
8. Progress redesign
9. History/core/Settings
10. final visual polish and tests

Do not stop after producing a summary or local patch.
Push the implementation branch and create a pull request against `main`.
Return the actual PR URL.
