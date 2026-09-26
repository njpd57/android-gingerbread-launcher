import type { BridgeCalendarEvent } from "@/types/bridge-fork";

const DAY_MS = 86_400_000;

/** "2026-09-25" for a local date: the key events are grouped by. */
export function dayKey(date: Date): string
{
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * The local days an event covers. All-day events are stored as UTC midnights (Android's convention),
 * so they're read as UTC dates, or a "Tuesday" birthday would show on Monday west of Greenwich.
 */
export function eventDayKeys(event: BridgeCalendarEvent): string[]
{
    const keys: string[] = [];
    if (event.allDay)
    {
        for (let t = event.begin; t < event.end; t += DAY_MS)
        {
            const d = new Date(t);
            keys.push(dayKey(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
        }
        return keys;
    }

    // timed events: every local day from the start to the last moment (an event ending at midnight doesn't spill over)
    const last = new Date(Math.max(event.begin, event.end - 1));
    for (let d = new Date(event.begin); ; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))
    {
        keys.push(dayKey(d));
        if (dayKey(d) === dayKey(last) || keys.length > 366) break;
    }
    return keys;
}

/** Events by day key, each day in the order given. */
export function eventsByDay(events: BridgeCalendarEvent[]): Map<string, BridgeCalendarEvent[]>
{
    const map = new Map<string, BridgeCalendarEvent[]>();
    for (const e of events)
    {
        for (const key of eventDayKeys(e))
        {
            const list = map.get(key);
            if (list) list.push(e);
            else map.set(key, [e]);
        }
    }
    return map;
}

export interface AgendaDay
{
    key: string;
    /** "Hoy", "Mañana" or "jueves 2". */
    label: string;
    events: BridgeCalendarEvent[];
}

/**
 * The agenda: events that haven't ended, grouped by day starting today, all-day events first in each day.
 * An event spanning several days shows on each of them.
 */
export function agendaDays(events: BridgeCalendarEvent[], now: Date, maxDays = 14): AgendaDay[]
{
    const todayKey = dayKey(now);
    const tomorrowKey = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    const upcoming = events.filter(e => e.allDay ? eventDayKeys(e).some(k => k >= todayKey) : e.end > now.getTime());

    const days: AgendaDay[] = [];
    for (let i = 0; i < maxDays; i++)
    {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const key = dayKey(date);
        const dayEvents = upcoming
            .filter(e => eventDayKeys(e).includes(key))
            .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.begin - b.begin);
        if (dayEvents.length === 0) continue;

        const label = key === todayKey ? 'Hoy'
            : key === tomorrowKey ? 'Mañana'
                : date.toLocaleDateString('es', { weekday: 'long', day: 'numeric' });
        days.push({ key, label, events: dayEvents });
    }
    return days;
}

/** "Todo el día", or the start time in the status bar's 12-hour style ("9:05 AM"). */
export function formatEventTime(event: BridgeCalendarEvent): string
{
    if (event.allDay) return 'Todo el día';
    const d = new Date(event.begin);
    const h = d.getHours();
    return `${h % 12 === 0 ? 12 : h % 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
