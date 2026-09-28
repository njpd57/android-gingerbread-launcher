// Android 2.3's own launcher icons for the system apps (src/assets/icons/gingerbread/, from AOSP
// android-2.3.7_r1, Apache 2.0), shown in place of today's icons for the same kind of app.
// Only AOSP apps: Google's own apps of the time (Gmail, Maps, Market) weren't open source.

export type GingerbreadIcon =
    | 'phone' | 'contacts' | 'messaging' | 'browser' | 'camera' | 'gallery' | 'music' | 'clock'
    | 'calculator' | 'calendar' | 'email' | 'settings' | 'downloads' | 'soundrecorder';

/** Package names of the AOSP, Google and Samsung versions of each app. */
export const GINGERBREAD_ICON_PACKAGES: Record<GingerbreadIcon, string[]> = {
    phone: ['com.android.dialer', 'com.google.android.dialer', 'com.samsung.android.dialer'],
    contacts: ['com.android.contacts', 'com.google.android.contacts', 'com.samsung.android.app.contacts'],
    messaging: ['com.android.mms', 'com.android.messaging', 'com.google.android.apps.messaging', 'com.samsung.android.messaging'],
    browser: ['com.android.browser', 'com.android.chrome', 'com.sec.android.app.sbrowser'],
    camera: ['com.android.camera', 'com.android.camera2', 'com.google.android.GoogleCamera', 'com.sec.android.app.camera'],
    gallery: ['com.android.gallery3d', 'com.google.android.apps.photos', 'com.sec.android.gallery3d'],
    music: ['com.android.music', 'com.sec.android.app.music'],
    clock: ['com.android.deskclock', 'com.google.android.deskclock', 'com.sec.android.app.clockpackage'],
    calculator: ['com.android.calculator2', 'com.google.android.calculator', 'com.sec.android.app.popupcalculator'],
    calendar: ['com.android.calendar', 'com.google.android.calendar', 'com.samsung.android.calendar'],
    email: ['com.android.email', 'com.samsung.android.email.provider'],
    settings: ['com.android.settings'],
    downloads: ['com.android.providers.downloads.ui'],
    soundrecorder: ['com.android.soundrecorder', 'com.google.android.apps.recorder', 'com.sec.android.app.voicenote'],
};

const iconByPackage = new Map<string, GingerbreadIcon>(
    (Object.entries(GINGERBREAD_ICON_PACKAGES) as [GingerbreadIcon, string[]][])
        .flatMap(([icon, packages]) => packages.map(p => [p, icon] as const)));

/** Which 2.3 icon stands in for this app, or null to keep its own. */
export function gingerbreadIconFor(packageName: string): GingerbreadIcon | null
{
    return iconByPackage.get(packageName) ?? null;
}

const iconURLs = import.meta.glob<string>('../assets/icons/gingerbread/*.png', { eager: true, import: 'default' });

/** The bundled image of a 2.3 icon. */
export function gingerbreadIconURL(icon: GingerbreadIcon): string
{
    return iconURLs[`../assets/icons/gingerbread/gingerbread-${icon}.png`];
}
