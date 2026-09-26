// Methods added by our Bridge fork (github.com/njpd57/bridge-launcher) that the published
// @bridgelauncher/api types don't declare yet. Other Bridge builds don't have them, so always
// check with bridgeHas() before calling.

import '@bridgelauncher/api';

export type BridgeScreenOrientation = 'unspecified' | 'portrait';
export type BridgeDefaultAppRole = 'dialer' | 'browser' | 'sms' | 'email' | 'camera';

/** Things projects can't toggle themselves; `requestOpenSystemPanel` opens their panel or settings screen. */
export type BridgeSystemPanel = 'wifi' | 'internet' | 'bluetooth' | 'nfc' | 'volume' | 'location';

export interface BridgeScreenBrightness
{
    isAuto: boolean;
    /** Manual brightness, 0 to 1. */
    level: number;
}

export type BridgeConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none';
export type BridgeDataActivity = 'none' | 'in' | 'out' | 'inout' | 'dormant';

/** The real network state, from `getConnectivity()` and `connectivityChanged`. */
export interface BridgeConnectivity
{
    /** The network in use. */
    type: BridgeConnectionType;
    /** 0 to 4 while connected to Wi-Fi, otherwise null. */
    wifiLevel: number | null;
    /** 0 to 4, or null without a SIM or service. Reported on Wi-Fi too. */
    cellularLevel: number | null;
    /** As reported by Android; regular apps may never get it (One UI only reports "dormant"). */
    cellularDataActivity: BridgeDataActivity;
    /** Measured from the device's traffic on any network, while the home screen is visible. */
    dataActivity: BridgeDataActivity;
}

export type BridgePluggedType = 'ac' | 'usb' | 'wireless' | 'other';

export type BridgeRingerMode = 'normal' | 'vibrate' | 'silent';

/** The next alarm clock set on the device, from `getNextAlarm()` and `nextAlarmChanged`. */
export interface BridgeNextAlarm
{
    /** When it goes off, in ms since the epoch. */
    triggerTime: number;
    /** The app that set it, if Android says. */
    packageName: string | null;
}

/** The device's battery, from `getBattery()` and `batteryChanged`. */
export interface BridgeBattery
{
    /** 0 to 100. */
    level: number;
    /** Whether a charger of any kind is connected. */
    isCharging: boolean;
    /** null when not plugged in. */
    pluggedType: BridgePluggedType | null;
}

export interface BridgePhoneNumber
{
    number: string;
    /** "Móvil", "Casa"… in the device's language, or the custom label. */
    label: string | null;
    /** The contact's default number. */
    isPrimary: boolean;
}

/** A contact with at least one phone number, from `getContactsURL()`. */
export interface BridgeContact
{
    id: number;
    /** Stable across syncs; what `getContactPhotoURL` and `requestOpenContact` take. */
    lookupKey: string;
    name: string;
    /** Marked as favorite in the contacts app. */
    starred: boolean;
    hasPhoto: boolean;
    /** The default number first. */
    phoneNumbers: BridgePhoneNumber[];
}

export interface BridgeGetContactsResponse
{
    /** By name. */
    contacts: BridgeContact[];
}

/** One app's usage within a range, from `getAppUsageURL()`. */
export interface BridgeAppUsage
{
    packageName: string;
    /** Time in the foreground, in milliseconds. */
    totalTimeMs: number;
    /** How many times the user switched to the app. */
    openCount: number;
    /** Milliseconds since the epoch, or null if unused within the range. */
    lastTimeUsed: number | null;
}

export interface BridgeGetAppUsageResponse
{
    /** Most used (by time) first. */
    apps: BridgeAppUsage[];
}

/** An occurrence of a calendar event, from `getCalendarEventsURL()`. */
export interface BridgeCalendarEvent
{
    eventId: number;
    title: string | null;
    location: string | null;
    /** Milliseconds since the epoch. For all-day events, midnight UTC of the first day. */
    begin: number;
    /** Milliseconds since the epoch. For all-day events, midnight UTC of the day after the last one. */
    end: number;
    allDay: boolean;
    /** `#rrggbb`, the color the calendar app shows the event in. */
    color: string | null;
    calendarName: string | null;
}

export interface BridgeGetCalendarEventsResponse
{
    events: BridgeCalendarEvent[];
}

/** One of an app's shortcuts ("New message", "Navigate home"...), from `getAppShortcutsURL()`. */
export interface BridgeAppShortcut
{
    id: string;
    shortLabel: string;
    longLabel: string | null;
}

