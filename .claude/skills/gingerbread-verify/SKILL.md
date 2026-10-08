---
name: gingerbread-verify
description: Verify a change in the Gingerbread launcher (~/Proyectos/api-tester) and hand it over for phone testing. Use after implementing any launcher change, before reporting it done.
---

# Verify a launcher change

Run from `~/Proyectos/api-tester`:
1. `npm run type-check`
2. `npx vitest run --dir src` (the `--dir src` keeps `.claude/` worktrees out)
3. `npm run build`

Then **stop**. Do not:
- screenshot in a headless browser (the user checks visuals),
- use adb on the phone (needs explicit permission each time; `npm run deploy` is the user's to run),
- commit (only when asked, after the user confirms on the phone, via the `launcher-committer` agent on branch `dev`).

Report results faithfully (failures with output), confirm the branch is `dev`, and give a short checklist of what to look at on the phone.
