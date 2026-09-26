// Pure logic behind the live wallpapers (src/wallpaper/): the grass sky through the day and the
// polar clock's rings.

export type RGB = [number, number, number];

export function lerpRGB(a: RGB, b: RGB, t: number): RGB
{
    return [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
}

export interface GrassSky
{
    top: RGB;
    bottom: RGB;
    grass: RGB;
    /** How visible the stars are, 0 to 1. */
    stars: number;
}

const NIGHT: GrassSky = { top: [2, 4, 14], bottom: [12, 22, 48], grass: [6, 20, 9], stars: 1 };
const DAWN: GrassSky = { top: [44, 62, 122], bottom: [238, 150, 92], grass: [38, 68, 24], stars: 0.2 };
const DAY: GrassSky = { top: [58, 128, 214], bottom: [172, 214, 240], grass: [68, 138, 40], stars: 0 };
const DUSK: GrassSky = { top: [46, 44, 108], bottom: [240, 118, 70], grass: [42, 62, 24], stars: 0.3 };

// how long dawn and dusk take on each side of sunrise and sunset
const TWILIGHT_MIN = 60;

function lerpSky(a: GrassSky, b: GrassSky, t: number): GrassSky
{
    return {
        top: lerpRGB(a.top, b.top, t),
        bottom: lerpRGB(a.bottom, b.bottom, t),
        grass: lerpRGB(a.grass, b.grass, t),
        stars: a.stars + (b.stars - a.stars) * t,
    };
}

/**
 * The Grass wallpaper's colors at `minute` (minutes since midnight): night, an orange dawn around
 * `sunrise`, blue day, an orange dusk around `sunset`, night again. Like the original, which took the
 * real sunrise and sunset for the phone's location.
 */
export function grassSky(minute: number, sunrise: number, sunset: number): GrassSky
{
    const stops: [number, GrassSky][] = [
        [sunrise - TWILIGHT_MIN, NIGHT],
        [sunrise, DAWN],
        [sunrise + TWILIGHT_MIN, DAY],
        [sunset - TWILIGHT_MIN, DAY],
        [sunset, DUSK],
        [sunset + TWILIGHT_MIN, NIGHT],
    ];
    if (minute <= stops[0][0] || minute >= stops[stops.length - 1][0]) return NIGHT;
    for (let i = 0; i < stops.length - 1; i++)
    {
        const [t0, a] = stops[i];
        const [t1, b] = stops[i + 1];
        if (minute < t1)
            return t1 > t0 ? lerpSky(a, b, (minute - t0) / (t1 - t0)) : b;
    }
    return NIGHT;
}

/** Minutes since midnight of a "YYYY-MM-DDTHH:mm" time (Open-Meteo's sunrise/sunset), or null. */
export function clockMinutes(isoLocal: string): number | null
{
    const m = /T(\d{2}):(\d{2})/.exec(isoLocal);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export type PolarRing = 'seconds' | 'minutes' | 'hours' | 'weekday' | 'monthDay' | 'month';

/** The polar clock's rings, from outside in. */
export const POLAR_RINGS: PolarRing[] = ['seconds', 'minutes', 'hours', 'weekday', 'monthDay', 'month'];

/** How full each polar clock ring is (0 to 1) at `d`; weeks start on Monday. */
export function polarClockFractions(d: Date): Record<PolarRing, number>
{
    const seconds = (d.getSeconds() + d.getMilliseconds() / 1000) / 60;
    const minutes = (d.getMinutes() + seconds) / 60;
    const hours = (d.getHours() + minutes) / 24;
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const monthDay = (d.getDate() - 1 + hours) / daysInMonth;
    return {
        seconds,
        minutes,
        hours,
        weekday: ((d.getDay() + 6) % 7 + hours) / 7,
        monthDay,
        month: (d.getMonth() + monthDay) / 12,
    };
}
