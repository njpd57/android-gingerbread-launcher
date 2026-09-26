import { describe, expect, it } from 'vitest';
import { looksLikePhoneNumber, normalizeForSearch, searchApps, searchContacts } from '../search';

const apps = [
    { label: 'Cámara' },
    { label: 'Calendario' },
    { label: 'Google Calendar' },
    { label: 'Calculadora' },
    { label: 'Música' },
    { label: 'YouTube Music' },
    { label: 'Chrome' },
];

const labels = (list: { label: string }[]) => list.map(a => a.label);

describe('normalizeForSearch', () =>
{
    it('lowercases, strips accents and collapses spaces', () =>
    {
        expect(normalizeForSearch('  Cámara   Pro ')).toBe('camara pro');
        expect(normalizeForSearch('ÑANDÚ')).toBe('nandu');
    });
});

describe('searchApps', () =>
{
    it('ignores case and accents', () =>
    {
        expect(labels(searchApps(apps, 'camara'))).toEqual(['Cámara']);
        expect(labels(searchApps(apps, 'MUSICA'))).toEqual(['Música']);
    });

    it('ranks label starts, then word starts, then substrings', () =>
    {
        // "cal": Calculadora, Calendario start with it; Google Calendar has a word starting with it
        expect(labels(searchApps(apps, 'cal'))).toEqual(['Calculadora', 'Calendario', 'Google Calendar']);
        // "mus": Música starts with it, YouTube Music has a word that does
        expect(labels(searchApps(apps, 'mus'))).toEqual(['Música', 'YouTube Music']);
        // "ome": only contained in Chrome
        expect(labels(searchApps(apps, 'ome'))).toEqual(['Chrome']);
    });

    it('matches nothing for an empty or blank query', () =>
    {
        expect(searchApps(apps, '')).toEqual([]);
        expect(searchApps(apps, '   ')).toEqual([]);
    });
});

const contacts = [
    { name: 'Ana García', phoneNumbers: [{ number: '+56 9 1234 5678' }] },
    { name: 'Mamá', phoneNumbers: [{ number: '+56 9 8765 4321' }, { number: '+56 2 2345 6789' }] },
    { name: 'Tomás Pérez', phoneNumbers: [{ number: '+56 9 5555 0000' }] },
];

const names = (list: { name: string }[]) => list.map(c => c.name);

describe('searchContacts', () =>
{
    it('ignores case and accents in the name', () =>
    {
        expect(names(searchContacts(contacts, 'mama'))).toEqual(['Mamá']);
        expect(names(searchContacts(contacts, 'GARCIA'))).toEqual(['Ana García']);
    });

    it('ranks name matches before a matching phone number', () =>
    {
        expect(names(searchContacts(contacts, 'tomas'))).toEqual(['Tomás Pérez']);
        // "5555" only matches Tomás's number, "1234" only matches Ana's
        expect(names(searchContacts(contacts, '5555'))).toEqual(['Tomás Pérez']);
        expect(names(searchContacts(contacts, '1234'))).toEqual(['Ana García']);
    });

    it('ignores short digit runs so a 1-2 digit query does not match every number', () =>
    {
        expect(searchContacts(contacts, '56')).toEqual([]);
    });

    it('matches nothing for an empty or blank query', () =>
    {
        expect(searchContacts(contacts, '')).toEqual([]);
        expect(searchContacts(contacts, '   ')).toEqual([]);
    });
});

describe('looksLikePhoneNumber', () =>
{
    it('accepts digits with common phone punctuation', () =>
    {
        expect(looksLikePhoneNumber('+56 9 1234 5678')).toBe(true);
        expect(looksLikePhoneNumber('123-4567')).toBe(true);
        expect(looksLikePhoneNumber('(2) 2345 6789')).toBe(true);
    });

    it('rejects names and short or empty input', () =>
    {
        expect(looksLikePhoneNumber('Ana García')).toBe(false);
        expect(looksLikePhoneNumber('12')).toBe(false);
        expect(looksLikePhoneNumber('')).toBe(false);
        expect(looksLikePhoneNumber('   ')).toBe(false);
    });
});
