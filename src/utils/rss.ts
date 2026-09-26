export interface FeedItem
{
    title: string;
    link: string;
}

export interface Feed
{
    title: string;
    items: FeedItem[];
}

const text = (el: Element | null | undefined) => el?.textContent?.trim() ?? '';

/** Reads an RSS 2.0 or Atom feed; null if the text isn't a feed. */
export function parseFeed(xml: string): Feed | null
{
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) return null;

    const channel = doc.querySelector('rss > channel, rdf\\:RDF > channel, channel');
    if (channel)
    {
        const items = [...doc.querySelectorAll('item')].map(item => ({
            title: text(item.querySelector('title')),
            link: text(item.querySelector('link')),
        }));
        return { title: text(channel.querySelector(':scope > title')), items: items.filter(i => i.title) };
    }

    const feed = doc.querySelector('feed');
    if (feed)
    {
        const items = [...feed.querySelectorAll('entry')].map(entry =>
        {
            const links = [...entry.querySelectorAll('link')];
            const link = links.find(l => (l.getAttribute('rel') ?? 'alternate') === 'alternate') ?? links[0];
            return { title: text(entry.querySelector('title')), link: link?.getAttribute('href') ?? '' };
        });
        return { title: text(feed.querySelector(':scope > title')), items: items.filter(i => i.title) };
    }

    return null;
}

/**
 * The address the widget actually fetches. The launcher runs on an https page, so the WebView blocks
 * http requests (mixed content), redirects to http included: plain http is upgraded, and a missing
 * scheme gets https. Cooperativa.cl redirects Android browsers from cooperativa.cl and www to
 * http://m.cooperativa.cl, which failed for that reason, so its feeds go straight to https://m.
 */
export function normalizeFeedUrl(url: string): string
{
    let u = url.trim();
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(u)) u = `https://${u}`;
    u = u.replace(/^http:\/\//i, 'https://');
    return u.replace(/^https:\/\/(www\.)?cooperativa\.cl\//i, 'https://m.cooperativa.cl/');
}
