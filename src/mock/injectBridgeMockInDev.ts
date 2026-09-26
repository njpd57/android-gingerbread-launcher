import { BridgeMock } from '@bridgelauncher/api-mock';
import type { BridgeDefaultAppRole, BridgeGetNotificationsResponse, BridgeMediaAction, BridgeMediaSession, BridgeRingerMode, BridgeScreenBrightness, BridgeScreenOrientation, BridgeSystemPanel } from '@/types/bridge-fork';

// a couple of notifications for the Gingerbread status bar in the browser
const MOCK_NOTIFICATIONS: BridgeGetNotificationsResponse = {
    notifications: [
        {
            key: '0|com.google.android.gm|1|null|10001', packageName: 'com.google.android.gm', postTime: Date.now() - 60_000,
            title: 'Nuevo correo', text: 'Hola, ¿cómo va el launcher?', subText: null, category: 'email',
            isOngoing: false, isClearable: true, isGroupSummary: false, isMedia: false, hasLargeIcon: false, actions: [],
        },
        {
            key: '0|com.whatsapp|1|null|10002', packageName: 'com.whatsapp', postTime: Date.now() - 300_000,
            title: 'Ana', text: '¿Nos vemos mañana?', subText: null, category: 'msg',
            isOngoing: false, isClearable: true, isGroupSummary: false, isMedia: false, hasLargeIcon: false,
            actions: [{ index: 0, title: 'Responder', acceptsText: true }, { index: 1, title: 'Marcar como leído', acceptsText: false }],
        },
    ],
};

// an orange square with a note, standing in for album art
const MOCK_MEDIA_ART = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#ff8a00"/><path fill="#fff" d="M26 16h22v6H32v22a7 7 0 1 1-6-7z"/></svg>');

const MOCK_TRACKS = [
    { title: 'Gingerbread', artist: 'Nexus S', album: 'Android 2.3' },
    { title: 'Froyo', artist: 'Nexus One', album: 'Android 2.2' },
];

// a white envelope, standing in for a notification's small icon
const MOCK_NOTIFICATION_ICON = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#fff" d="M2 5h20v14H2z"/></svg>');

// BridgeMock plus the methods our Bridge fork adds (see src/types/bridge-fork.d.ts)
class ForkBridgeMock extends BridgeMock
{
    private screenOrientation: BridgeScreenOrientation = 'unspecified';
    private flashlightOn = false;
    private brightness: BridgeScreenBrightness = { isAuto: true, level: 0.5 };
    private autoRotateOn = false;
    private masterSyncOn = true;
    private canAccessNotificationPolicy = true;
    private ringerMode: BridgeRingerMode = 'normal';
    private musicVolume = 0.6;
    private track = 0;
    private media: BridgeMediaSession = this.mediaSession('paused', 30_000);

    private mediaSession(state: BridgeMediaSession['state'], positionMs: number): BridgeMediaSession
    {
        return {
            packageName: 'com.spotify.music', ...MOCK_TRACKS[this.track], state,
            durationMs: 200_000, positionMs, positionUpdatedAt: Date.now(), playbackSpeed: 1,
            hasArt: true, artVersion: this.track, canSkipToNext: true, canSkipToPrevious: true,
        };
    }

    // like Bridge, tell the page about a change through onBridgeEvent
    private emit(event: object)
    {
        (window.onBridgeEvent as ((ev: object) => void) | undefined)?.(event);
    }

    getWindowInsetsSwapFixed()
    {
        return true;
    }

    getScreenOrientation()
    {
        return this.screenOrientation;
    }

    requestSetScreenOrientation(orientation: BridgeScreenOrientation)
    {
        this.screenOrientation = orientation;
        return true;
    }

    requestOpenUrl(url: string)
    {
        window.open(url, '_blank');
        return true;
    }

    getDefaultAppPackageName(role: BridgeDefaultAppRole)
    {
        const packages: Record<BridgeDefaultAppRole, string> = {
            dialer: 'com.google.android.dialer',
            browser: 'com.android.chrome',
            sms: 'com.google.android.apps.messaging',
            email: 'com.google.android.gm',
            camera: 'com.android.camera2',
        };
        return packages[role];
    }

    getCanReadNotifications()
    {
        return true;
    }

    requestOpenNotificationAccessSettings()
    {
        alert('Would open Android\'s notification access settings.');
        return true;
    }

    getNotificationsURL()
    {
        return 'data:application/json,' + encodeURIComponent(JSON.stringify(MOCK_NOTIFICATIONS));
    }

    getNotificationIconURL()
    {
        return MOCK_NOTIFICATION_ICON;
    }

    requestOpenNotification(key: string)
    {
        alert(`Would open notification ${key}.`);
        return true;
    }

    requestDismissNotification(key: string)
    {
        alert(`Would dismiss notification ${key}.`);
        return true;
    }

    getMediaSession()
    {
        return JSON.stringify(this.media);
    }

