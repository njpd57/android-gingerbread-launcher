import { describe, expect, it } from 'vitest';
import { SHADE_SLOP_PX, shadeGestureDirection, shadeSettlesOpen } from '../shadeGesture';

describe('shadeGestureDirection', () =>
{
    it("can't tell until the finger moves past the slop", () =>
    {
        expect(shadeGestureDirection(0, SHADE_SLOP_PX - 1)).toBeNull();
        expect(shadeGestureDirection(3, -4)).toBeNull();
    });

    it('is a pull when the finger goes mostly down', () =>
    {
        expect(shadeGestureDirection(0, 20)).toBe('down');
        expect(shadeGestureDirection(10, 20)).toBe('down');
        expect(shadeGestureDirection(-10, 20)).toBe('down');
    });

    it('is something else when it goes sideways or up', () =>
    {
        expect(shadeGestureDirection(20, 20)).toBe('other');
        expect(shadeGestureDirection(-30, 5)).toBe('other');
        expect(shadeGestureDirection(0, -20)).toBe('other');
    });
});

describe('shadeSettlesOpen', () =>
{
    it('opens once enough of the panel shows', () =>
    {
        expect(shadeSettlesOpen(400, 800, 0)).toBe(true);
        expect(shadeSettlesOpen(100, 800, 0)).toBe(false);
    });

    it('follows a flick whatever the position', () =>
    {
        expect(shadeSettlesOpen(60, 800, 1)).toBe(true);
        expect(shadeSettlesOpen(700, 800, -1)).toBe(false);
    });
});
