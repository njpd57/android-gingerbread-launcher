import { describe, expect, it } from 'vitest';
import { fittedIconSize, scaledIconSize } from '../iconSize';

describe('scaledIconSize', () =>
{
    it('scales the 48 px Gingerbread icon', () =>
    {
        expect(scaledIconSize(100)).toBe(48);
        expect(scaledIconSize(75)).toBe(36);
        expect(scaledIconSize(130)).toBe(62);
    });
});

describe('fittedIconSize', () =>
{
    it('keeps the scaled size when the cell has room', () =>
    {
        expect(fittedIconSize(130, 100, 120)).toBe(62);
    });

    it('shrinks to what a short cell can hold with its label', () =>
    {
        // 80 - 8 padding - 22 label = 50
        expect(fittedIconSize(130, 100, 80)).toBe(50);
    });

    it('shrinks to a narrow cell', () =>
    {
        expect(fittedIconSize(130, 60, 200)).toBe(52);
    });

    it('never goes below a usable minimum', () =>
    {
        expect(fittedIconSize(100, 20, 20)).toBe(24);
    });
});
