import { describe, expect, it } from 'vitest';
import { dailyFlag, dailyIndex, dayNumber } from '../daily';

const day = (d: number, h = 12) => new Date(2026, 8, d, h);

describe('dayNumber', () =>
{
    it('changes at local midnight, not during the day', () =>
    {
        expect(dayNumber(day(28, 0))).toBe(dayNumber(day(28, 23)));
        expect(dayNumber(day(29, 0))).toBe(dayNumber(day(28, 23)) + 1);
    });
});

describe('dailyIndex', () =>
{
    it('stays in range and holds for the whole day', () =>
    {
        for (let d = 1; d <= 30; d++)
        {
            const i = dailyIndex(day(d, 1), 22, 'tarot');
            expect(i).toBeGreaterThanOrEqual(0);
            expect(i).toBeLessThan(22);
            expect(dailyIndex(day(d, 22), 22, 'tarot')).toBe(i);
        }
    });

    it('rarely repeats the pick of the day before', () =>
    {
        for (let d = 1; d < 200; d++)
        {
            const a = dailyIndex(new Date(2026, 0, d), 22, 'tarot');
            const b = dailyIndex(new Date(2026, 0, d + 1), 22, 'tarot');
            expect(b, `day ${d}`).not.toBe(a);
        }
    });

    it("doesn't just walk the list in order", () =>
    {
        const picks = Array.from({ length: 10 }, (_, d) => dailyIndex(day(d + 1), 22, 'tarot'));
        const steps = picks.slice(1).map((p, i) => (p - picks[i] + 22) % 22);
        expect(new Set(steps).size).toBeGreaterThan(1);
    });

    it('draws differently for each salt', () =>
    {
        const a = Array.from({ length: 30 }, (_, d) => dailyIndex(day(d + 1), 22, 'tarot'));
        const b = Array.from({ length: 30 }, (_, d) => dailyIndex(day(d + 1), 22, 'gods'));
        expect(a).not.toEqual(b);
    });

    it('uses most of the list over a year', () =>
    {
        const seen = new Set(Array.from({ length: 365 }, (_, d) => dailyIndex(new Date(2026, 0, d + 1), 22, 'tarot')));
        expect(seen.size).toBe(22);
    });
});

describe('dailyFlag', () =>
{
    it('comes out both ways over a month', () =>
    {
        const flags = new Set(Array.from({ length: 30 }, (_, d) => dailyFlag(day(d + 1), 'tarot')));
        expect(flags.size).toBe(2);
    });
});
