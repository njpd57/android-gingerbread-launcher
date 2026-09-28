import type { BridgeAppUsage } from "@/types/bridge-fork";

/** Gingerbread's recent apps dialog: 2 rows of 4. */
export const RECENT_APPS_LIMIT = 8;

/**
 * The last used apps from Android's records (Bridge fork, with usage access), most recent first. Includes
 * apps opened outside the launcher. `exclude` leaves out Bridge itself, which is always the last one used.
 */
export function recentFromUsage(
    usage: readonly BridgeAppUsage[],
    isInstalled: (packageName: string) => boolean,
    exclude: readonly string[],
    limit = RECENT_APPS_LIMIT): string[]
{
    return usage
        .filter(u => u.lastTimeUsed !== null && !exclude.includes(u.packageName) && isInstalled(u.packageName))
        .sort((a, b) => (b.lastTimeUsed ?? 0) - (a.lastTimeUsed ?? 0))
        .slice(0, limit)
        .map(u => u.packageName);
}
