import { describe, expect, it } from 'vitest';
import { meetsApiLevel } from '../androidVersion';

describe('meetsApiLevel', () =>
{
    it('compares API levels', () =>
    {
        expect(meetsApiLevel(34, 30)).toBe(true);
        expect(meetsApiLevel(30, 30)).toBe(true);
        expect(meetsApiLevel(29, 30)).toBe(false);
    });

    it('treats an unknown level as supported', () =>
    {
        expect(meetsApiLevel(null, 30)).toBe(true);
    });
});
