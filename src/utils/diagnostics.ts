// Helpers for the "Acerca de y diagnóstico" dialog (menu/AboutDialog.vue).

export interface RecentBridgeEvent
{
    /** Milliseconds since the epoch. */
    time: number;
    name: string;
    /** The rest of the event, short enough for one line. */
    detail: string;
}

export const MAX_DETAIL_LENGTH = 80;

/** One line for an event: its name, and its payload as compact JSON (numbers rounded to 1 decimal). */
export function summarizeEvent(event: { name: string } & Record<string, unknown>, time: number): RecentBridgeEvent
{
    const { name, ...rest } = event;
    let detail = Object.keys(rest).length === 0 ? '' : JSON.stringify(rest, (_, v) =>
        typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 10) / 10 : v);
    if (detail.length > MAX_DETAIL_LENGTH)
        detail = detail.slice(0, MAX_DETAIL_LENGTH - 1) + '…';
    return { time, name, detail };
}

/**
 * A fixed-size log that overwrites its oldest entry, so recording costs one assignment and no
 * allocation (Bridge sends dozens of events per keyboard animation).
 */
export class RingLog<T>
{
    private readonly items: T[] = [];
    private next = 0;

    constructor(private readonly max: number) { }

    push(item: T)
    {
        this.items[this.next % this.max] = item;
        this.next++;
    }

    /** Newest first. */
    newestFirst(): T[]
    {
        const count = Math.min(this.next, this.max);
        const out: T[] = [];
        for (let i = 1; i <= count; i++)
            out.push(this.items[(this.next - i) % this.max]);
        return out;
    }
}

/** Insets as "top right bottom left", rounded, like CSS shorthand. */
export function formatInsets(i: { top: number; right: number; bottom: number; left: number }): string
{
    return [i.top, i.right, i.bottom, i.left].map(v => Math.round(v)).join(' ');
}
