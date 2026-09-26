import { describe, expect, it } from 'vitest';
import { normalizeFeedUrl, parseFeed } from '../rss';

describe('parseFeed', () =>
{
    it('reads RSS 2.0, including CDATA titles', () =>
    {
        const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>Noticias</title>
            <item><title><![CDATA[Primera]]></title><link>https://a.cl/1</link></item>
            <item><title>Segunda</title><link>https://a.cl/2</link></item></channel></rss>`;
        expect(parseFeed(xml)).toEqual({
            title: 'Noticias',
            items: [{ title: 'Primera', link: 'https://a.cl/1' }, { title: 'Segunda', link: 'https://a.cl/2' }],
        });
    });

    it('reads Atom, preferring the alternate link', () =>
    {
        const xml = `<feed xmlns="http://www.w3.org/2005/Atom"><title>Blog</title>
            <entry><title>Hola</title><link rel="self" href="https://b.cl/self"/><link href="https://b.cl/hola"/></entry></feed>`;
        expect(parseFeed(xml)).toEqual({ title: 'Blog', items: [{ title: 'Hola', link: 'https://b.cl/hola' }] });
    });

    it('returns null for something that is not a feed', () =>
    {
        expect(parseFeed('<html><body>no</body></html>')).toBeNull();
        expect(parseFeed('not xml at all <')).toBeNull();
    });
});

describe('normalizeFeedUrl', () =>
{
    it('adds https when there is no scheme', () =>
    {
        expect(normalizeFeedUrl('  blog.cl/feed.xml ')).toBe('https://blog.cl/feed.xml');
    });

    it('upgrades http, which the https page cannot fetch', () =>
    {
        expect(normalizeFeedUrl('http://blog.cl/feed.xml')).toBe('https://blog.cl/feed.xml');
    });

    it('sends Cooperativa.cl straight to its mobile site over https', () =>
    {
        const path = '/noticias/site/tax/port/all/rss_3___1.xml';
        expect(normalizeFeedUrl(`https://cooperativa.cl${path}`)).toBe(`https://m.cooperativa.cl${path}`);
        expect(normalizeFeedUrl(`http://www.cooperativa.cl${path}`)).toBe(`https://m.cooperativa.cl${path}`);
        expect(normalizeFeedUrl(`https://m.cooperativa.cl${path}`)).toBe(`https://m.cooperativa.cl${path}`);
    });
});
