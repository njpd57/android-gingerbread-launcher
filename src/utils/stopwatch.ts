/** "m:ss.d" under an hour, "h:mm:ss" above, for the stopwatch and timer. */
export function formatDuration(ms: number, tenths = true): string
{
    const total = Math.max(0, ms);
    const h = Math.floor(total / 3_600_000);
    const m = Math.floor(total / 60_000) % 60;
    const s = Math.floor(total / 1000) % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return tenths ? `${m}:${pad(s)}.${Math.floor(total / 100) % 10}` : `${m}:${pad(s)}`;
}
