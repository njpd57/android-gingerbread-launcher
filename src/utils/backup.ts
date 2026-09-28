/**
 * Backup of the whole desktop: everything the launcher keeps in localStorage (screens, folders,
 * widgets and their data, settings, recents, the weather city). The photo frame's photos live in
 * IndexedDB and aren't included.
 */

export const BACKUP_FORMAT = 'gingerbread-launcher-backup';
export const BACKUP_VERSION = 1;

/** localStorage keys that belong to the launcher; new keys under these prefixes are backed up too. */
export const BACKUP_PREFIXES = ['home.', 'launcher.', 'settings.', 'widgets.', 'weather.'];

export interface LauncherBackup
{
    format: typeof BACKUP_FORMAT;
    version: number;
    /** ISO date. */
    createdAt: string;
    /** Raw localStorage values, by key. */
    data: Record<string, string>;
}

/** The subset of `Storage` used here, so tests can pass a plain object. */
export interface KeyValueStorage
{
    readonly length: number;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

function isLauncherKey(key: string)
{
    return BACKUP_PREFIXES.some(p => key.startsWith(p));
}

function launcherKeys(storage: KeyValueStorage)
{
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++)
    {
        const key = storage.key(i);
        if (key !== null && isLauncherKey(key)) keys.push(key);
    }
    return keys.sort();
}

export function createBackup(storage: KeyValueStorage, now = new Date()): LauncherBackup
{
    const data: Record<string, string> = {};
    for (const key of launcherKeys(storage))
    {
        const value = storage.getItem(key);
        if (value !== null) data[key] = value;
    }
    return { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: now.toISOString(), data };
}

/** `gingerbread-launcher-2026-09-28.json` */
export function backupFileName(now = new Date())
{
    const pad = (n: number) => String(n).padStart(2, '0');
    return `gingerbread-launcher-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

/** Reads a backup file's text. Throws with a message for the user if it isn't one. */
export function parseBackup(text: string): LauncherBackup
{
    let json: unknown;
    try
    {
        json = JSON.parse(text);
    }
    catch
    {
        throw new Error('El archivo no es una copia de seguridad del launcher.');
    }

    const b = json as Partial<LauncherBackup> | null;
    if (!b || typeof b !== 'object' || b.format !== BACKUP_FORMAT || typeof b.data !== 'object' || b.data === null)
        throw new Error('El archivo no es una copia de seguridad del launcher.');
    if (typeof b.version !== 'number' || b.version > BACKUP_VERSION)
        throw new Error('La copia es de una versión más nueva del launcher.');
    if (Object.entries(b.data).some(([k, v]) => !isLauncherKey(k) || typeof v !== 'string'))
        throw new Error('La copia de seguridad está dañada.');

    return {
        format: BACKUP_FORMAT,
        version: b.version,
        createdAt: typeof b.createdAt === 'string' ? b.createdAt : '',
        data: b.data as Record<string, string>,
    };
}

/** Replaces the launcher's data with the backup's: its keys are written, and launcher keys it lacks are removed. */
export function restoreBackup(storage: KeyValueStorage, backup: LauncherBackup)
{
    for (const key of launcherKeys(storage))
        storage.removeItem(key);
    for (const [key, value] of Object.entries(backup.data))
        storage.setItem(key, value);
}
