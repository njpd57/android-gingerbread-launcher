import { describe, expect, it } from 'vitest';
import { agendaDays, eventDayKeys, eventsByDay, formatEventTime } from '../calendar-events';
import type { BridgeCalendarEvent } from '@/types/bridge-fork';

function event(extra: Partial<BridgeCalendarEvent>): BridgeCalendarEvent
{
    return {
        eventId: 1, title: 'Event', location: null,
        begin: new Date(2026, 8, 25, 10).getTime(), end: new Date(2026, 8, 25, 11).getTime(),
        allDay: false, color: '#4285f4', calendarName: null,
        ...extra,
    };
}

describe('eventDayKeys', () =>
{
    it('is the local day of a short event', () =>
    {
        expect(eventDayKeys(event({}))).toEqual(['2026-09-25']);
    });

    it('covers every day of an event spanning midnight', () =>
    {
        const e = event({ begin: new Date(2026, 8, 25, 22).getTime(), end: new Date(2026, 8, 26, 2).getTime() });
        expect(eventDayKeys(e)).toEqual(['2026-09-25', '2026-09-26']);
    });

    it('does not spill into the next day when ending at midnight', () =>
    {
        const e = event({ begin: new Date(2026, 8, 25, 22).getTime(), end: new Date(2026, 8, 26, 0).getTime() });
        expect(eventDayKeys(e)).toEqual(['2026-09-25']);
    });

    it('reads all-day events as UTC dates', () =>
    {
        const begin = Date.UTC(2026, 8, 27);
        expect(eventDayKeys(event({ allDay: true, begin, end: begin + 2 * 86_400_000 }))).toEqual(['2026-09-27', '2026-09-28']);
    });
});

describe('eventsByDay', () =>
{
    it('lists each event under every day it covers', () =>
    {
        const a = event({ eventId: 1 });
        const b = event({ eventId: 2, begin: new Date(2026, 8, 25, 23).getTime(), end: new Date(2026, 8, 26, 1).getTime() });
        const map = eventsByDay([a, b]);
        expect(map.get('2026-09-25')?.map(e => e.eventId)).toEqual([1, 2]);
        expect(map.get('2026-09-26')?.map(e => e.eventId)).toEqual([2]);
    });
});

describe('agendaDays', () =>
{
    const now = new Date(2026, 8, 25, 12);

    it('groups upcoming events by day, labelling today and tomorrow, all-day events first', () =>
    {
        const allDayBegin = Date.UTC(2026, 8, 26);
        const days = agendaDays([
            event({ eventId: 1, begin: new Date(2026, 8, 25, 15).getTime(), end: new Date(2026, 8, 25, 16).getTime() }),
            event({ eventId: 2, begin: new Date(2026, 8, 26, 9).getTime(), end: new Date(2026, 8, 26, 10).getTime() }),
            event({ eventId: 3, allDay: true, begin: allDayBegin, end: allDayBegin + 86_400_000 }),
            event({ eventId: 4, begin: new Date(2026, 8, 28, 9).getTime(), end: new Date(2026, 8, 28, 10).getTime() }),
        ], now);
        expect(days.map(d => d.label)).toEqual(['Hoy', 'Mañana', new Date(2026, 8, 28).toLocaleDateString('es', { weekday: 'long', day: 'numeric' })]);
        expect(days[1].events.map(e => e.eventId)).toEqual([3, 2]);
    });

    it('leaves out events that already ended', () =>
    {
        expect(agendaDays([event({})], now)).toEqual([]);
    });
});

describe('formatEventTime', () =>
{
    it('shows the start time, or that it lasts all day', () =>
    {
        expect(formatEventTime(event({ begin: new Date(2026, 8, 25, 9, 5).getTime() }))).toBe('9:05 AM');
        expect(formatEventTime(event({ begin: new Date(2026, 8, 25, 18, 30).getTime() }))).toBe('6:30 PM');
        expect(formatEventTime(event({ allDay: true }))).toBe('Todo el día');
    });
});
