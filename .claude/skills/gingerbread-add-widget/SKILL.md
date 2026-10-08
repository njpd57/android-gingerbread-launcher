---
name: gingerbread-add-widget
description: Add a new home screen widget to the Gingerbread launcher (~/Proyectos/api-tester). Use when asked to create a widget, a new "WidgetKind", or something to appear under Añadir → Widgets.
---

# Add a widget to the Gingerbread launcher

Repo: `~/Proyectos/api-tester` (Vue 3 `<script setup>`, TS, Pinia, SCSS; Allman braces, 4 spaces; UI text in Spanish, code/comments in English).

## The three places (all required)
1. `useHomeLayoutStore`: add the kind to `WidgetKind` and its size to `WIDGET_SIZES`.
2. `src/widgets/WidgetView.vue`: add the render branch (also used by `HomeGrid`, `DragLayer` and `AddDialog` previews).
3. `src/menu/AddDialog.vue`: add it to the list.

## Rules
- Component goes in `src/widgets/<name>/`. It must work **without a `widgetId`** and without side effects beyond reading its store (previews render it scaled down).
- Per-instance data: `useWidgetData(widgetId, empty, preview)`; photos use IndexedDB (`widgets/photo/photo-storage.ts`).
- Text entry or settings: `components/WidgetDialog.vue` / `GbDialog`, never an input on the grid.
- Look: Songbird / power-control style via `vars.scss` mixins (`gb-widget-frame` or `gb-widget-glossy`, `gb-widget-bar`, `gb-widget-inset`, `gb-widget-button`, `gb-pressed`). No Material look: no circles, pills, flat chips, big radii. Pressed state orange (`#ffa800`).
- Bridge calls: `bridgeRequest(t => Bridge.requestX(..., t))`, `showToast()`, apps via `useAppLauncherStore().launch()`; fork methods behind `bridgeHas()` (see `gingerbread-add-fork-method`).
- Keep logic in pure functions (`src/utils/`) and add a vitest spec for it.
- Update `FEATURES.md` (✅/◐) and the README if user-facing.

Finish with the `gingerbread-verify` skill.
