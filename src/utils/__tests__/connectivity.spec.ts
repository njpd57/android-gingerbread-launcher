import { describe, expect, it } from 'vitest';
import { dataActivityArrows, wifiArcs } from '../connectivity';

describe('wifiArcs', () =>
{
    it('maps levels 0 to 4 onto 3 arcs', () =>
    {
        expect([0, 1, 2, 3, 4].map(wifiArcs)).toEqual([0, 1, 2, 2, 3]);
    });

    it('is 0 without Wi-Fi', () =>
    {
        expect(wifiArcs(null)).toBe(0);
    });
});

describe('dataActivityArrows', () =>
{
    it('lights the arrows for the direction of the traffic', () =>
    {
        expect(dataActivityArrows('in')).toEqual({ in: true, out: false });
        expect(dataActivityArrows('out')).toEqual({ in: false, out: true });
        expect(dataActivityArrows('inout')).toEqual({ in: true, out: true });
        expect(dataActivityArrows('dormant')).toEqual({ in: false, out: false });
    });
});
