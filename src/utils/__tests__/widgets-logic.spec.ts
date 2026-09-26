import { describe, expect, it } from 'vitest';
import { countdownLabel, daysUntil } from '../countdown';
import { moonIllumination, moonLitPath, moonPhase, moonPhaseName } from '../moon';
import { evaluate, formatResult } from '../calculator';
import { formatDuration } from '../stopwatch';

describe('daysUntil', () =>
{
    const now = new Date(2026, 8, 25, 23, 30);
    it('counts calendar days, ignoring the time of day', () =>
    {
        expect(daysUntil('2026-09-26', now)).toBe(1);
        expect(daysUntil('2026-12-25', now)).toBe(91);
    });
    it('is 0 today and negative once past', () =>
    {
        expect(daysUntil('2026-09-25', now)).toBe(0);
        expect(daysUntil('2026-09-20', now)).toBe(-5);
    });
});

describe('countdownLabel', () =>
{
    it('reads naturally in Spanish', () =>
    {
        expect(countdownLabel(3, 'Vacaciones')).toEqual({ number: '3', text: 'días para Vacaciones' });
        expect(countdownLabel(1, 'mi cumpleaños')).toEqual({ number: '1', text: 'día para mi cumpleaños' });
        expect(countdownLabel(0, 'Vacaciones')).toEqual({ number: '¡Hoy!', text: 'Vacaciones' });
        expect(countdownLabel(-2, 'la mudanza')).toEqual({ number: '2', text: 'días desde la mudanza' });
    });
});

describe('moon', () =>
{
    it('knows known full and new moons', () =>
    {
        // full moon 2024-01-25 17:54 UTC, new moon 2024-02-09 22:59 UTC
        expect(moonPhaseName(moonPhase(new Date(Date.UTC(2024, 0, 25, 18))))).toBe('Luna llena');
        expect(moonPhaseName(moonPhase(new Date(Date.UTC(2024, 1, 9, 23))))).toBe('Luna nueva');
    });
    it('lights the whole disc when full and none when new', () =>
    {
        expect(moonIllumination(0.5)).toBeCloseTo(1);
        expect(moonIllumination(0)).toBeCloseTo(0);
    });
});

describe('evaluate', () =>
{
    it('respects precedence', () =>
    {
        expect(evaluate('2+3×4')).toBe(14);
        expect(evaluate('10−4÷2')).toBe(8);
    });
    it('accepts decimals and a leading or post-operator minus', () =>
    {
        expect(evaluate('−1.5×2')).toBe(-3);
        expect(evaluate('3×−2')).toBe(-6);
    });
    it('rejects incomplete or invalid input', () =>
    {
        expect(evaluate('2+')).toBeNull();
        expect(evaluate('1..2')).toBeNull();
        expect(evaluate('')).toBeNull();
    });
});

describe('formatResult', () =>
{
    it('hides floating point noise and shows errors', () =>
    {
        expect(formatResult(0.1 + 0.2)).toBe('0.3');
        expect(formatResult(-4)).toBe('−4');
        expect(formatResult(1 / 0)).toBe('Error');
    });
});

describe('formatDuration', () =>
{
    it('shows tenths under an hour and hours above', () =>
    {
        expect(formatDuration(65_430)).toBe('1:05.4');
        expect(formatDuration(3_725_000)).toBe('1:02:05');
        expect(formatDuration(90_000, false)).toBe('1:30');
    });
});

describe('moonLitPath', () =>
{
    it('draws the right half at first quarter and the whole disc when full', () =>
    {
        // at first quarter the terminator is a straight line (zero-width ellipse)
        expect(moonLitPath(0.25, 20, 20, 17)).toContain('A0 17');
        // full: the left half plus a terminator as wide as the disc, bulging right
        expect(moonLitPath(0.5, 20, 20, 17)).toBe('M20 3A17 17 0 0 0 20 37A17 17 0 0 0 20 3Z');
    });
});
