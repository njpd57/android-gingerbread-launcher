import { describe, expect, it } from 'vitest';
import {
    GINGERBREAD_WALLPAPERS, isGingerbreadWallpaper, wallpaperImageLayout, wallpaperThumbURL, wallpaperURL,
} from '../gingerbreadWallpapers';

describe('gingerbread wallpapers', () =>
{
    it('has an image and a preview for every wallpaper', () =>
    {
        for (const id of GINGERBREAD_WALLPAPERS)
        {
            expect(wallpaperURL(id), id).toBeTruthy();
            expect(wallpaperThumbURL(id), id).toBeTruthy();
        }
    });

    it('tells known wallpapers from saved values that no longer exist', () =>
    {
        expect(isGingerbreadWallpaper('electric')).toBe(true);
        expect(isGingerbreadWallpaper('lake')).toBe(false);
    });
});

describe('wallpaperImageLayout', () =>
{
    it('fills a tall screen top to bottom and scrolls across the rest of the width', () =>
    {
        const l = wallpaperImageLayout(400, 880);
        expect(l.height).toBeCloseTo(880);
        expect(l.width).toBeCloseTo(1056);
        expect(l.top).toBeCloseTo(0);
        expect(l.scrollRange).toBeCloseTo(656);
    });

    it('fills a wide screen side to side, centered vertically, without scrolling', () =>
    {
        const l = wallpaperImageLayout(1200, 600);
        expect(l.width).toBe(1200);
        expect(l.height).toBe(1000);
        expect(l.top).toBe(-200);
        expect(l.scrollRange).toBe(0);
    });
});
