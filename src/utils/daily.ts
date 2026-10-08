// Picks for "of the day" widgets (tarot cards, gods' messages, couple tips): the same all day long,
// different the next day, and not simply the next one in the list.

/** Days since 1970-01-01 for the local date, so the pick changes at local midnight. */
export function dayNumber(date: Date): number
{
    return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

// a small integer hash (from the "lowbias32" family), so consecutive days land far apart
function hash(n: number): number
{
    let x = n >>> 0;
    x ^= x >>> 16;
    x = Math.imul(x, 0x7feb352d);
    x ^= x >>> 15;
    x = Math.imul(x, 0x846ca68b);
    x ^= x >>> 16;
    return x >>> 0;
}

/**
 * The index of today's pick among `count` items. `salt` makes each widget draw on its own, so the
 * tarot card and the god of the day don't move in step. A pick that would repeat yesterday's draw
 * moves on to the next item, so the same item two days in a row is rare.
 */
export function dailyIndex(date: Date, count: number, salt: string): number
{
    const saltHash = [...salt].reduce((h, c) => hash(h ^ c.charCodeAt(0)), 0);
    const pick = (day: number) => hash(day ^ saltHash) % count;
    const day = dayNumber(date);
    const today = pick(day);
    if (count < 2 || today !== pick(day - 1)) return today;
    return (today + 1) % count;
}

/** A yes/no that holds for the whole day (e.g. whether today's tarot card comes out reversed). */
export function dailyFlag(date: Date, salt: string): boolean
{
    return dailyIndex(date, 2, `${salt}:flag`) === 1;
}
