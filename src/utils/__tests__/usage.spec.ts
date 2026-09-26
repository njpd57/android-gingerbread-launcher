import { describe, expect, it } from 'vitest';
import { formatDuration, topAppsByTime, totalScreenTime } from '../usage';
import { mostUsedFromUsage } from '../mostUsed';
import type { BridgeAppUsage } from '@/types/bridge-fork';

const usage = (packageName: string, minutes: number, openCount: number): BridgeAppUsage =>
    ({ packageName, totalTimeMs: minutes * 60_000, openCount, lastTimeUsed: null });

const installed = (p: string) => p !== 'com.android.systemui';

describe('formatDuration', () =>
{
    it('shows hours and minutes', () =>
    {
        expect(formatDuration(135 * 60_000)).toBe('2 h 15 min');
        expect(formatDuration(120 * 60_000)).toBe('2 h');
        expect(formatDuration(15 * 60_000 + 30_000)).toBe('15 min');
        expect(formatDuration(20_000)).toBe('menos de 1 min');
    });
});

describe('totalScreenTime and topAppsByTime', () =>
{
    const list = [usage('com.a', 30, 2), usage('com.android.systemui', 90, 40), usage('com.b', 60, 1), usage('com.c', 0, 0)];

    it('only counts installed apps', () =>
    {
        expect(totalScreenTime(list, installed)).toBe(90 * 60_000);
    });

    it('lists the longest used apps first', () =>
    {
        expect(topAppsByTime(list, installed, 2).map(u => u.packageName)).toEqual(['com.b', 'com.a']);
    });
});

describe('mostUsedFromUsage', () =>
{
    it('ranks by times opened, then by time, skipping apps that are not installed', () =>
    {
        const list = [usage('com.a', 30, 5), usage('com.b', 60, 5), usage('com.c', 90, 2), usage('com.android.systemui', 5, 50)];
        expect(mostUsedFromUsage(list, installed, 4)).toEqual(['com.b', 'com.a', 'com.c']);
    });
});
