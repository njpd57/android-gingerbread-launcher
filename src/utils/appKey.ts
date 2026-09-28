/**
 * Apps are identified by package name, but with a work profile the same package can be installed
 * twice (personal Teams and work Teams). An app in another profile carries that profile's
 * `userSerial` (from the Bridge fork's `getProfileAppsURL`); personal apps don't.
 */
export interface AppRef
{
    packageName: string;
    /** Set only for apps in another profile (the work profile). */
    userSerial?: number;
}

/**
 * The app's key in the app list, recents and launch counts: the package name for personal apps, so
 * data saved before work profile support stays valid, and `packageName@userSerial` for the rest.
 */
export function appKey(app: AppRef): string
{
    return app.userSerial == null ? app.packageName : `${app.packageName}@${app.userSerial}`;
}

export function isSameApp(a: AppRef, b: AppRef): boolean
{
    return appKey(a) === appKey(b);
}

/** Only the fields of an AppRef, without `userSerial` when it isn't set (for storing in the layout). */
export function toAppRef(app: AppRef): AppRef
{
    return app.userSerial == null
        ? { packageName: app.packageName }
        : { packageName: app.packageName, userSerial: app.userSerial };
}
