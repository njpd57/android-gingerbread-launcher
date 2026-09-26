import { defineStore } from "pinia";
import { computed, watch } from "vue";
import { useLocalStorage } from "@vueuse/core";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { DEFAULT_PAGE, PAGE_COUNT } from "./useWorkspaceStore";

export const GRID_COLS = 4;
export const MIN_GRID_ROWS = 4;
export const MAX_GRID_ROWS = 7;

// Gingerbread's cells were about 25% taller than wide (80 x 100 dp)
const CELL_ASPECT = 1.25;

/** How many rows fit in a grid of this size while keeping Gingerbread-shaped cells. */
export function autoGridRows(gridWidth: number, gridHeight: number)
{
    const cellWidth = gridWidth / GRID_COLS;
    if (cellWidth <= 0 || gridHeight <= 0) return MIN_GRID_ROWS;
    const rows = Math.round(gridHeight / (cellWidth * CELL_ASPECT));
    return Math.max(MIN_GRID_ROWS, Math.min(MAX_GRID_ROWS, rows));
}

export type WidgetKind = 'clock' | 'clockLarge' | 'digitalClock' | 'weather' | 'power' | 'search' | 'battery' | 'calendar' | 'quote' | 'photo' | 'music' | 'musicSongbird' | 'agenda' | 'screenTime' | 'mostUsed'
    | 'countdown' | 'forecast' | 'sunMoon' | 'note' | 'timer' | 'calculator' | 'tasks' | 'rss' | 'favContacts' | 'directCall' | 'directMessage';

export const WIDGET_SIZES: Record<WidgetKind, { w: number; h: number }> = {
    clock: { w: 2, h: 2 },
    clockLarge: { w: 4, h: 2 },
    weather: { w: 4, h: 1 },
    power: { w: 4, h: 1 },
    search: { w: 4, h: 1 },
    digitalClock: { w: 4, h: 1 },
    battery: { w: 1, h: 1 },
    calendar: { w: 4, h: 2 },
    quote: { w: 4, h: 1 },
    photo: { w: 2, h: 2 },
    music: { w: 4, h: 1 },
    musicSongbird: { w: 4, h: 1 },
    mostUsed: { w: 4, h: 1 },
    agenda: { w: 4, h: 2 },
    countdown: { w: 2, h: 1 },
    forecast: { w: 4, h: 2 },
    sunMoon: { w: 2, h: 1 },
    note: { w: 2, h: 2 },
    timer: { w: 2, h: 1 },
    calculator: { w: 4, h: 3 },
    tasks: { w: 2, h: 2 },
    rss: { w: 4, h: 2 },
    screenTime: { w: 4, h: 1 },
    favContacts: { w: 4, h: 1 },
    directCall: { w: 1, h: 1 },
    directMessage: { w: 1, h: 1 },
};