    getMediaArtURL()
    {
        return MOCK_MEDIA_ART;
    }

    requestMediaAction(action: BridgeMediaAction)
    {
        const m = this.media;
        const position = (m.positionMs ?? 0) + (m.state === 'playing' ? Date.now() - m.positionUpdatedAt : 0);
        if (action === 'next' || action === 'previous')
        {
            this.track = (this.track + 1) % MOCK_TRACKS.length;
            this.media = this.mediaSession(m.state, 0);
        }
        else
        {
            const play = action === 'play' || (action === 'playPause' && m.state !== 'playing');
            this.media = this.mediaSession(play ? 'playing' : 'paused', position);
        }
        this.emit({ name: 'mediaSessionChanged', session: this.media });
        return true;
    }

    requestOpenMediaApp()
    {
        alert(`Would open ${this.media.packageName}.`);
        return true;
    }

    requestOpenSystemPanel(panel: BridgeSystemPanel)
    {
        alert(`Would open the ${panel} panel.`);
        return true;
    }

    getWifiEnabled()
    {
        return true;
    }

    getIsBluetoothAvailable()
    {
        return true;
    }

    getBluetoothEnabled()
    {
        return false;
    }

    getLocationEnabled()
    {
        return true;
    }

    requestNotificationAction(key: string, actionIndex: number)
    {
        alert(`Would press action ${actionIndex} of ${key}.`);
        return true;
    }

    requestReplyToNotification(key: string, actionIndex: number, text: string)
    {
        alert(`Would reply "${text}" to ${key} (action ${actionIndex}).`);
        return true;
    }

    getCanReadContacts()
    {
        return true;
    }

    requestContactsPermission()
    {
        return true;
    }

    getContactsURL(query = '', starredOnly = false)
    {
        const contacts = [
            { id: 1, lookupKey: 'ana', name: 'Ana García', starred: true, hasPhoto: false, phoneNumbers: [{ number: '+56 9 1234 5678', label: 'Móvil', isPrimary: true }] },
            { id: 2, lookupKey: 'mama', name: 'Mamá', starred: true, hasPhoto: false, phoneNumbers: [{ number: '+56 9 8765 4321', label: 'Móvil', isPrimary: true }, { number: '+56 2 2345 6789', label: 'Casa', isPrimary: false }] },
            { id: 3, lookupKey: 'tomas', name: 'Tomás Pérez', starred: false, hasPhoto: false, phoneNumbers: [{ number: '+56 9 5555 0000', label: 'Trabajo', isPrimary: true }] },
        ].filter(c => (!starredOnly || c.starred)
            && (!query || c.name.toLowerCase().includes(query.toLowerCase()) || c.phoneNumbers.some(p => p.number.replace(/\D/g, '').includes(query.replace(/\D/g, '') || '\u0000'))));
        return 'data:application/json,' + encodeURIComponent(JSON.stringify({ contacts }));
    }

    getContactPhotoURL()
    {
        return '';
    }

    requestOpenContact(lookupKey: string)
    {
        alert(`Would open contact ${lookupKey}.`);
        return true;
    }

    getCanCallPhone()
    {
        return false;
    }

    requestCallPhonePermission()
    {
        return true;
    }

    requestCallPhoneNumber(number: string)
    {
        alert(`Would call ${number}.`);
        return true;
    }

    getCanReadUsageStats()
    {
        return true;
    }

    requestOpenUsageAccessSettings()
    {
        alert('Would open the usage access settings.');
        return true;
    }

    getAppUsageURL()
    {
        const apps = [
            { packageName: 'com.android.chrome', totalTimeMs: 52 * 60_000, openCount: 14, lastTimeUsed: Date.now() - 600_000 },
            { packageName: 'com.whatsapp', totalTimeMs: 31 * 60_000, openCount: 23, lastTimeUsed: Date.now() - 60_000 },
            { packageName: 'com.spotify.music', totalTimeMs: 12 * 60_000, openCount: 3, lastTimeUsed: Date.now() - 3_600_000 },
        ];
        return 'data:application/json,' + encodeURIComponent(JSON.stringify({ apps }));
    }

    getCanReadCalendar()
    {
        return true;
    }

    requestCalendarPermission()
    {
        return true;
    }

