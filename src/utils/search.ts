/** Lowercase, without accents and with single spaces: "  Cámara  Pro " -> "camara pro". */
export function normalizeForSearch(s: string)
{
    return s
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}

interface Searchable
{
    label: string;
}

/**
 * Apps whose label matches the query, best first: labels that start with it, then labels with a
 * word that starts with it, then labels that merely contain it; alphabetical within each group.
 * An empty query matches nothing.
 */
export function searchApps<T extends Searchable>(apps: Iterable<T>, query: string): T[]
{
    const q = normalizeForSearch(query);
    if (!q) return [];

    const scored: { app: T; rank: number }[] = [];
    for (const app of apps)
    {
        const label = normalizeForSearch(app.label);
        let rank: number;
        if (label.startsWith(q)) rank = 0;
        else if (label.split(' ').some(word => word.startsWith(q))) rank = 1;
        else if (label.includes(q)) rank = 2;
        else continue;
        scored.push({ app, rank });
    }

    return scored
        .sort((a, b) => a.rank - b.rank || a.app.label.localeCompare(b.app.label))
        .map(s => s.app);
}

interface SearchableContact
{
    name: string;
    phoneNumbers: { number: string }[];
}

/**
 * Contacts whose name or a phone number matches the query, ranked like `searchApps` (name matches
 * first, digit matches last so "Ana" doesn't lose to a contact whose number happens to contain it).
 * An empty query matches nothing.
 */
export function searchContacts<T extends SearchableContact>(contacts: Iterable<T>, query: string): T[]
{
    const q = normalizeForSearch(query);
    if (!q) return [];
    const qDigits = query.replace(/\D/g, '');

    const scored: { contact: T; rank: number }[] = [];
    for (const contact of contacts)
    {
        const name = normalizeForSearch(contact.name);
        let rank: number;
        if (name.startsWith(q)) rank = 0;
        else if (name.split(' ').some(word => word.startsWith(q))) rank = 1;
        else if (name.includes(q)) rank = 2;
        else if (qDigits.length >= 3 && contact.phoneNumbers.some(p => p.number.replace(/\D/g, '').includes(qDigits))) rank = 3;
        else continue;
        scored.push({ contact, rank });
    }

    return scored
        .sort((a, b) => a.rank - b.rank || a.contact.name.localeCompare(b.contact.name))
        .map(s => s.contact);
}

/** Whether the query looks like something to dial, not a name: mostly digits, at least 3 of them. */
export function looksLikePhoneNumber(query: string): boolean
{
    const trimmed = query.trim();
    if (!trimmed || !/^[0-9+()\-\s]+$/.test(trimmed)) return false;
    return trimmed.replace(/\D/g, '').length >= 3;
}
