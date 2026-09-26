import { describe, expect, it } from 'vitest';
import { QUOTES, quoteOfTheDay } from '../quotes';

describe('quoteOfTheDay', () =>
{
    it('keeps the same quote all day and moves to the next one the day after', () =>
    {
        const morning = quoteOfTheDay(new Date(2026, 8, 25, 0, 5));
        const night = quoteOfTheDay(new Date(2026, 8, 25, 23, 55));
        const tomorrow = quoteOfTheDay(new Date(2026, 8, 26, 9, 0));

        expect(night).toBe(morning);
        expect(QUOTES.indexOf(tomorrow)).toBe((QUOTES.indexOf(morning) + 1) % QUOTES.length);
    });
});
