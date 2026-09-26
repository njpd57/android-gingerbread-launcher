import { describe, expect, it } from 'vitest';
import { forgetApp, mostUsedApps, recordLaunch } from '../mostUsed';

const all = () => true;

describe('recordLaunch / forgetApp', () =>
{
    it('counts launches per app', () =>
    {
        const counts = recordLaunch(recordLaunch(recordLaunch({}, 'a'), 'b'), 'a');
        expect(counts).toEqual({ a: 2, b: 1 });
    });

    it('forgets an uninstalled app', () =>
    {
        expect(forgetApp({ a: 2, b: 1 }, 'a')).toEqual({ b: 1 });
    });
});

describe('mostUsedApps', () =>
{
    it('puts the most launched apps first', () =>
    {
        expect(mostUsedApps({ a: 1, b: 5, c: 3 }, [], all, 4)).toEqual(['b', 'c', 'a']);
    });

    it('breaks ties by recency', () =>
    {
        expect(mostUsedApps({ a: 2, b: 2 }, ['b', 'a'], all, 4)).toEqual(['b', 'a']);
    });

    it('fills the remaining places with recent apps that were never counted', () =>
    {
        expect(mostUsedApps({ a: 3 }, ['x', 'a', 'y'], all, 3)).toEqual(['a', 'x', 'y']);
    });

    it('skips apps that are no longer installed', () =>
    {
        expect(mostUsedApps({ a: 3, gone: 9 }, [], p => p !== 'gone', 4)).toEqual(['a']);
    });

    it('returns at most the limit', () =>
    {
        expect(mostUsedApps({ a: 4, b: 3, c: 2, d: 1, e: 1 }, [], all, 4)).toEqual(['a', 'b', 'c', 'd']);
    });
});
