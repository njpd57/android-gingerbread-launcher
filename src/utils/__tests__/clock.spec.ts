import { describe, expect, it } from 'vitest';
import { findClockApp, formatClockTime } from '../clock';

describe('findClockApp', () =>
{
    it('returns the first known clock package that is installed', () =>
    {
        const installed = new Set(['com.google.android.deskclock', 'com.android.deskclock']);
        expect(findClockApp(p => installed.has(p))).toBe('com.google.android.deskclock');
    });

    it('returns null when none of the known packages are installed', () =>
    {
        expect(findClockApp(() => false)).toBeNull();
    });
});

describe('formatClockTime', () =>
{
    it('writes 12-hour times with AM/PM, like the status bar', () =>
    {
        expect(formatClockTime(new Date(2026, 8, 26, 7, 5))).toBe('7:05 AM');
        expect(formatClockTime(new Date(2026, 8, 26, 0, 30))).toBe('12:30 AM');
        expect(formatClockTime(new Date(2026, 8, 26, 19, 0))).toBe('7:00 PM');
    });
});
