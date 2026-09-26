import type { BridgeAppUsage } from "@/types/bridge-fork";

/** "2 h 15 min", "15 min" or "menos de 1 min". */
export function formatDuration(ms: number): string
{
    const totalMinutes = Math.floor(ms / 60_000);
    if (totalMinutes < 1) return 'menos de 1 min';
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    if (h === 0) return `${m} min`;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Total time in apps (only the given, installed ones count, so system UI and the launcher itself don't). */
export function totalScreenTime(usage: readonly BridgeAppUsage[], isInstalled: (packageName: string) => boolean): number
{
    return usage.filter(u => isInstalled(u.packageName)).reduce((sum, u) => sum + u.totalTimeMs, 0);
}

/** The apps used the longest, longest first. */
export function topAppsByTime(usage: readonly BridgeAppUsage[], isInstalled: (packageName: string) => boolean, limit: number): BridgeAppUsage[]
{
    return usage
        .filter(u => u.totalTimeMs > 0 && isInstalled(u.packageName))
        .sort((a, b) => b.totalTimeMs - a.totalTimeMs)
        .slice(0, limit);
}
