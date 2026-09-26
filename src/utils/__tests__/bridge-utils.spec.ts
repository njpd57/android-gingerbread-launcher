import { afterEach, describe, expect, it } from 'vitest';
import { bridgeHas } from '../bridge-utils';

describe('bridgeHas', () =>
{
    afterEach(() =>
    {
        delete (window as { Bridge?: unknown }).Bridge;
    });

    it('is true only for methods the running Bridge actually has', () =>
    {
        window.Bridge = { getCanLockScreen: () => true } as unknown as typeof window.Bridge;
        expect(bridgeHas('getCanLockScreen')).toBe(true);
        expect(bridgeHas('getCanRequestSystemNightMode')).toBe(false);
    });

    it('is false when Bridge is not there at all', () =>
    {
        expect(bridgeHas('requestLockScreen')).toBe(false);
    });
});
