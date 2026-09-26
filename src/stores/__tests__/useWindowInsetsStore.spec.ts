import { describe, expect, it } from 'vitest';
import { parseInsetsEvent, toInsets, unswapInsets } from '../useWindowInsetsStore';

describe('toInsets', () =>
{
    it('parses the JSON strings returned by Bridge getters', () =>
    {
        expect(toInsets('{"left":0,"top":42,"right":0,"bottom":16}')).toEqual({ left: 0, top: 42, right: 0, bottom: 16 });
    });

    it('accepts already-parsed objects from Bridge events', () =>
    {
        expect(toInsets({ left: 1, top: 2, right: 3, bottom: 4 })).toEqual({ left: 1, top: 2, right: 3, bottom: 4 });
    });

    it('turns missing, invalid or negative values into zeros', () =>
    {
        const zero = { left: 0, top: 0, right: 0, bottom: 0 };
        expect(toInsets('not json')).toEqual(zero);
        expect(toInsets(null)).toEqual(zero);
        expect(toInsets({ top: 'x', bottom: -5 })).toEqual(zero);
    });
});

describe('parseInsetsEvent', () =>
{
    it('reads the events as Bridge actually sends them', () =>
    {
        expect(parseInsetsEvent({ name: 'ImeWindowInsetsChanged', insets: { top: 0, left: 0, right: 0, bottom: 411.5 } }))
            .toEqual({ name: 'ime', value: { left: 0, top: 0, right: 0, bottom: 411.5 } });
    });

    it('also reads them as the API types describe them', () =>
    {
        expect(parseInsetsEvent({ name: 'statusBarsWindowInsetsChanged', newValue: { top: 24, left: 0, right: 0, bottom: 0 } }))
            .toEqual({ name: 'statusBars', value: { left: 0, top: 24, right: 0, bottom: 0 } });
    });

    it('ignores other events and insets the launcher does not track', () =>
    {
        expect(parseInsetsEvent({ name: 'afterResume' })).toBeNull();
        expect(parseInsetsEvent({ name: 'ImeAnimationTargetWindowInsetsChanged', insets: {} })).toBeNull();
    });
});

describe('unswapInsets', () =>
{
    it("swaps top and left back on stock Bridge, where the status bar's 33 px arrive as left", () =>
    {
        expect(unswapInsets({ left: 33, top: 0, right: 0, bottom: 48 }, false))
            .toEqual({ left: 0, top: 33, right: 0, bottom: 48 });
    });

    it('leaves the insets alone when the fork already fixed the swap', () =>
    {
        const insets = { left: 0, top: 33, right: 0, bottom: 48 };
        expect(unswapInsets(insets, true)).toBe(insets);
    });
});
