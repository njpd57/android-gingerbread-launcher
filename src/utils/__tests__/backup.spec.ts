import { describe, expect, it } from 'vitest';
import { backupFileName, createBackup, parseBackup, restoreBackup, type KeyValueStorage } from '../backup';

function memoryStorage(init: Record<string, string>): KeyValueStorage & { data: Record<string, string> }
{
    const data = { ...init };
    return {
        data,
        get length() { return Object.keys(data).length; },
        key: i => Object.keys(data)[i] ?? null,
        getItem: k => data[k] ?? null,
        setItem: (k, v) => { data[k] = v; },
        removeItem: k => { delete data[k]; },
    };
}

describe('createBackup', () =>
{
    it('keeps only the launcher keys', () =>
    {
        const storage = memoryStorage({ 'home.items': '[]', 'settings.wallpaper': '"nexus"', 'other': 'x' });
        const backup = createBackup(storage, new Date('2026-09-28T10:00:00Z'));
        expect(backup.data).toEqual({ 'home.items': '[]', 'settings.wallpaper': '"nexus"' });
        expect(backup.createdAt).toBe('2026-09-28T10:00:00.000Z');
    });
});

describe('parseBackup', () =>
{
    it('reads back what createBackup wrote', () =>
    {
        const backup = createBackup(memoryStorage({ 'widgets.data': '{}' }));
        expect(parseBackup(JSON.stringify(backup))).toEqual(backup);
    });

    it('rejects files that are not backups', () =>
    {
        expect(() => parseBackup('hola')).toThrow('no es una copia');
        expect(() => parseBackup('{"apps":[]}')).toThrow('no es una copia');
        expect(() => parseBackup(JSON.stringify({ format: 'gingerbread-launcher-backup', version: 99, data: {} })))
            .toThrow('más nueva');
        expect(() => parseBackup(JSON.stringify({ format: 'gingerbread-launcher-backup', version: 1, data: { evil: 'x' } })))
            .toThrow('dañada');
    });
});

describe('restoreBackup', () =>
{
    it('replaces the launcher keys and leaves the rest alone', () =>
    {
        const storage = memoryStorage({ 'home.items': '[1]', 'home.gridRows': '5', 'other': 'x' });
        restoreBackup(storage, parseBackup(JSON.stringify(createBackup(memoryStorage({ 'home.items': '[2]' })))));
        expect(storage.data).toEqual({ 'home.items': '[2]', 'other': 'x' });
    });
});

describe('backupFileName', () =>
{
    it('has the date', () =>
    {
        expect(backupFileName(new Date(2026, 8, 28))).toBe('gingerbread-launcher-2026-09-28.json');
    });
});
