import { describe, expect, it } from 'vitest';
import { TAROT_CARDS, tarotCardImage, tarotCardOfTheDay } from '../tarotCards';

describe('tarot cards', () =>
{
    it('has the 22 major arcana in order, each with its scan', () =>
    {
        expect(TAROT_CARDS.map(c => c.number)).toEqual(Array.from({ length: 22 }, (_, i) => i));
        for (const card of TAROT_CARDS)
            expect(tarotCardImage(card), card.name).toBeTruthy();
    });

    it('draws the same card all day', () =>
    {
        const morning = tarotCardOfTheDay(new Date(2026, 8, 28, 7));
        const night = tarotCardOfTheDay(new Date(2026, 8, 28, 23));
        expect(night).toEqual(morning);
    });
});