export interface BridgeGetAppShortcutsResponse
{
    shortcuts: BridgeAppShortcut[];
}

export type BridgeMediaPlaybackState = 'playing' | 'paused' | 'buffering' | 'stopped' | 'none';
export type BridgeMediaAction = 'play' | 'pause' | 'playPause' | 'next' | 'previous';

/** The media session that's playing (or was last playing), from `getMediaSession()` and `mediaSessionChanged`. */
export interface BridgeMediaSession
{
    packageName: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    state: BridgeMediaPlaybackState;
    durationMs: number | null;
    /** The position at `positionUpdatedAt`; while playing, it advances at `playbackSpeed`. */
    positionMs: number | null;
    /** Milliseconds since the epoch. */
    positionUpdatedAt: number;
    playbackSpeed: number;
    hasArt: boolean;
    /** Changes with every track, like the URL from `getMediaArtURL()`. */
    artVersion: number;
    canSkipToNext: boolean;
    canSkipToPrevious: boolean;
}

/** An active notification, as served by `getNotificationsURL()` and the `notificationPosted` event. */
export interface BridgeNotification
{
    key: string;
    packageName: string;
    /** Milliseconds since the epoch. */
    postTime: number;
    title: string | null;
    text: string | null;
    subText: string | null;
    category: string | null;
    isOngoing: boolean;
    isClearable: boolean;
    /** Summary of a group of notifications from the same app; the group's notifications are also listed. */
    isGroupSummary: boolean;
    /** A media player's notification (it carries a media session); the launcher shows a player instead. */
    isMedia: boolean;
    hasLargeIcon: boolean;
    /** The notification's buttons ("Reply", "Mark as read"…). */
    actions: BridgeNotificationAction[];
}

export interface BridgeNotificationAction
{
    /** What `requestNotificationAction` / `requestReplyToNotification` take. */
    index: number;
    title: string;
    /** A "Reply" action: it takes typed text, sent with `requestReplyToNotification`. */
    acceptsText: boolean;
}

export interface BridgeGetNotificationsResponse
{
    notifications: BridgeNotification[];
}

/**
 * Events only our fork sends. Upstream's BridgeEventMap is a `type`, so it can't be augmented;
 * useBridgeEventStore hands listeners `BridgeEvent | BridgeForkEvent` instead.
 */
export type BridgeForkEvent =
    | { name: 'screenOrientationChanged'; newValue: BridgeScreenOrientation }
    | { name: 'canReadNotificationsChanged'; newValue: boolean }
    | { name: 'notificationPosted'; notification: BridgeNotification }
    | { name: 'notificationRemoved'; key: string }
    | { name: 'canWriteSystemSettingsChanged'; newValue: boolean }
    | { name: 'flashlightChanged'; newValue: boolean }
    | { name: 'screenBrightnessChanged'; newValue: BridgeScreenBrightness }
    | { name: 'autoRotateChanged'; newValue: boolean }
    | { name: 'masterSyncChanged'; newValue: boolean }
    | { name: 'canAccessNotificationPolicyChanged'; newValue: boolean }
    | { name: 'ringerModeChanged'; newValue: BridgeRingerMode }
    | { name: 'musicVolumeChanged'; newValue: number }
    | { name: 'mediaSessionChanged'; session: BridgeMediaSession | null }
    | { name: 'wifiEnabledChanged'; newValue: boolean }
    | { name: 'bluetoothEnabledChanged'; newValue: boolean }
    | { name: 'locationEnabledChanged'; newValue: boolean }
    | { name: 'connectivityChanged'; newValue: BridgeConnectivity }
    | { name: 'batteryChanged'; newValue: BridgeBattery }
    | { name: 'nextAlarmChanged'; newValue: BridgeNextAlarm | null }
    | { name: 'canReadCalendarChanged'; newValue: boolean }
    | { name: 'calendarChanged' }
    | { name: 'canReadUsageStatsChanged'; newValue: boolean }
    | { name: 'canReadContactsChanged'; newValue: boolean }
    | { name: 'canCallPhoneChanged'; newValue: boolean }
    | { name: 'contactsChanged' };

declare module '@bridgelauncher/api'
{
    interface JSToBridgeAPI
    {
        /**
         * True on forks where `top`/`left` in window insets are reported correctly. Absent (check with
         * `bridgeHas`) on every earlier build, including stock Bridge, which swap them.
         */
        getWindowInsetsSwapFixed(): boolean;

