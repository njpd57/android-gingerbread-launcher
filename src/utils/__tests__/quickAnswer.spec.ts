import { describe, expect, it } from 'vitest';
import { convertUnits, evaluateExpression, parseLocaleNumber, quickAnswer } from '../quickAnswer';

describe('parseLocaleNumber', () =>
{
    it('reads Chilean thousands and decimals', () =>
    {
        expect(parseLocaleNumber('48.000')).toBe(48000);
        expect(parseLocaleNumber('1.234.567')).toBe(1234567);
        expect(parseLocaleNumber('2,5')).toBe(2.5);
        expect(parseLocaleNumber('1.234,5')).toBe(1234.5);
        expect(parseLocaleNumber('3.5')).toBe(3.5);
        expect(parseLocaleNumber('1.2.3')).toBeNull();
    });
});

describe('evaluateExpression', () =>
{
    it('does arithmetic with precedence, parentheses and powers', () =>
    {
        expect(evaluateExpression('2+3*4')).toBe(14);
        expect(evaluateExpression('(2+3)*4')).toBe(20);
        expect(evaluateExpression('10 / 4')).toBe(2.5);
        expect(evaluateExpression('2^10')).toBe(1024);
        expect(evaluateExpression('-3 x 2')).toBe(-6);
        expect(evaluateExpression('7 ÷ 2')).toBe(3.5);
    });

    it('understands percentages like a pocket calculator', () =>
    {
        expect(evaluateExpression('15% de 48.000')).toBe(7200);
        expect(evaluateExpression('20% of 50')).toBe(10);
        expect(evaluateExpression('48000 + 19%')).toBeCloseTo(57120);
        expect(evaluateExpression('100 - 10%')).toBe(90);
        expect(evaluateExpression('50%')).toBe(0.5);
    });

    it("doesn't answer plain numbers, phone numbers or text", () =>
    {
        expect(evaluateExpression('2026')).toBeNull();
        expect(evaluateExpression('+56 9 1234 5678')).toBeNull();
        expect(evaluateExpression('whatsapp')).toBeNull();
        expect(evaluateExpression('3 +')).toBeNull();
        expect(evaluateExpression('1/0')).toBeNull();
        expect(evaluateExpression('10 de 20')).toBeNull();
    });
});

describe('convertUnits', () =>
{
    it('converts between units of the same kind', () =>
    {
        expect(convertUnits('3 km en millas')?.value).toBeCloseTo(1.864, 3);
        expect(convertUnits('10 kg a lb')?.value).toBeCloseTo(22.046, 3);
        expect(convertUnits('1,5 litros en ml')?.value).toBeCloseTo(1500);
        expect(convertUnits('100 km/h en mph')?.value).toBeCloseTo(62.137, 3);
        expect(convertUnits('2 GB en MB')?.value).toBeCloseTo(2000);
    });

    it('converts temperatures', () =>
    {
        expect(convertUnits('100 f en c')?.value).toBeCloseTo(37.778, 3);
        expect(convertUnits('-40 °C en °F')?.value).toBeCloseTo(-40);
        expect(convertUnits('0 celsius en kelvin')?.value).toBeCloseTo(273.15);
    });

    it('accepts accents and writes the result with its unit', () =>
    {
        const a = convertUnits('5 kilómetros en metros');
        expect(a?.text).toBe('5.000 m');
        expect(a?.question).toBe('5 km → m');
    });

    it('refuses mixed or unknown units', () =>
    {
        expect(convertUnits('3 km en kg')).toBeNull();
        expect(convertUnits('3 pesos en dolares')).toBeNull();
    });
});

describe('quickAnswer', () =>
{
    it('formats results the Chilean way', () =>
    {
        expect(quickAnswer('15% de 48.000')?.text).toBe('7.200');
        expect(quickAnswer('10 / 4')?.text).toBe('2,5');
        expect(quickAnswer('0.1 + 0.2')?.text).toBe('0,3');
    });

    it('is null for ordinary searches', () =>
    {
        expect(quickAnswer('cámara')).toBeNull();
        expect(quickAnswer('')).toBeNull();
    });
});
