import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { autoGridRows, useHomeLayoutStore } from '../useHomeLayoutStore';
import { useBridgeEventStore } from '../useBridgeEventStore';
import { DEFAULT_PAGE } from '../useWorkspaceStore';

describe('useHomeLayoutStore', () =>
{
    beforeEach(() =>
    {
        localStorage.clear();
        setActivePinia(createPinia());
    });

    it('starts with the clock and weather widgets on the default page', () =>
    {
        const layout = useHomeLayoutStore();
        expect(layout.items.map(i => i.id)).toEqual(['clock', 'weather']);
        expect(layout.items.every(i => i.page === DEFAULT_PAGE)).toBe(true);
    });

    it('rejects areas that overlap an item or leave the grid', () =>
    {
        const layout = useHomeLayoutStore();
        // large clock covers rows 0-1, weather row 2
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 2, y: 1, w: 1, h: 1 })).toBe(false);
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 0, y: 3, w: 1, h: 1 })).toBe(true);
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 3, y: 3, w: 2, h: 1 })).toBe(false);
        expect(layout.isAreaFree({ page: -1, x: 0, y: 0, w: 1, h: 1 })).toBe(false);
        // same cells on another page are free
        expect(layout.isAreaFree({ page: 0, x: 2, y: 1, w: 1, h: 1 })).toBe(true);
    });

    it('ignores the dragged item itself when checking a move', () =>
    {
        const layout = useHomeLayoutStore();
        expect(layout.isAreaFree({ page: DEFAULT_PAGE, x: 0, y: 0, w: 4, h: 2 }, 'clock')).toBe(true);
    });

    it('adds, moves and removes app shortcuts', () =>
    {
        const layout = useHomeLayoutStore();
        layout.addApp('com.android.chrome', 'Chrome', 0, 1, 1);
        const app = layout.items.find(i => i.type === 'app')!;
        expect(app).toMatchObject({ page: 0, x: 1, y: 1, w: 1, h: 1 });

        layout.moveItem(app.id, 4, 3, 3);
        expect(layout.items.find(i => i.id === app.id)).toMatchObject({ page: 4, x: 3, y: 3 });

        layout.removeItem(app.id);
        expect(layout.items.some(i => i.id === app.id)).toBe(false);
    });

    it('finds the preferred spot, then the first free one, then gives up', () =>
    {
        const layout = useHomeLayoutStore();
        expect(layout.findFreeSpot(0, 1, 1, { x: 2, y: 3 })).toEqual({ page: 0, x: 2, y: 3 });
        // (1, 0) is under the clock, so fall back to the first free cell
        expect(layout.findFreeSpot(DEFAULT_PAGE, 1, 1, { x: 1, y: 0 })).toEqual({ page: DEFAULT_PAGE, x: 0, y: 3 });
        // clock + weather leave no room for another 4x1 except the last row
        expect(layout.findFreeSpot(DEFAULT_PAGE, 4, 1)).toEqual({ page: DEFAULT_PAGE, x: 0, y: 3 });
        layout.addWidget('weather', DEFAULT_PAGE, 0, 3);
        expect(layout.findFreeSpot(DEFAULT_PAGE, 4, 1)).toBeNull();
    });

    it('fits more rows on taller screens, within limits', () =>
    {
        // 4 columns of 96px -> 120px tall cells
        expect(autoGridRows(384, 480)).toBe(4);
        expect(autoGridRows(384, 720)).toBe(6);
        expect(autoGridRows(384, 5000)).toBe(7);
        expect(autoGridRows(384, 100)).toBe(4);
        expect(autoGridRows(0, 0)).toBe(4);
    });

    it('uses the fixed row setting over the automatic one', () =>
    {
        const layout = useHomeLayoutStore();
        layout.autoRows = 6;
        expect(layout.rows).toBe(6);
        layout.rowsSetting = 5;
        expect(layout.rows).toBe(5);
    });

    it('moves items that no longer fit when rows shrink', async () =>
    {
        const layout = useHomeLayoutStore();
        layout.autoRows = 6;
        await nextTick();
        layout.addApp('com.android.chrome', 'Chrome', DEFAULT_PAGE, 3, 5);

        layout.autoRows = 4;
        await nextTick();

        // the only free cells left on the default page are in row 3
        const chrome = layout.items.find(i => i.type === 'app')!;
        expect(chrome).toMatchObject({ page: DEFAULT_PAGE, x: 0, y: 3 });
    });

    it('places new apps on the first page with room, starting from the given one', () =>
    {
        const layout = useHomeLayoutStore();
        // default page (4 rows in tests): clock rows 0-1, weather row 2, so the first free cell is (0, 3)
        expect(layout.addAppAnywhere('com.android.chrome', 'Chrome', DEFAULT_PAGE)).toEqual({ page: DEFAULT_PAGE, x: 0, y: 3 });
        expect(layout.hasShortcut('com.android.chrome')).toBe(true);
        expect(layout.hasShortcut('com.google.android.gm')).toBe(false);

        // fill the rest of the default page, then the next app goes to page 0
        for (let x = 1; x < 4; x++)
            layout.addApp(`app.${x}`, `App ${x}`, DEFAULT_PAGE, x, 3);
        expect(layout.addAppAnywhere('com.google.android.gm', 'Gmail', DEFAULT_PAGE)).toEqual({ page: 0, x: 0, y: 0 });
    });

    it('creates, fills, renames and empties folders', () =>
    {
        const layout = useHomeLayoutStore();
        const id = layout.addFolder(0, 0, 0);
        expect(layout.folderAt(0, 0, 0)?.id).toBe(id);

        layout.addToFolder(id, { packageName: 'com.android.chrome', label: 'Chrome' });
        layout.addToFolder(id, { packageName: 'com.android.chrome', label: 'Chrome' });
        layout.removeFromFolder(id, 'com.android.chrome');
        expect(layout.folderAt(0, 0, 0)?.apps).toHaveLength(1);

        layout.renameFolder(id, '  Juegos ');
        expect(layout.folderAt(0, 0, 0)?.name).toBe('Juegos');
        layout.renameFolder(id, '   ');
        expect(layout.folderAt(0, 0, 0)?.name).toBe('Carpeta');
    });

    it('removes shortcuts and folder entries when their app is uninstalled', () =>
    {
        const layout = useHomeLayoutStore();
        useBridgeEventStore();
        layout.addApp('com.android.chrome', 'Chrome', 0, 0, 0);
        layout.addApp('com.google.android.gm', 'Gmail', 0, 1, 0);

        const folderId = layout.addFolder(0, 2, 0);
        layout.addToFolder(folderId, { packageName: 'com.android.chrome', label: 'Chrome' });

        window.onBridgeEvent!({ name: 'appRemoved', packageName: 'com.android.chrome' });

        expect(layout.items.filter(i => i.type === 'app').map(i => i.type === 'app' && i.packageName))
            .toEqual(['com.google.android.gm']);
        expect(layout.folderAt(0, 2, 0)?.apps).toEqual([]);
    });
});
