import { describe, expect, it } from 'vitest';
import { formatNotificationTime, notificationPanelSections, statusBarNotifications } from '../notifications';
import type { BridgeNotification } from '@/types/bridge-fork';

function notification(key: string, packageName: string, postTime: number, extra: Partial<BridgeNotification> = {}): BridgeNotification
{
    return {
        key, packageName, postTime,
        title: null, text: null, subText: null, category: null,
        isOngoing: false, isClearable: true, isGroupSummary: false, isMedia: false, hasLargeIcon: false, actions: [],
        ...extra,
    };
}

describe('statusBarNotifications', () =>
{
    it('keeps only the newest notification of each app, newest first', () =>
    {
        const result = statusBarNotifications([
            notification('a1', 'com.a', 100),
            notification('b1', 'com.b', 200),
            notification('a2', 'com.a', 300),
        ]);
        expect(result.map(n => n.key)).toEqual(['a2', 'b1']);
    });

    it('skips group summaries', () =>
    {
        const result = statusBarNotifications([
            notification('summary', 'com.a', 500, { isGroupSummary: true }),
            notification('child', 'com.a', 400),
        ]);
        expect(result.map(n => n.key)).toEqual(['child']);
    });

    it('shows at most `max` icons', () =>
    {
        const many = Array.from({ length: 10 }, (_, i) => notification(`k${i}`, `com.app${i}`, i));
        expect(statusBarNotifications(many, 4)).toHaveLength(4);
    });
});

describe('notificationPanelSections', () =>
{
    it('splits ongoing notifications from the rest, newest first, without group summaries', () =>
    {
        const sections = notificationPanelSections([
            notification('old', 'com.a', 100),
            notification('usb', 'android', 50, { isOngoing: true }),
            notification('new', 'com.b', 300),
            notification('summary', 'com.b', 400, { isGroupSummary: true }),
        ]);
        expect(sections.ongoing.map(n => n.key)).toEqual(['usb']);
        expect(sections.others.map(n => n.key)).toEqual(['new', 'old']);
    });

    it('leaves out media notifications when the panel shows its own player', () =>
    {
        const list = [
            notification('player', 'com.spotify.music', 100, { isOngoing: true, isMedia: true }),
            notification('download', 'com.spotify.music', 50, { isOngoing: true }),
        ];
        expect(notificationPanelSections(list, true).ongoing.map(n => n.key)).toEqual(['download']);
        expect(notificationPanelSections(list, false).ongoing.map(n => n.key)).toEqual(['player', 'download']);
    });
});

describe('formatNotificationTime', () =>
{
    const now = new Date(2026, 8, 25, 22, 0);

    it('shows the time for notifications from today', () =>
    {
        expect(formatNotificationTime(new Date(2026, 8, 25, 9, 5).getTime(), now)).toBe('9:05 AM');
        expect(formatNotificationTime(new Date(2026, 8, 25, 12, 30).getTime(), now)).toBe('12:30 PM');
        expect(formatNotificationTime(new Date(2026, 8, 25, 0, 15).getTime(), now)).toBe('12:15 AM');
    });

    it('shows the date for older notifications', () =>
    {
        expect(formatNotificationTime(new Date(2026, 8, 24, 23, 59).getTime(), now)).toBe('24/9/26');
    });
});