    getCalendarEventsURL(from: number, to: number)
    {
        const at = (dayOffset: number, h: number, m = 0) =>
        {
            const d = new Date();
            d.setDate(d.getDate() + dayOffset);
            d.setHours(h, m, 0, 0);
            return d.getTime();
        };
        const today = new Date();
        const allDayBegin = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + 2);
        const events = [
            { eventId: 1, title: 'Reunión de equipo', location: 'Oficina', begin: at(0, 10), end: at(0, 11), allDay: false, color: '#4285f4', calendarName: 'Trabajo' },
            { eventId: 2, title: 'Cena con Ana', location: null, begin: at(1, 21), end: at(1, 23), allDay: false, color: '#e67c73', calendarName: 'Personal' },
            { eventId: 3, title: 'Cumpleaños de Tomás', location: null, begin: allDayBegin, end: allDayBegin + 86_400_000, allDay: true, color: '#33b679', calendarName: 'Cumpleaños' },
        ].filter(e => e.end > from && e.begin < to);
        return 'data:application/json,' + encodeURIComponent(JSON.stringify({ events }));
    }

    requestOpenCalendarEvent(eventId: number)
    {
        alert(`Would open calendar event ${eventId}.`);
        return true;
    }

    requestOpenCalendarAt(time: number)
    {
        alert(`Would open the calendar at ${new Date(time).toLocaleString()}.`);
        return true;
    }

    getCanAccessAppShortcuts()
    {
        return true;
    }

    getAppShortcutsURL(packageName: string)
    {
        const shortcuts = [
            { id: 'new', shortLabel: 'Nuevo', longLabel: `Nuevo en ${packageName}` },
            { id: 'search', shortLabel: 'Buscar', longLabel: null },
        ];
        return 'data:application/json,' + encodeURIComponent(JSON.stringify({ shortcuts }));
    }

    getAppShortcutIconURL()
    {
        return MOCK_NOTIFICATION_ICON;
    }

    requestStartAppShortcut(packageName: string, shortcutId: string)
    {
        alert(`Would start shortcut ${shortcutId} of ${packageName}.`);
        return true;
    }

    getConnectivity()
    {
        return JSON.stringify({ type: 'wifi', wifiLevel: 3, cellularLevel: 2, cellularDataActivity: 'none', dataActivity: 'in' });
    }

    getBattery()
    {
        return JSON.stringify({ level: 72, isCharging: false, pluggedType: null });
    }

    getNextAlarm()
    {
        // tomorrow at 7:00
        const alarm = new Date();
        alarm.setDate(alarm.getDate() + 1);
        alarm.setHours(7, 0, 0, 0);
        return JSON.stringify({ triggerTime: alarm.getTime(), packageName: 'com.google.android.deskclock' });
    }

    requestOpenAlarms()
    {
        alert('Would open the clock app\'s alarms.');
        return true;
    }

    getIsFlashlightAvailable()
    {
        return true;
    }

    getFlashlightOn()
    {
        return this.flashlightOn;
    }

    requestSetFlashlightOn(on: boolean)
    {
        this.flashlightOn = on;
        this.emit({ name: 'flashlightChanged', newValue: on });
        return true;
    }

    getCanWriteSystemSettings()
    {
        return true;
    }

    requestOpenWriteSystemSettingsPermission()
    {
        alert('Would open the "Modify system settings" permission screen.');
        return true;
    }

    getScreenBrightness()
    {
        return JSON.stringify(this.brightness);
    }

    requestSetScreenBrightnessAuto(auto: boolean)
    {
        this.brightness = { ...this.brightness, isAuto: auto };
        this.emit({ name: 'screenBrightnessChanged', newValue: this.brightness });
        return true;
    }

    requestSetScreenBrightnessLevel(level: number)
    {
        this.brightness = { isAuto: false, level };
        this.emit({ name: 'screenBrightnessChanged', newValue: this.brightness });
        return true;
    }

    getAutoRotateOn()
    {
        return this.autoRotateOn;
    }

    requestSetAutoRotateOn(on: boolean)
    {
        this.autoRotateOn = on;
        this.emit({ name: 'autoRotateChanged', newValue: on });
        return true;
    }

    getMasterSyncOn()
    {
        return this.masterSyncOn;
    }

    requestSetMasterSyncOn(on: boolean)
    {
        this.masterSyncOn = on;
        this.emit({ name: 'masterSyncChanged', newValue: on });
        return true;
    }

    getCanAccessNotificationPolicy()
    {
        return this.canAccessNotificationPolicy;
    }

    requestOpenNotificationPolicyAccessSettings()
    {
        alert('Would open the Do Not Disturb access settings.');
        return true;
    }

    getRingerMode()
    {
        return this.ringerMode;
    }

    requestSetRingerMode(mode: BridgeRingerMode)
    {
        if (!this.canAccessNotificationPolicy)
        {
            alert('Bridge needs "Do Not Disturb access" for this.');
            return false;
        }
        this.ringerMode = mode;
        this.emit({ name: 'ringerModeChanged', newValue: mode });
        return true;
    }

    getMusicVolume()
    {
        return this.musicVolume;
    }

    requestSetMusicVolume(level: number)
    {
        this.musicVolume = level;
        this.emit({ name: 'musicVolumeChanged', newValue: level });
        return true;
    }
}

export default function injectBridgeMockInDev()
{
    if (import.meta.env.DEV && !window.Bridge)
    {
        window.Bridge = new ForkBridgeMock();
    }
}
