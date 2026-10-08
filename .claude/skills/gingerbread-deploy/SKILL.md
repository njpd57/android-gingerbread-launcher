---
name: gingerbread-deploy
description: Deploy the Gingerbread launcher (~/Proyectos/api-tester) to the phone, or explain how. Use when asked to deploy, push to the phone, install a new build, or grant the optional permissions.
---

# Deploy the launcher

The user runs deploys themselves. **Never run adb or `npm run deploy` on the phone without explicit permission for that task**; permission for one task doesn't carry over.

## What the commands do (from `~/Proyectos/api-tester`)
- `npm run deploy [remote_dir]` (`scripts/deploy.sh`): `npm run build`, then `adb push dist/.` to `/sdcard/projects/gingerbread-launcher` (or `remote_dir`). Needs `adb` in PATH and a connected device.
- `npm run grant-permissions` (`scripts/grant-permissions.sh`): grants Bridge `WRITE_SECURE_SETTINGS` over adb (system night mode).
- Build names are stable (`assets/index.js`), so copying a new `dist/` over the old one is enough. Bridge's "project dir" setting must point at that folder.
- The fork's APK (Kotlin changes in `~/Proyectos/bridge-launcher`) is built and installed separately; new fork methods need it installed on the phone.

## Steps
1. Run the `gingerbread-verify` checks first (type-check, tests, build).
2. If permission to use adb was given for this task, run `npm run deploy`; otherwise tell the user to run it (`! npm run deploy` works in this session).
3. Hand over a short checklist of what to look at on the phone. Don't commit until the user confirms (then use `launcher-committer`, branch `dev`).
