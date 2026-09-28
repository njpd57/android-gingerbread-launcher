import { describe, expect, it } from 'vitest';
import { recentFromUsage } from '../recentApps';

const usage = (packageName: string, lastTimeUsed: number | null) => ({ packageName, lastTimeUsed, totalTimeMs: 1, openCount: 1 });

describe('recentFromUsage', () =>
{
    it('orders by last use and skips unused, excluded and uninstalled apps', () =>
    {
        const result = recentFromUsage(
            [usage('a', 100), usage('b', 300), usage('bridge', 400), usage('c', null), usage('gone', 500), usage('d', 200)],
            p => p !== 'gone',
            ['bridge']);
        expect(result).toEqual(['b', 'd', 'a']);
    });

    it('keeps at most the limit', () =>
    {
        const many = Array.from({ length: 12 }, (_, i) => usage(`p${i}`, i));
        expect(recentFromUsage(many, () => true, [])).toHaveLength(8);
    });
});