        /** Whether the home screen is locked to portrait (`'portrait'`) or follows the device (`'unspecified'`). */
        getScreenOrientation(): BridgeScreenOrientation;

        /** Locks the home screen to portrait, or lets it rotate again. Fires `screenOrientationChanged`. */
        requestSetScreenOrientation(orientation: BridgeScreenOrientation, showToastIfFailed?: boolean): boolean;

        /** Opens a `http`, `https`, `tel`, `mailto`, `sms`, `smsto` or `geo` URL in the app that handles it. */
        requestOpenUrl(url: string, showToastIfFailed?: boolean): boolean;

        /** Package name of the user's default app for the role, or null when there is none. */
        getDefaultAppPackageName(role: BridgeDefaultAppRole): string | null;

        /** Whether the user has given Bridge notification access. Fires `canReadNotificationsChanged`. */
        getCanReadNotifications(): boolean;

        /** Opens Android's notification access settings (Bridge's own page where possible). */
        requestOpenNotificationAccessSettings(showToastIfFailed?: boolean): boolean;

        /** URL of a {@link BridgeGetNotificationsResponse} JSON, newest first. Empty without notification access. */
        getNotificationsURL(): string;

        /** URL of the notification's small icon (a white silhouette PNG) or, with `large`, its large icon. */
        getNotificationIconURL(key: string, large?: boolean): string;

        /** Does what tapping the notification does: opens it, and dismisses it if it's auto-cancel. */
        requestOpenNotification(key: string, showToastIfFailed?: boolean): boolean;

        /** Dismisses a clearable notification. */
        requestDismissNotification(key: string, showToastIfFailed?: boolean): boolean;
        /** Presses one of the notification's buttons. */
        requestNotificationAction(key: string, actionIndex: number, showToastIfFailed?: boolean): boolean;
        /** Sends text through a notification's "Reply" action. */
        requestReplyToNotification(key: string, actionIndex: number, text: string, showToastIfFailed?: boolean): boolean;

        /** Whether Bridge may read contacts (READ_CONTACTS). Fires `canReadContactsChanged`. */
        getCanReadContacts(): boolean;
        /** Shows Android's dialog asking for contacts access (or Bridge's app settings if it was refused for good). */
        requestContactsPermission(showToastIfFailed?: boolean): boolean;
        /**
         * URL of a {@link BridgeGetContactsResponse} JSON: contacts with a phone number, by name. `query` matches
         * names and numbers ('' for all); `limit` 0 means no limit. 403 without permission. Fires `contactsChanged`.
         */
        getContactsURL(query?: string, starredOnly?: boolean, limit?: number): string;
        /** The contact's photo; 404 when it has none (check `hasPhoto`). */
        getContactPhotoURL(lookupKey: string): string;
        /** Opens the contact's card in the contacts app. */
        requestOpenContact(lookupKey: string, showToastIfFailed?: boolean): boolean;
        /** Whether Bridge may place calls itself (CALL_PHONE). Fires `canCallPhoneChanged`. */
        getCanCallPhone(): boolean;
        requestCallPhonePermission(showToastIfFailed?: boolean): boolean;
        /** Calls the number right away with CALL_PHONE; without it, opens the dialer with the number typed in. */
        requestCallPhoneNumber(number: string, showToastIfFailed?: boolean): boolean;

        /** Whether the user gave Bridge "Usage access". Fires `canReadUsageStatsChanged` (checked on resume). */
        getCanReadUsageStats(): boolean;
        requestOpenUsageAccessSettings(showToastIfFailed?: boolean): boolean;
        /** URL of a {@link BridgeGetAppUsageResponse} JSON for [from, to) (ms). 403 without access. */
        getAppUsageURL(from: number, to: number): string;

        /** A {@link BridgeMediaSession} as JSON, or `"null"`. Needs notification access. Fires `mediaSessionChanged`. */
        getMediaSession(): string;

        /** The current track's art (404 when it has none); the URL changes with every track. */
        getMediaArtURL(): string;

        requestMediaAction(action: BridgeMediaAction, showToastIfFailed?: boolean): boolean;

        /** Opens the app that's playing, on its player screen when it says which one that is. */
        requestOpenMediaApp(showToastIfFailed?: boolean): boolean;

        /** Opens the floating panel (Android 10+) or the settings screen for something projects can't toggle. */
        requestOpenSystemPanel(panel: BridgeSystemPanel, showToastIfFailed?: boolean): boolean;

