# Easy Learn — Update Reports

This directory maintains all team progress reports for the **Easy Learn** project.

## Structure

```
updates/
├── daily/
│   ├── TEMPLATE.md        ← Copy this for each new day
│   └── YYYY-MM-DD.md      ← One file per day
└── weekly/
    ├── TEMPLATE.md        ← Copy this for each new week
    └── week-NN-YYYY.md    ← One file per sprint week
```

## How to Use

### Daily Standup

1. Copy `daily/TEMPLATE.md`
2. Rename it to today's date: `daily/YYYY-MM-DD.md`
3. Fill in your section (Done, Doing, Blockers)
4. Commit with: `docs: daily standup YYYY-MM-DD`

### Weekly Summary

1. Copy `weekly/TEMPLATE.md`
2. Rename it: `weekly/week-NN-YYYY.md` (e.g. `week-02-2026.md`)
3. Fill in achievements, deliverables, next week goals
4. Commit with: `docs: weekly summary week-NN-YYYY`
