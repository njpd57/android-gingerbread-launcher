---
name: gingerbread-add-fork-method
description: Add a new method or event to our Bridge fork (~/Proyectos/bridge-launcher) and wire it into the Gingerbread launcher (~/Proyectos/api-tester). Use when a feature needs an Android capability the stock Bridge API lacks.
---

# Add a Bridge fork method

Order matters:
1. **Kotlin first** in `~/Proyectos/bridge-launcher` (branch `main`). Read its `CLAUDE.md`, which lists every method already added. Note any new Android permission.
2. **Declare it** by module augmentation in `~/Proyectos/api-tester/src/types/bridge-fork.d.ts`. New events are typed `BridgeForkEvent`; listeners use `AnyBridgeEventListener`.
3. **Mock it** in `ForkBridgeMock` (`src/mock/injectBridgeMockInDev.ts`) so `npm run dev` works.
4. **Call it behind `bridgeHas('methodName')`** (`src/utils/bridge-utils.ts`) with a fallback for stock Bridge; a missing method throws and can break the whole launcher at load.
5. Subscribe to events with `bridgeEvents.addEventListener(...)` from `useBridgeEventStore`. Never assign `window.onBridgeEvent`.
6. `request…` calls go through `bridgeRequest()`; messages through `showToast()`.
7. Document it in CLAUDE.md of both repos, `FEATURES.md`, and the README's "Permisos opcionales" if it needs a permission.

Commits go through the `launcher-committer` agent, only after the user confirms on the phone. Never use adb on the phone without asking.
