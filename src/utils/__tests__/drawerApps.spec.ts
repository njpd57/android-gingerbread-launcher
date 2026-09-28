import { describe, expect, it } from 'vitest';
import { drawerApps, setAppHidden } from '../drawerApps';

const apps = [
    { key: 'com.whatsapp', label: 'WhatsApp' },
    { key: 'com.android.chrome', label: 'Chrome' },
    { key: 'com.microsoft.teams', label: 'Teams' },
    { key: 'com.microsoft.teams@10', label: 'Teams' },
    { key: 'com.spotify.music', label: 'Spotify' },
];
const keys = (list: { key: string }[]) => list.map(a => a.key);

describe('drawerApps', () =>
{
    it('sorts by name', () =>
    {
        expect(keys(drawerApps(apps, 'name', [], {}))).toEqual([
            'com.android.chrome', 'com.spotify.music', 'com.microsoft.teams', 'com.microsoft.teams@10', 'com.whatsapp',
        ]);
    });

    it('puts the most launched first, then the rest by name', () =>
    {
        const counts = { 'com.whatsapp': 9, 'com.spotify.music': 3 };
        expect(keys(drawerApps(apps, 'mostUsed', [], counts))).toEqual([
            'com.whatsapp', 'com.spotify.music', 'com.android.chrome', 'com.microsoft.teams', 'com.microsoft.teams@10',
        ]);
    });

    it('leaves hidden apps out, telling work and personal copies apart', () =>
    {
        const shown = keys(drawerApps(apps, 'name', ['com.microsoft.teams@10', 'com.whatsapp'], {}));
        expect(shown).toEqual(['com.android.chrome', 'com.spotify.music', 'com.microsoft.teams']);
    });
});

describe('setAppHidden', () =>
{
    it('adds and removes an app once', () =>
    {
        const hidden = setAppHidden(setAppHidden([], 'com.whatsapp', true), 'com.whatsapp', true);
        expect(hidden).toEqual(['com.whatsapp']);
        expect(setAppHidden(hidden, 'com.whatsapp', false)).toEqual([]);
    });
});
