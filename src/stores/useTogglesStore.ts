import { defineStore } from "pinia";
import { ref, toValue, readonly, computed } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeButtonVisibility, OverscrollEffects, SystemNightModeOrError, BridgeTheme, SystemBarAppearance } from '@bridgelauncher/api';
import { bridgeRequest, showToast } from "@/utils/toast";
import { API_LEVELS, supportsApiLevel } from "@/utils/androidVersion";

/** How long App.vue's screen-off animation lasts before the screen locks. */
export const SCREEN_OFF_ANIMATION_MS = 450;
// after asking to lock, when to undo the animation (the screen is off by then)
const SCREEN_OFF_RESET_MS = 1500;

export const useTogglesStore = defineStore('toggles', () => 
{
    const bridgeEvents = useBridgeEventStore();

    const bridgeButtonVisibility = ref(Bridge.getBridgeButtonVisibility());
    const drawSystemWallpaperBehindWebView = ref(Bridge.getDrawSystemWallpaperBehindWebViewEnabled());
    const overscrollEffects = ref(Bridge.getOverscrollEffects());
    const systemNightMode = ref(Bridge.getSystemNightMode());
    const bridgeTheme = ref(Bridge.getBridgeTheme());
    const statusBarAppearance = ref(Bridge.getStatusBarAppearance());
    const navigationBarAppearance = ref(Bridge.getNavigationBarAppearance());

    // these can be missing from older Bridge builds even though the API types declare them,
    // and Bridge can only do them from some Android version on
    const bridgeLocksScreen = bridgeHas('requestLockScreen') && bridgeHas('getCanLockScreen');
    const bridgeSetsNightMode = bridgeHas('requestSetSystemNightMode');
    const androidLocksScreen = supportsApiLevel(API_LEVELS.lockScreen);
    const androidSetsNightMode = supportsApiLevel(API_LEVELS.setNightMode);
    const supportsLockScreen = bridgeLocksScreen && androidLocksScreen;
    const supportsNightMode = bridgeSetsNightMode && androidSetsNightMode;

    const canLockScreen = ref(false);
    // App.vue plays the screen-off animation while true
    const screenTurningOff = ref(false);
    const canRequestSystemNightMode = ref(false);

    // permissions can be granted outside Bridge (e.g. `adb shell pm grant`) without an event,
    // so they're read at startup and again whenever the launcher comes back to the foreground
    function readPermissions()
    {
        canLockScreen.value = supportsLockScreen && Bridge.getCanLockScreen();
        // without the permission check, assume it can and let the request (and Bridge's error toast) tell
        canRequestSystemNightMode.value = supportsNightMode
            && (bridgeHas('getCanRequestSystemNightMode') ? Bridge.getCanRequestSystemNightMode() : true);
        systemNightMode.value = Bridge.getSystemNightMode();
    }

    readPermissions();

    // explain what's missing instead of failing silently
    function lockScreen()
    {
        if (!supportsLockScreen)
        {
            showToast(bridgeLocksScreen
                ? 'Bloquear la pantalla necesita Android 9 o posterior.'
                : 'Tu versión de Bridge no permite bloquear la pantalla.');
            return false;
        }
        if (!canLockScreen.value)
        {
            showToast('Para bloquear, activa el servicio de accesibilidad de Bridge y permite bloquear la pantalla en sus ajustes.', true);
            bridgeRequest(t => Bridge.requestOpenBridgeSettings(t));
            return false;
        }
        // Gingerbread's "old TV" screen-off: App.vue collapses the launcher into a line first,
        // then the screen locks. The animation is undone once the screen is surely off, so the
        // launcher is back to normal on unlock.
        if (screenTurningOff.value) return true;
        screenTurningOff.value = true;
        setTimeout(() =>
        {
            const locked = bridgeRequest(t => Bridge.requestLockScreen(t));
            setTimeout(() => screenTurningOff.value = false, locked ? SCREEN_OFF_RESET_MS : 0);
        }, SCREEN_OFF_ANIMATION_MS);
        return true;
    }

    function toggleNightMode()
    {
        if (!supportsNightMode)
        {
            showToast(bridgeSetsNightMode
                ? 'Cambiar el modo noche necesita Android 11 o posterior.'
                : 'Tu versión de Bridge no permite cambiar el modo noche.');
            return;
        }
        if (!canRequestSystemNightMode.value)
        {
            showToast('Bridge necesita el permiso WRITE_SECURE_SETTINGS para cambiar el modo noche (se concede una vez por adb).', true);
            return;
        }
        bridgeRequest(t => Bridge.requestSetSystemNightMode(systemNightMode.value === 'yes' ? 'no' : 'yes', t));
    }

    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'bridgeButtonVisibilityChanged')
            bridgeButtonVisibility.value = ev.newValue;
        else if (ev.name === 'drawSystemWallpaperBehindWebViewChanged')
            drawSystemWallpaperBehindWebView.value = ev.newValue;
        else if (ev.name === 'overscrollEffectsChanged')
            overscrollEffects.value = ev.newValue;
        else if (ev.name === 'systemNightModeChanged')
            systemNightMode.value = ev.newValue;
        else if (ev.name === 'bridgeThemeChanged')
            bridgeTheme.value = ev.newValue;
        else if (ev.name === 'statusBarAppearanceChanged')
            statusBarAppearance.value = ev.newValue;
        else if (ev.name === 'navigationBarAppearanceChanged')
            navigationBarAppearance.value = ev.newValue;
        else if (ev.name === 'canLockScreenChanged')
            canLockScreen.value = ev.newValue;
        else if (ev.name === 'canRequestSystemNightModeChanged')
            canRequestSystemNightMode.value = ev.newValue;
        else if (ev.name === 'afterResume')
            readPermissions();
    });

    return {
        bridgeButtonVisibility: computed({
            get: () => toValue(bridgeButtonVisibility),
            set: x => bridgeRequest(t => Bridge.requestSetBridgeButtonVisibility(x, t)),
        }),
        drawSystemWallpaperBehindWebView: computed({
            get: () => toValue(drawSystemWallpaperBehindWebView),
            set: x => bridgeRequest(t => Bridge.requestSetDrawSystemWallpaperBehindWebViewEnabled(x, t)),
        }),
        overscrollEffects: computed({
            get: () => toValue(overscrollEffects),
            set: x => bridgeRequest(t => Bridge.requestSetOverscrollEffects(x, t)),
        }),
        systemNightMode: computed({
            get: () => toValue(systemNightMode),
            set: x =>
            {
                if (supportsNightMode && x !== 'unknown' && x !== 'error')
                    bridgeRequest(t => Bridge.requestSetSystemNightMode(x, t));
            }
        }),
        bridgeTheme: computed({
            get: () => toValue(bridgeTheme),
            set: x => bridgeRequest(t => Bridge.requestSetBridgeTheme(x, t)),
        }),
        statusBarAppearance: computed({
            get: () => toValue(statusBarAppearance),
            set: x => bridgeRequest(t => Bridge.requestSetStatusBarAppearance(x, t)),
        }),
        navigationBarAppearance: computed({
            get: () => toValue(navigationBarAppearance),
            set: x => bridgeRequest(t => Bridge.requestSetNavigationBarAppearance(x, t)),
        }),

        supportsLockScreen,
        supportsNightMode,
        canLockScreen: readonly(canLockScreen),
        canRequestSystemNightMode: readonly(canRequestSystemNightMode),
        lockScreen,
        screenTurningOff: readonly(screenTurningOff),
        toggleNightMode,
    };
});