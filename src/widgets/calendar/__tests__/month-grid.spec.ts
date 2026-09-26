import { describe, expect, it } from 'vitest';
import { monthGrid } from '../month-grid';

describe('monthGrid', () =>
{
    // September 2026 starts on a Tuesday and has 30 days
    const today = new Date(2026, 8, 25);
    const days = monthGrid(2026, 8, today);

    it('always has 6 weeks of 7 days', () =>
    {
        expect(days).toHaveLength(42);
    });

    it('starts on Monday, padding with the previous month', () =>
    {
        expect(days[0]).toEqual({ day: 31, inMonth: false, isToday: false });
        expect(days[1]).toEqual({ day: 1, inMonth: true, isToday: false });
    });

    it('marks today and pads the end with the next month', () =>
    {
        expect(days.filter(d => d.isToday)).toEqual([{ day: 25, inMonth: true, isToday: true }]);
        expect(days.filter(d => d.inMonth)).toHaveLength(30);
        expect(days[31]).toEqual({ day: 1, inMonth: false, isToday: false });
    });

    it('does not mark today in another month', () =>
    {
        expect(monthGrid(2026, 9, today).some(d => d.isToday)).toBe(false);
    });
});
