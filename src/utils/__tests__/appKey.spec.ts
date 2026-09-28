import { describe, expect, it } from 'vitest';
import { appKey, isSameApp, toAppRef } from '../appKey';

describe('appKey', () =>
{
    it('is the package name for personal apps', () =>
    {
        expect(appKey({ packageName: 'com.microsoft.teams' })).toBe('com.microsoft.teams');
    });

    it('adds the profile for apps in another profile', () =>
    {
        expect(appKey({ packageName: 'com.microsoft.teams', userSerial: 10 })).toBe('com.microsoft.teams@10');
    });
});

describe('isSameApp', () =>
{
    it('tells personal and work copies of a package apart', () =>
    {
        expect(isSameApp({ packageName: 'a' }, { packageName: 'a', userSerial: 10 })).toBe(false);
        expect(isSameApp({ packageName: 'a', userSerial: 10 }, { packageName: 'a', userSerial: 10 })).toBe(true);
        expect(isSameApp({ packageName: 'a' }, { packageName: 'a' })).toBe(true);
    });
});

describe('toAppRef', () =>
{
    it('drops the other fields and an unset userSerial', () =>
    {
        expect(toAppRef({ packageName: 'a', label: 'A' } as never)).toEqual({ packageName: 'a' });
        expect(toAppRef({ packageName: 'a', userSerial: 10 })).toEqual({ packageName: 'a', userSerial: 10 });
    });
});
