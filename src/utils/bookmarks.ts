export interface Bookmark
{
    id: number;
    name: string;
    url: string;
}

/** Up to 2 rows of 4, like the 4x2 widget shows. */
export const MAX_BOOKMARKS = 8;

/** A typed address as a full URL (`wikipedia.org` → `https://wikipedia.org/`), or null if it isn't one. */
export function normalizeBookmarkUrl(input: string): string | null
{
    let text = input.trim();
    if (!text) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(text))
        text = `https://${text}`;
    try
    {
        const url = new URL(text);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        if (!url.hostname.includes('.')) return null;
        return url.href;
    }
    catch
    {
        return null;
    }
}

/** A name for a site the user didn't name: its host without `www.` (`es.wikipedia.org`). */
export function defaultBookmarkName(url: string): string
{
    try
    {
        return new URL(url).hostname.replace(/^www\./, '');
    }
    catch
    {
        return url;
    }
}

/** The site's `favicon.ico`, at the root of its host. */
export function faviconUrl(url: string): string
{
    try
    {
        return `${new URL(url).origin}/favicon.ico`;
    }
    catch
    {
        return '';
    }
}

/** The letter shown when a site has no favicon. */
export function bookmarkInitial(name: string): string
{
    return (name.trim()[0] ?? '?').toUpperCase();
}
