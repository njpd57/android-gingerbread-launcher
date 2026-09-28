import { describe, expect, it } from 'vitest';
import { bookmarkInitial, defaultBookmarkName, faviconUrl, normalizeBookmarkUrl } from '../bookmarks';

describe('normalizeBookmarkUrl', () =>
{
    it('adds https:// to bare addresses', () =>
    {
        expect(normalizeBookmarkUrl(' wikipedia.org ')).toBe('https://wikipedia.org/');
        expect(normalizeBookmarkUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
    });

    it('rejects what is not a web address', () =>
    {
        expect(normalizeBookmarkUrl('')).toBeNull();
        expect(normalizeBookmarkUrl('hola')).toBeNull();
        expect(normalizeBookmarkUrl('javascript:alert(1)')).toBeNull();
        expect(normalizeBookmarkUrl('tel:123')).toBeNull();
    });
});

describe('bookmark helpers', () =>
{
    it('names, icons and initials', () =>
    {
        expect(defaultBookmarkName('https://www.emol.com/noticias')).toBe('emol.com');
        expect(faviconUrl('https://es.wikipedia.org/wiki/Android')).toBe('https://es.wikipedia.org/favicon.ico');
        expect(bookmarkInitial(' emol')).toBe('E');
        expect(bookmarkInitial('')).toBe('?');
    });
});
