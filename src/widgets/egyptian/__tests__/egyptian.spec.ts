import { describe, expect, it } from 'vitest';
import { EGYPTIAN_ARCANA, egyptianArcanumOfTheDay } from '../egyptianTarot';
import { EGYPTIAN_GODS, egyptianGodOfTheDay } from '../egyptianGods';

const isHieroglyph = (s: string) => [...s].length === 1 && s.codePointAt(0)! >= 0x13000 && s.codePointAt(0)! < 0x13430;

describe('Egyptian tarot', () =>
{
    it('has the 22 major arcana, numbered 1 to 22, each with a hieroglyph', () =>
    {
        expect(EGYPTIAN_ARCANA.map(a => a.number)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
        for (const a of EGYPTIAN_ARCANA)
            expect(isHieroglyph(a.glyph), a.name).toBe(true);
    });

    it('draws one arcanum a day', () =>
    {
        expect(egyptianArcanumOfTheDay(new Date(2026, 8, 28, 1))).toBe(egyptianArcanumOfTheDay(new Date(2026, 8, 28, 22)));
    });
});

describe('Egyptian gods', () =>
{
    it('gives every god a hieroglyph and a message', () =>
    {
        for (const g of EGYPTIAN_GODS)
        {
            expect(isHieroglyph(g.glyph), g.name).toBe(true);
            expect(g.message.length, g.name).toBeGreaterThan(20);
        }
        expect(new Set(EGYPTIAN_GODS.map(g => g.name)).size).toBe(EGYPTIAN_GODS.length);
    });

    it('draws one god a day', () =>
    {
        expect(egyptianGodOfTheDay(new Date(2026, 8, 28, 1))).toBe(egyptianGodOfTheDay(new Date(2026, 8, 28, 22)));
    });
});
