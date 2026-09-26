import type { BridgeAppUsage } from "@/types/bridge-fork";

/** Launch counts per package name, kept by useAppLauncherStore. */
export type LaunchCounts = Record<string, number>;

export function recordLaunch(counts: LaunchCounts, packageName: string): LaunchCounts
{
    return { ...counts, [packageName]: (counts[packageName] ?? 0) + 1 };
}

export function forgetApp(counts: LaunchCounts, packageName: string): LaunchCounts
{
    const { [packageName]: _, ...rest } = counts;
    return rest;
}

/**
 * The most launched apps, most first. Ties go to the more recently used one, and recent apps that
 * were never counted (launched before the counter existed) fill the remaining places, so the widget
 * isn't empty at first. Apps that are no longer installed are skipped.
 */
export function mostUsedApps(
    counts: LaunchCounts,
    recent: readonly string[],
    isInstalled: (packageName: string) => boolean,
    limit: number): string[]
{
    const recency = (p: string) =>
    {
        const i = recent.indexOf(p);
        return i < 0 ? Infinity : i;
    };

    const candidates = new Set([...Object.keys(counts), ...recent]);
    return [...candidates]
        .filter(isInstalled)
        .sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || recency(a) - recency(b) || a.localeCompare(b))
        .slice(0, limit);
}

/**
 * The most used apps from Android's own records (Bridge fork, with usage access): most opened first,
 * then by time in use. Unlike the launch counts, this includes apps opened from notifications, other apps
 * or Recents. Apps that aren't installed launchable apps (system UI, keyboards…) are skipped.
 */
export function mostUsedFromUsage(
    usage: readonly BridgeAppUsage[],
    isInstalled: (packageName: string) => boolean,
    limit: number): string[]
{
    return usage
        .filter(u => u.openCount > 0 && isInstalled(u.packageName))
        .sort((a, b) => b.openCount - a.openCount || b.totalTimeMs - a.totalTimeMs)
        .slice(0, limit)
        .map(u => u.packageName);
}
