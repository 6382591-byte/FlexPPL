# VEKTR 2.0

VEKTR is a local-first, offline workout tracker built around one question: **what do I do next?**

## Release highlights

- Flexible six-workout Push / Pull / Legs rotation with future program support.
- Exercises can be completed in any order, with a persistent elapsed-workout timer.
- Strict, ranked **Can't do this?** replacements for Home and Travel.
- Accurate, consistent inline exercise illustrations with no misleading fallback art.
- Dual-mode plate calculator: enter a target weight or tap the plates already loaded.
- Variable working sets and conservative Increase / Repeat / Reduce coaching.
- Summary-first Progress organized by muscle group, with PRs and compact bodyweight history.
- Detailed workout History, editable substitutions, and genuinely logged optional core work.
- Versioned local data migrations, JSON backup/restore, and full offline support.

## Validation

```text
node --test tests/*.test.js
node validate.js
node tests/browser-smoke.mjs
```

The browser smoke test covers all six workouts at a 412 px Samsung-sized viewport, legacy-data migration, Smart Swap, both plate-calculator modes, variable sets, the workout timer, core logging, Progress, History, Settings, and a true offline reload.

No account, backend, subscription, or install tutorial is required.