export interface GridArea
{
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface AppItem extends GridArea
{
    id: string;
    type: 'app';
    packageName: string;
    // kept so the shortcut still has a name before the app list loads
    label: string;
}

export interface WidgetItem extends GridArea
{
    id: string;
    type: 'widget';
    widget: WidgetKind;
}

export interface FolderApp
{
    packageName: string;
    label: string;
}

export interface FolderItem extends GridArea
{
    id: string;
    type: 'folder';
    name: string;
    apps: FolderApp[];
}

export type HomeItem = AppItem | WidgetItem | FolderItem;

export const DEFAULT_FOLDER_NAME = 'Carpeta';

function defaultItems(): HomeItem[]
{
    return [
        { id: 'clock', type: 'widget', widget: 'clockLarge', page: DEFAULT_PAGE, x: 0, y: 0, ...WIDGET_SIZES.clockLarge },
        { id: 'weather', type: 'widget', widget: 'weather', page: DEFAULT_PAGE, x: 0, y: 2, ...WIDGET_SIZES.weather },
    ];
}

function newId()
{
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function overlaps(a: GridArea, b: GridArea)
{
    return a.page === b.page
        && a.x < b.x + b.w && b.x < a.x + a.w
        && a.y < b.y + b.h && b.y < a.y + a.h;
}

export const useHomeLayoutStore = defineStore('homeLayout', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const items = useLocalStorage<HomeItem[]>('home.items', defaultItems());

    // 0 = automatic, otherwise a fixed number of rows chosen by the user
    const rowsSetting = useLocalStorage<number>('home.gridRows', 0);
    // measured from the screen by App.vue (in portrait only); remembered so that starting up
    // in landscape keeps the portrait layout instead of falling back to the minimum
    const autoRows = useLocalStorage<number>('home.autoRows', MIN_GRID_ROWS);
    const rows = computed(() => rowsSetting.value || autoRows.value);

    function isAreaFree(area: GridArea, ignoreId?: string)
    {
        const inBounds = area.page >= 0 && area.page < PAGE_COUNT
            && area.x >= 0 && area.y >= 0
            && area.x + area.w <= GRID_COLS
            && area.y + area.h <= rows.value;

        return inBounds && !items.value.some(i => i.id !== ignoreId && overlaps(i, area));
    }

    /** The preferred spot if it's free, otherwise the first free spot on that page (row by row), or null if the page is full. */
    function findFreeSpot(page: number, w: number, h: number, preferred?: { x: number; y: number })
    {
        if (preferred && isAreaFree({ page, x: preferred.x, y: preferred.y, w, h }))
            return { page, x: preferred.x, y: preferred.y };

        for (let y = 0; y <= rows.value - h; y++)
            for (let x = 0; x <= GRID_COLS - w; x++)
                if (isAreaFree({ page, x, y, w, h }))
                    return { page, x, y };

        return null;
    }

    function folderAt(page: number, x: number, y: number)
    {
        return items.value.find((i): i is FolderItem =>
            i.type === 'folder' && i.page === page && i.x === x && i.y === y);
    }

    function addApp(packageName: string, label: string, page: number, x: number, y: number)
    {
        items.value = [
            ...items.value,
            { id: newId(), type: 'app', packageName, label, page, x, y, w: 1, h: 1 },
        ];
    }

    /** Pages in the order to look for room: the given one first, then the rest from left to right. */
    function pagesFrom(first: number)
    {
        return [first, ...Array.from({ length: PAGE_COUNT }, (_, p) => p).filter(p => p !== first)];
    }

    /** Adds an app shortcut in the first free cell, starting on `firstPage`. Returns where it went, or null if every page is full. */
    function addAppAnywhere(packageName: string, label: string, firstPage: number)
    {
        for (const page of pagesFrom(firstPage))
        {
            const spot = findFreeSpot(page, 1, 1);
            if (spot)
            {
                addApp(packageName, label, spot.page, spot.x, spot.y);
                return spot;
            }
        }
        return null;
    }

    function hasShortcut(packageName: string)
    {
        return items.value.some(i => i.type === 'app' && i.packageName === packageName);
    }

    function addWidget(widget: WidgetKind, page: number, x: number, y: number)
    {
        items.value = [
            ...items.value,
            { id: newId(), type: 'widget', widget, page, x, y, ...WIDGET_SIZES[widget] },
        ];
    }

    function addFolder(page: number, x: number, y: number)
    {
        const id = newId();
        items.value = [
            ...items.value,
            { id, type: 'folder', name: DEFAULT_FOLDER_NAME, apps: [], page, x, y, w: 1, h: 1 },
        ];
        return id;
    }

    function updateFolder(id: string, update: (folder: FolderItem) => FolderItem)
    {
        items.value = items.value.map(i => i.id === id && i.type === 'folder' ? update(i) : i);
    }

    function renameFolder(id: string, name: string)
    {
        updateFolder(id, f => ({ ...f, name: name.trim() || DEFAULT_FOLDER_NAME }));
    }

    function addToFolder(id: string, app: FolderApp)
    {
        updateFolder(id, f => ({ ...f, apps: [...f.apps, app] }));
    }

    function removeFromFolder(id: string, packageName: string)
    {
        // only the first match, in case the same app was added twice
        updateFolder(id, f =>
        {
            const index = f.apps.findIndex(a => a.packageName === packageName);
            return index === -1 ? f : { ...f, apps: f.apps.filter((_, i) => i !== index) };
        });
    }

    function moveItem(id: string, page: number, x: number, y: number)
    {
        items.value = items.value.map(i => i.id === id ? { ...i, page, x, y } : i);
    }

    function removeItem(id: string)
    {
        items.value = items.value.filter(i => i.id !== id);
    }

    function isInGrid(i: GridArea)
    {
        return i.y + i.h <= rows.value;
    }

    // with fewer rows, move items that fell off the bottom to a free spot:
    // first on their own page, then on the others. Items that fit nowhere stay
    // hidden until there are enough rows again.
    function fitItemsToGrid()
    {
        for (const item of items.value.filter(i => !isInGrid(i)))
        {
            for (const page of pagesFrom(item.page))
            {
                const spot = findFreeSpot(page, item.w, item.h);
                if (spot)
                {
                    moveItem(item.id, spot.page, spot.x, spot.y);
                    break;
                }
            }
        }
    }

    watch(rows, (now, before) =>
    {
        if (now < before) fitItemsToGrid();
    });

    // uninstalled apps take their shortcuts (and their place in folders) with them
    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name !== 'appRemoved') return;
        items.value = items.value
            .filter(i => i.type !== 'app' || i.packageName !== ev.packageName)
            .map(i => i.type === 'folder'
                ? { ...i, apps: i.apps.filter(a => a.packageName !== ev.packageName) }
                : i);
    });

    return {
        items,
        rows,
        rowsSetting,
        autoRows,
        isInGrid,
        isAreaFree,
        findFreeSpot,
        folderAt,
        addApp,
        addAppAnywhere,
        hasShortcut,
        addWidget,
        addFolder,
        renameFolder,
        addToFolder,
        removeFromFolder,
        moveItem,
        removeItem,
    };
});
