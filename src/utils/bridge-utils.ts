/**
 * Whether the running Bridge implements this API method. Installed Bridge builds can lag behind
 * the published API types (e.g. Bridge 0.1.0alpha lacks `getCanRequestSystemNightMode`), and
 * calling a missing method throws, so optional features should check first.
 */
export function bridgeHas(method: keyof typeof Bridge): boolean
{
    return typeof window.Bridge?.[method] === 'function';
}
