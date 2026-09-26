import { describe, expect, it } from 'vitest';
import { crossedLowBattery, pluggedLabel } from '../battery';

describe('crossedLowBattery', () =>
{
    it('warns when the level drops to 15 % and again to 5 %', () =>
    {
        expect(crossedLowBattery(16, 15, false)).toBe(15);
        expect(crossedLowBattery(6, 5, false)).toBe(5);
    });

    it('does not warn again while it stays below a threshold', () =>
    {
        expect(crossedLowBattery(15, 14, false)).toBeNull();
        expect(crossedLowBattery(10, 9, false)).toBeNull();
    });

    it('shows the lower threshold when a drop crosses both', () =>
    {
        expect(crossedLowBattery(20, 4, false)).toBe(5);
    });

    it('never warns while charging or on the first reading', () =>
    {
        expect(crossedLowBattery(16, 15, true)).toBeNull();
        expect(crossedLowBattery(null, 10, false)).toBeNull();
    });
});

describe('pluggedLabel', () =>
{
    it('names the charging source, or nothing when unplugged', () =>
    {
        expect(pluggedLabel('usb')).toBe('USB');
        expect(pluggedLabel('wireless')).toBe('Inalámbrico');
        expect(pluggedLabel(null)).toBeNull();
    });
});
