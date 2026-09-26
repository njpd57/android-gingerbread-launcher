import { defineStore } from "pinia";
import { computed, ref, shallowRef, watch } from "vue";
import { GRID_COLS, useHomeLayoutStore, type WidgetKind } from "./useHomeLayoutStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

const EDGE_PX = 28;
const EDGE_DELAY_MS = 650;
const CLICK_GUARD_MS = 400;
// the finger has to move this far before a long press counts as a drag; lifting it before that cancels
// the drag, which leaves the app shortcuts menu (opened by the same long press) on screen
export const DRAG_MOVE_PX = 16;

export type DragPayload =
    | { source: 'drawer'; packageName: string; label: string }
    | { source: 'home'; itemId: string }
    | { source: 'folder'; folderId: string; packageName: string; label: string };

export type DragGhost =
    | { type: 'app'; packageName: string; label: string }
    | { type: 'widget'; widget: WidgetKind; id: string }
    | { type: 'folder'; name: string };

export type DropTarget =
    | { kind: 'cell'; page: number; x: number; y: number; valid: boolean }
    | { kind: 'folder'; page: number; x: number; y: number; folderId: string }
    | { kind: 'trash' };

interface ActiveDrag
{
    payload: DragPayload;
    ghost: DragGhost;
    w: number;
    h: number;
    ghostWidth: number;
    ghostHeight: number;
    // where inside the ghost the finger is
    offsetX: number;
    offsetY: number;
}

