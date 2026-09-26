import { describe, expect, it } from 'vitest';
import { placeMenu } from '../menu-position';

const icon = (left: number, top: number) => ({ left, top, right: left + 80, bottom: top + 100 });

describe('placeMenu', () =>
{
    it('opens below the icon, centered on it, when it fits', () =>
    {
        expect(placeMenu(icon(160, 100), 240, 200, 400, 800)).toEqual({ left: 80, top: 208, above: false });
    });

    it('opens above the icon near the bottom of the screen', () =>
    {
        expect(placeMenu(icon(160, 600), 240, 200, 400, 800)).toEqual({ left: 80, top: 392, above: true });
    });

    it('stays inside the screen horizontally', () =>
    {
        expect(placeMenu(icon(0, 100), 240, 200, 400, 800).left).toBe(8);
        expect(placeMenu(icon(320, 100), 240, 200, 400, 800).left).toBe(152);
    });
});
