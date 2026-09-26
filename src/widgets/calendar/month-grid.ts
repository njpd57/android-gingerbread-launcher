export interface CalendarDay
{
    day: number;
    inMonth: boolean;
    isToday: boolean;
}

export const WEEKS_SHOWN = 6;

/**
 * The 6 x 7 days to show for a month, weeks starting on Monday (as in Spanish calendars),
 * padded with the end of the previous month and the start of the next one.
 * `month` is 0-based, like `Date`.
 */
export function monthGrid(year: number, month: number, today: Date): CalendarDay[]
{
    const start = monthGridStart(year, month);

    const days: CalendarDay[] = [];
    for (let i = 0; i < WEEKS_SHOWN * 7; i++)
    {
        const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        days.push({
            day: d.getDate(),
            inMonth: d.getMonth() === month,
            isToday: d.getFullYear() === today.getFullYear()
                && d.getMonth() === today.getMonth()
                && d.getDate() === today.getDate(),
        });
    }
    return days;
}

/** The first day the grid shows: the Monday on or before the 1st. */
export function monthGridStart(year: number, month: number): Date
{
    // 0 = Monday ... 6 = Sunday
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    return new Date(year, month, 1 - firstWeekday);
}
