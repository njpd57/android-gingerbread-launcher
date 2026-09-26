import type { BridgeNotification } from "@/types/bridge-fork";

/**
 * The notifications to show as status bar icons: one per app (its newest), newest first, like Android's
 * status bar. Group summaries are skipped because their group's notifications are listed too.
 */
export function statusBarNotifications(notifications: Iterable<BridgeNotification>, max = 6): BridgeNotification[]
{
    const newestPerApp = new Map<string, BridgeNotification>();
    for (const n of notifications)
    {
        if (n.isGroupSummary) continue;
        const current = newestPerApp.get(n.packageName);
        if (!current || n.postTime > current.postTime)
            newestPerApp.set(n.packageName, n);
    }

    return [...newestPerApp.values()]
        .sort((a, b) => b.postTime - a.postTime)
        .slice(0, max);
}

export interface NotificationPanelSections
{
    ongoing: BridgeNotification[];
    others: BridgeNotification[];
}

/**
 * Gingerbread's notification panel: "ongoing" ones first, then the rest, each newest first.
 * With `hideMedia`, media players' notifications are left out, because the panel shows its own player.
 */
export function notificationPanelSections(notifications: Iterable<BridgeNotification>, hideMedia = false): NotificationPanelSections
{
    const shown = [...notifications]
        .filter(n => !n.isGroupSummary && !(hideMedia && n.isMedia))
        .sort((a, b) => b.postTime - a.postTime);

    return {
        ongoing: shown.filter(n => n.isOngoing),
        others: shown.filter(n => !n.isOngoing),
    };
}

/** "11:02 AM" for today (like the status bar clock), a short date otherwise. */
export function formatNotificationTime(postTime: number, now: Date): string
{
    const date = new Date(postTime);
    if (date.toDateString() !== now.toDateString())
        return `${date.getDate()}/${date.getMonth() + 1}/${String(date.getFullYear()).slice(-2)}`;

    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
