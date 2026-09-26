// Known clock apps, for opening one when the clock widgets are tapped (idea 34) without our Bridge
// fork's `requestOpenAlarms` (not implemented yet: it would launch AlarmClock.ACTION_SHOW_ALARMS
// and open whichever clock app the user has, with no package list).
export const CLOCK_APP_PACKAGES = [
    'com.sec.android.app.clockpackage', // Samsung
    'com.google.android.deskclock',     // Google
    'com.android.deskclock',            // AOSP
];

/** The first installed clock app from the known list, or null if none is installed. */
export function findClockApp(isInstalled: (packageName: string) => boolean): string | null
{
    return CLOCK_APP_PACKAGES.find(isInstalled) ?? null;
}

/** A time as Gingerbread's status bar writes it, 12-hour with AM/PM: "7:05 AM". */
export function formatClockTime(date: Date): string
{
    const h = date.getHours();
    return `${h % 12 === 0 ? 12 : h % 12}:${String(date.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