export const useDragStore = defineStore('drag', () =>
{
    const layout = useHomeLayoutStore();
    const workspace = useWorkspaceStore();

    const active = ref<ActiveDrag | null>(null);
    const pointer = ref({ x: 0, y: 0 });
    const startPointer = { x: 0, y: 0 };
    /** Whether the finger has moved since the drag started (see DRAG_MOVE_PX). */
    const hasMoved = ref(false);
    const target = ref<DropTarget | null>(null);

    const draggedItemId = computed(() =>
        active.value?.payload.source === 'home' ? active.value.payload.itemId : null);

    // registered by HomeGrid (one per page) and Dock
    const gridEls = new Map<number, HTMLElement>();
    const trashEl = shallowRef<HTMLElement | null>(null);

    function registerGrid(page: number, el: HTMLElement | null)
    {
        if (el) gridEls.set(page, el);
        else gridEls.delete(page);
    }

    let edgeTimer = 0;
    let lastDropTime = 0;

    function currentGridRect()
    {
        return gridEls.get(workspace.currentPage)?.getBoundingClientRect() ?? null;
    }

    function isInside(rect: DOMRect, x: number, y: number)
    {
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    /** The grid cell under a point on the current page, or null if the point isn't over the grid. */
    function cellAt(clientX: number, clientY: number)
    {
        const rect = currentGridRect();
        if (!rect || !isInside(rect, clientX, clientY)) return null;
        return {
            page: workspace.currentPage,
            x: Math.min(GRID_COLS - 1, Math.floor((clientX - rect.left) / (rect.width / GRID_COLS))),
            y: Math.min(layout.rows - 1, Math.floor((clientY - rect.top) / (rect.height / layout.rows))),
        };
    }

    function isDraggingApp(a: ActiveDrag)
    {
        return a.ghost.type === 'app';
    }

    function updateTarget()
    {
        const a = active.value;
        if (!a) return;
        const { x, y } = pointer.value;

        const trashRect = trashEl.value?.getBoundingClientRect();
        if (trashRect && isInside(trashRect, x, y))
        {
            target.value = { kind: 'trash' };
            return;
        }

        const rect = currentGridRect();
        if (!rect)
        {
            target.value = null;
            return;
        }

        // apps dropped onto a folder go inside it
        const under = cellAt(x, y);
        const folder = under && layout.folderAt(under.page, under.x, under.y);
        if (under && folder && isDraggingApp(a))
        {
            target.value = { kind: 'folder', ...under, folderId: folder.id };
            return;
        }

        const cellW = rect.width / GRID_COLS;
        const cellH = rect.height / layout.rows;
        const left = x - a.offsetX;
        const top = y - a.offsetY;
        const col = Math.max(0, Math.min(GRID_COLS - a.w, Math.round((left - rect.left) / cellW)));
        const row = Math.max(0, Math.min(layout.rows - a.h, Math.round((top - rect.top) / cellH)));
        const page = workspace.currentPage;

        target.value = {
            kind: 'cell',
            page,
            x: col,
            y: row,
            valid: layout.isAreaFree({ page, x: col, y: row, w: a.w, h: a.h }, draggedItemId.value ?? undefined),
        };
    }

    function clearEdgeTimer()
    {
        clearTimeout(edgeTimer);
        edgeTimer = 0;
    }

    // holding an item near the left/right edge flips to the neighbouring page
    function updateEdgePaging()
    {
        const { x } = pointer.value;
        const direction = x < EDGE_PX ? -1 : x > window.innerWidth - EDGE_PX ? 1 : 0;

        if (direction === 0)
        {
            clearEdgeTimer();
            return;
        }

        if (!edgeTimer)
        {
            edgeTimer = window.setTimeout(() =>
            {
                edgeTimer = 0;
                workspace.goToPage(workspace.currentPage + direction);
            }, EDGE_DELAY_MS);
        }
    }

    function onPointerMove(e: PointerEvent)
    {
        pointer.value = { x: e.clientX, y: e.clientY };
        if (!hasMoved.value && Math.hypot(e.clientX - startPointer.x, e.clientY - startPointer.y) > DRAG_MOVE_PX)
            hasMoved.value = true;
        updateTarget();
        updateEdgePaging();
    }

    // stop the page (or the drawer) from scrolling under the finger while dragging
    function preventTouchScroll(e: TouchEvent)
    {
        e.preventDefault();
    }

    function attachListeners()
    {
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', drop);
        window.addEventListener('pointercancel', cancel);
        window.addEventListener('touchmove', preventTouchScroll, { passive: false });
    }

    function detachListeners()
    {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', drop);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('touchmove', preventTouchScroll);
    }

    /**
     * Starts dragging. `sourceRect` is the dragged element's on-screen box, so the item stays
     * under the finger where it was grabbed; without it the item is centered on the finger.
     */
    function start(payload: DragPayload, x: number, y: number, sourceRect?: DOMRect)
    {
        let ghost: DragGhost;
        let w = 1;
        let h = 1;

        if (payload.source === 'home')
        {
            const item = layout.items.find(i => i.id === payload.itemId);
            if (!item) return;
            ghost = item.type === 'app' ? { type: 'app', packageName: item.packageName, label: item.label }
                : item.type === 'folder' ? { type: 'folder', name: item.name }
                    : { type: 'widget', widget: item.widget, id: item.id };
            w = item.w;
            h = item.h;
        }
        else
        {
            ghost = { type: 'app', packageName: payload.packageName, label: payload.label };
        }

        const rect = currentGridRect();
        const cellW = rect ? rect.width / GRID_COLS : 80;
        const cellH = rect ? rect.height / layout.rows : 100;
        const ghostWidth = w * cellW;
        const ghostHeight = h * cellH;

        active.value = {
            payload,
            ghost,
            w,
            h,
            ghostWidth,
            ghostHeight,
            offsetX: sourceRect ? Math.min(ghostWidth, Math.max(0, x - sourceRect.left)) : ghostWidth / 2,
            offsetY: sourceRect ? Math.min(ghostHeight, Math.max(0, y - sourceRect.top)) : ghostHeight / 2,
        };
        pointer.value = { x, y };
        startPointer.x = x;
        startPointer.y = y;
        hasMoved.value = false;
        updateTarget();
        attachListeners();
    }

    function finish()
    {
        detachListeners();
        clearEdgeTimer();
        active.value = null;
        target.value = null;
        hasMoved.value = false;
        lastDropTime = Date.now();
    }

    function drop()
    {
        const a = active.value;
        const t = target.value;

        // a long press released in place only opened the shortcuts menu; nothing moves
        if (a && t && hasMoved.value)
            applyDrop(a, t);

        finish();
    }

    function applyDrop(a: ActiveDrag, t: DropTarget)
    {
        const p = a.payload;

        if (t.kind === 'cell' && !t.valid) return;
        if (t.kind === 'folder' && p.source === 'home' && p.itemId === t.folderId) return;

        // take the item out of where it came from...
        if (p.source === 'folder')
            layout.removeFromFolder(p.folderId, p.packageName);

        if (t.kind === 'trash')
        {
            if (p.source === 'home')
                layout.removeItem(p.itemId);
            // like Gingerbread: dropping an app from the drawer on the trash uninstalls it
            // (Android asks for confirmation; appRemoved then cleans up the home screen)
            else if (p.source === 'drawer')
                Bridge.requestAppUninstall(p.packageName, true);
            return;
        }

        if (t.kind === 'cell' && p.source === 'home')
        {
            layout.moveItem(p.itemId, t.page, t.x, t.y);
            return;
        }

        // ...and put it where it was dropped
        const app = p.source === 'home'
            ? layout.items.find(i => i.id === p.itemId)
            : p;
        if (!app || !('packageName' in app)) return;

        if (t.kind === 'folder')
        {
            layout.addToFolder(t.folderId, { packageName: app.packageName, label: app.label });
            if (p.source === 'home')
                layout.removeItem(p.itemId);
        }
        else
        {
            layout.addApp(app.packageName, app.label, t.page, t.x, t.y);
        }
    }

    function cancel()
    {
        finish();
    }

    /** True right after a drop, so the click that follows the release can be ignored. */
    function justDropped()
    {
        return Date.now() - lastDropTime < CLICK_GUARD_MS;
    }

    // the grid moves under the finger while flipping pages
    watch(() => workspace.currentPage, updateTarget);

    return {
        active,
        pointer,
        hasMoved,
        target,
        draggedItemId,
        trashEl,
        registerGrid,
        cellAt,
        start,
        cancel,
        justDropped,
    };
});
