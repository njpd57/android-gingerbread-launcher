import { describe, expect, it } from 'vitest';
import { brightnessStep, nextBrightnessStep } from '../brightness';

describe('brightnessStep', () =>
{
    it('is auto whenever automatic brightness is on', () =>
    {
        expect(brightnessStep({ isAuto: true, level: 0.1 })).toBe('auto');
    });

    it('rounds a manual level to the closest step', () =>
    {
        expect(brightnessStep({ isAuto: false, level: 0.05 })).toBe('low');
        expect(brightnessStep({ isAuto: false, level: 0.4 })).toBe('mid');
        expect(brightnessStep({ isAuto: false, level: 0.8 })).toBe('high');
    });
});

describe('nextBrightnessStep', () =>
{
    it('cycles auto, low, mid, high and back to auto', () =>
    {
        expect(nextBrightnessStep('auto')).toBe('low');
        expect(nextBrightnessStep('low')).toBe('mid');
        expect(nextBrightnessStep('mid')).toBe('high');
        expect(nextBrightnessStep('high')).toBe('auto');
    });
});
