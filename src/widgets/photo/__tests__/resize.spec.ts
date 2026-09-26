import { describe, expect, it } from 'vitest';
import { fitWithin } from '../resize';

describe('fitWithin', () =>
{
    it('scales the longest side down to the limit, keeping the aspect ratio', () =>
    {
        expect(fitWithin(4000, 3000, 800)).toEqual({ width: 800, height: 600 });
        expect(fitWithin(3000, 4000, 800)).toEqual({ width: 600, height: 800 });
    });

    it('never scales small images up', () =>
    {
        expect(fitWithin(320, 240, 800)).toEqual({ width: 320, height: 240 });
    });

    it('keeps at least one pixel on very thin images', () =>
    {
        expect(fitWithin(10000, 2, 800)).toEqual({ width: 800, height: 1 });
    });
});
