import { describe, expect, it } from 'vitest';
import { GINGERBREAD_ICON_PACKAGES, gingerbreadIconFor, gingerbreadIconURL, type GingerbreadIcon } from '../gingerbreadIcons';

describe('gingerbreadIconFor', () =>
{
    it('finds the 2.3 icon for the AOSP, Google and Samsung versions of an app', () =>
    {
        expect(gingerbreadIconFor('com.android.dialer')).toBe('phone');
        expect(gingerbreadIconFor('com.google.android.dialer')).toBe('phone');
        expect(gingerbreadIconFor('com.samsung.android.dialer')).toBe('phone');
        expect(gingerbreadIconFor('com.sec.android.app.clockpackage')).toBe('clock');
    });

    it('keeps the own icon of other apps', () =>
    {
        expect(gingerbreadIconFor('com.spotify.music')).toBeNull();
        expect(gingerbreadIconFor('')).toBeNull();
    });

    it('never gives a package two icons', () =>
    {
        const all = Object.values(GINGERBREAD_ICON_PACKAGES).flat();
        expect(new Set(all).size).toBe(all.length);
    });
});

describe('gingerbreadIconURL', () =>
{
    it('has a bundled image for every icon', () =>
    {
        for (const icon of Object.keys(GINGERBREAD_ICON_PACKAGES) as GingerbreadIcon[])
            expect(gingerbreadIconURL(icon), icon).toBeTruthy();
    });
});
