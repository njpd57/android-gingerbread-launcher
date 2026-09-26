// Moon phase from the date alone: days since a known new moon, modulo the synodic month.
const SYNODIC_MONTH_DAYS = 29.530588853;
// a new moon: 2000-01-06 18:14 UTC
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/** 0 = new moon, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
export function moonPhase(date: Date): number
{
    const days = (date.getTime() - KNOWN_NEW_MOON_MS) / 86_400_000;
    const phase = (days / SYNODIC_MONTH_DAYS) % 1;
    return phase < 0 ? phase + 1 : phase;
}

/** The lit fraction of the disc, 0 (new) to 1 (full). */
export function moonIllumination(phase: number): number
{
    return (1 - Math.cos(2 * Math.PI * phase)) / 2;
}

const NAMES: [number, string][] = [
    [0.0339, 'Luna nueva'],
    [0.2161, 'Creciente'],
    [0.2839, 'Cuarto creciente'],
    [0.4661, 'Gibosa creciente'],
    [0.5339, 'Luna llena'],
    [0.7161, 'Gibosa menguante'],
    [0.7839, 'Cuarto menguante'],
    [0.9661, 'Menguante'],
    [1, 'Luna nueva'],
];

export function moonPhaseName(phase: number): string
{
    return NAMES.find(([limit]) => phase < limit)?.[1] ?? 'Luna nueva';
}

/**
 * SVG path of the lit part of a moon disc of radius r centered at (cx, cy), as seen from the northern
 * hemisphere (lit on the right while waxing). Mirror it horizontally for the southern hemisphere.
 */
export function moonLitPath(phase: number, cx: number, cy: number, r: number): string
{
    const top = `${cx} ${cy - r}`;
    const bottom = `${cx} ${cy + r}`;
    // the terminator is half an ellipse whose width follows the phase
    const rx = Math.round(Math.abs(r * Math.cos(2 * Math.PI * phase)) * 100) / 100;
    if (phase < 0.5)
    {
        // right half, then back up along the terminator: bulging right (crescent) or left (gibbous)
        const sweep = phase < 0.25 ? 0 : 1;
        return `M${top}A${r} ${r} 0 0 1 ${bottom}A${rx} ${r} 0 0 ${sweep} ${top}Z`;
    }
    // waning: left half, then back up along the terminator: bulging right (gibbous) or left (crescent)
    const sweep = phase < 0.75 ? 0 : 1;
    return `M${top}A${r} ${r} 0 0 0 ${bottom}A${rx} ${r} 0 0 ${sweep} ${top}Z`;
}
