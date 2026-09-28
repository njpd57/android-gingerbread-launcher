import type { LaunchCounts } from './mostUsed';

/** The drawer's order: by name, or the most launched apps first. */
export type DrawerSort = 'name' | 'mostUsed';

export interface DrawerApp
{
    /** `appKey()`, which the hidden list and the launch counts use too. */
    key: string;
    label: string;
}

/** The apps the drawer shows, in the chosen order, without the hidden ones. */
export function drawerApps<T extends DrawerApp>(
    apps: Iterable<T>,
    sort: DrawerSort,
    hidden: readonly string[],
    counts: LaunchCounts): T[]
{
    const hiddenKeys = new Set(hidden);
    const byName = (a: T, b: T) => a.label.localeCompare(b.label);
    const visible = [...apps].filter(a => !hiddenKeys.has(a.key));
    return sort === 'mostUsed'
        ? visible.sort((a, b) => (counts[b.key] ?? 0) - (counts[a.key] ?? 0) || byName(a, b))
        : visible.sort(byName);
}

/** The hidden list with `key` hidden or shown. */
export function setAppHidden(hidden: readonly string[], key: string, hide: boolean): string[]
{
    const rest = hidden.filter(k => k !== key);
    return hide ? [...rest, key] : rest;
}
