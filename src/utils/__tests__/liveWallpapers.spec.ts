import { describe, expect, it } from 'vitest';
import { clockMinutes, grassSky, lerpRGB, polarClockFractions } from '../liveWallpapers';

const SUNRISE = 7 * 60;
const SUNSET = 19 * 60;

describe('grassSky', () =>
{
    it('is night with full stars before dawn and after dusk', () =>
    {
        expect(grassSky(3 * 60, SUNRISE, SUNSET).stars).toBe(1);
        expect(grassSky(23 * 60, SUNRISE, SUNSET).stars).toBe(1);
    });

    it('is day without stars at noon', () =>
    {
        const noon = grassSky(12 * 60, SUNRISE, SUNSET);
        expect(noon.stars).toBe(0);
        expect(noon.top).toEqual([58, 128, 214]);
    });

    it('turns orange at the horizon at sunrise and sunset', () =>
    {
        expect(grassSky(SUNRISE, SUNRISE, SUNSET).bottom[0]).toBeGreaterThan(200);
        expect(grassSky(SUNSET, SUNRISE, SUNSET).bottom[0]).toBeGreaterThan(200);
    });

    it('blends between stops', () =>
    {
        const halfway = grassSky(SUNRISE - 30, SUNRISE, SUNSET);
        expect(halfway.stars).toBeCloseTo(0.6);
    });
});

describe('clockMinutes', () =>
{
    it('reads the time of an Open-Meteo sun time', () =>
    {
        expect(clockMinutes('2026-09-26T07:12')).toBe(432);
        expect(clockMinutes('nope')).toBeNull();
    });
});

describe('lerpRGB', () =>
{
    it('interpolates and rounds each channel', () =>
    {
        expect(lerpRGB([0, 0, 0], [255, 100, 11], 0.5)).toEqual([128, 50, 6]);
    });
});

describe('polarClockFractions', () =>
{
    it('fills each ring by its unit', () =>
    {
        // Wednesday 2026-09-16, 18:30:15
        const f = polarClockFractions(new Date(2026, 8, 16, 18, 30, 15));
        expect(f.seconds).toBeCloseTo(15 / 60);
        expect(f.minutes).toBeCloseTo((30 + 15 / 60) / 60);
        expect(f.hours).toBeCloseTo((18 + 30.25 / 60) / 24);
        expect(f.weekday).toBeCloseTo((2 + f.hours) / 7);
        expect(f.monthDay).toBeCloseTo((15 + f.hours) / 30);
        expect(f.month).toBeCloseTo((8 + f.monthDay) / 12);
    });

    it('starts the week on Monday', () =>
    {
        expect(polarClockFractions(new Date(2026, 8, 14, 0, 0, 0)).weekday).toBe(0);
    });
});