        /** Whether Wi-Fi is on (not necessarily connected). Fires `wifiEnabledChanged`. */
        getWifiEnabled(): boolean;
        getIsBluetoothAvailable(): boolean;
        /** Fires `bluetoothEnabledChanged` (from Android 12, once the home screen gets the focus back). */
        getBluetoothEnabled(): boolean;
        /** Whether location (GPS) is on. Fires `locationEnabledChanged`. */
        getLocationEnabled(): boolean;

        /** Whether Bridge may read the calendar (READ_CALENDAR). Fires `canReadCalendarChanged`. */
        getCanReadCalendar(): boolean;
        /** Shows Android's dialog asking for calendar access (or Bridge's app settings if it was refused for good). */
        requestCalendarPermission(showToastIfFailed?: boolean): boolean;
        /** URL of a {@link BridgeGetCalendarEventsResponse} JSON with the events overlapping [from, to) (ms). 403 without permission. */
        getCalendarEventsURL(from: number, to: number): string;
        /** Opens one occurrence of an event in the calendar app. */
        requestOpenCalendarEvent(eventId: number, begin: number, end: number, showToastIfFailed?: boolean): boolean;
        /** Opens the calendar app at a time (e.g. a day tapped in a month view). */
        requestOpenCalendarAt(time: number, showToastIfFailed?: boolean): boolean;

        /** Whether Bridge can read apps' shortcuts: only the default launcher can, on Android 7.1+. */
        getCanAccessAppShortcuts(): boolean;
        /** URL of a {@link BridgeGetAppShortcutsResponse} JSON, in the order launchers show them. */
        getAppShortcutsURL(packageName: string): string;
        getAppShortcutIconURL(packageName: string, shortcutId: string): string;
        requestStartAppShortcut(packageName: string, shortcutId: string, showToastIfFailed?: boolean): boolean;

        /** A {@link BridgeConnectivity} as JSON. Fires `connectivityChanged`. */
        getConnectivity(): string;

        /** A {@link BridgeBattery} as JSON. Fires `batteryChanged`. */
        getBattery(): string;

        /** The next alarm clock as a {@link BridgeNextAlarm} in JSON, or `"null"`. Fires `nextAlarmChanged`. */
        getNextAlarm(): string;
        /** Opens the alarm list of the clock app (`AlarmClock.ACTION_SHOW_ALARMS`). */
        requestOpenAlarms(showToastIfFailed?: boolean): boolean;

        getIsFlashlightAvailable(): boolean;
        /** Fires `flashlightChanged`. */
        getFlashlightOn(): boolean;
        requestSetFlashlightOn(on: boolean, showToastIfFailed?: boolean): boolean;

        /** Whether the user let Bridge "modify system settings", needed for brightness and auto-rotate. Fires `canWriteSystemSettingsChanged`. */
        getCanWriteSystemSettings(): boolean;
        requestOpenWriteSystemSettingsPermission(showToastIfFailed?: boolean): boolean;

        /** A {@link BridgeScreenBrightness} as JSON. Fires `screenBrightnessChanged`. */
        getScreenBrightness(): string;
        requestSetScreenBrightnessAuto(auto: boolean, showToastIfFailed?: boolean): boolean;
        /** Switches to manual brightness at `level` (0 to 1). */
        requestSetScreenBrightnessLevel(level: number, showToastIfFailed?: boolean): boolean;

        /** Fires `autoRotateChanged`. */
        getAutoRotateOn(): boolean;
        requestSetAutoRotateOn(on: boolean, showToastIfFailed?: boolean): boolean;

        /** Fires `masterSyncChanged`. */
        getMasterSyncOn(): boolean;
        requestSetMasterSyncOn(on: boolean, showToastIfFailed?: boolean): boolean;

        /** Whether the user gave Bridge "Do Not Disturb access", needed to change the ringer mode. Fires `canAccessNotificationPolicyChanged`. */
        getCanAccessNotificationPolicy(): boolean;
        requestOpenNotificationPolicyAccessSettings(showToastIfFailed?: boolean): boolean;

        /** Fires `ringerModeChanged`. */
        getRingerMode(): BridgeRingerMode;
        /** Requires "Do Not Disturb access" (see {@link getCanAccessNotificationPolicy}). */
        requestSetRingerMode(mode: BridgeRingerMode, showToastIfFailed?: boolean): boolean;

        /** Media volume, 0 to 1. Fires `musicVolumeChanged`. */
        getMusicVolume(): number;
        /** No special permission needed. */
        requestSetMusicVolume(level: number, showToastIfFailed?: boolean): boolean;
    }
}
