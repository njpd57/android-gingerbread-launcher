import { describe, expect, it } from 'vitest';
import { brightnessIndicator, nightModeIndicator, onOffIndicator, ringerModeIndicator } from '../indicators';

describe('onOffIndicator', () =>
{
    it('is green when on and gray when off', () =>
    {
        expect(onOffIndicator(true)).toBe('on');
        expect(onOffIndicator(false)).toBe('off');
    });
});

describe('brightnessIndicator', () =>
{
    it('lights up for auto and high, amber for mid, gray for low', () =>
    {
        expect(brightnessIndicator('auto')).toBe('on');
        expect(brightnessIndicator('high')).toBe('on');
        expect(brightnessIndicator('mid')).toBe('mid');
        expect(brightnessIndicator('low')).toBe('off');
    });
});

describe('nightModeIndicator', () =>
{
    it('follows the system night mode', () =>
    {
        expect(nightModeIndicator('yes', true)).toBe('on');
        expect(nightModeIndicator('auto', true)).toBe('mid');
        expect(nightModeIndicator('custom', true)).toBe('mid');
        expect(nightModeIndicator('no', true)).toBe('off');
        expect(nightModeIndicator('error', true)).toBe('off');
    });

    it('is off without the permission to change it', () =>
    {
        expect(nightModeIndicator('yes', false)).toBe('off');
    });
});

describe('ringerModeIndicator', () =>
{
    it('lights up for normal, amber for vibrate, gray for silent', () =>
    {
        expect(ringerModeIndicator('normal')).toBe('on');
        expect(ringerModeIndicator('vibrate')).toBe('mid');
        expect(ringerModeIndicator('silent')).toBe('off');
    });
});
