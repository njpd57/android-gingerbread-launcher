const DAY_MS = 86_400_000;

/** Whole days from `now`'s calendar day to `date` ("YYYY-MM-DD", local): 0 today, negative once past. */
export function daysUntil(date: string, now: Date): number
{
    const [y, m, d] = date.split('-').map(Number);
    const target = Date.UTC(y, m - 1, d);
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / DAY_MS);
}

/** The line under the number: "días para …", "¡Hoy es …!", "hace … días". */
export function countdownLabel(days: number, title: string): { number: string; text: string }
{
    const what = title.trim() || 'la fecha';
    if (days === 0) return { number: '¡Hoy!', text: what };
    if (days > 0) return { number: String(days), text: `${days === 1 ? 'día' : 'días'} para ${what}` };
    const ago = -days;
    return { number: String(ago), text: `${ago === 1 ? 'día' : 'días'} desde ${what}` };
}
