import { defineStore } from "pinia";
import { ref, toValue, readonly, computed } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeButtonVisibility, OverscrollEffects, SystemNightModeOrError, BridgeTheme, SystemBarAppearance } from '@bridgelauncher/api';

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

    // these can be missing from older Bridge builds even though the API types declare them
    const supportsLockScreen = bridgeHas('requestLockScreen') && bridgeHas('getCanLockScreen');
    const supportsNightMode = bridgeHas('requestSetSystemNightMode');

    const canLockScreen = ref(false);
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
            Bridge.showToast('Tu versión de Bridge no permite bloquear la pantalla.');
            return false;
        }
        if (!canLockScreen.value)
        {
            Bridge.showToast('Para bloquear, activa el servicio de accesibilidad de Bridge y permite bloquear la pantalla en sus ajustes.', true);
            Bridge.requestOpenBridgeSettings(true);
            return false;
        }
        return Bridge.requestLockScreen(true);
    }

    function toggleNightMode()
    {
        if (!supportsNightMode)
        {
            Bridge.showToast('Tu versión de Bridge no permite cambiar el modo noche.');
            return;
        }
        if (!canRequestSystemNightMode.value)
        {
            Bridge.showToast('Bridge necesita el permiso WRITE_SECURE_SETTINGS para cambiar el modo noche (se concede una vez por adb).', true);
            return;
        }
        Bridge.requestSetSystemNightMode(systemNightMode.value === 'yes' ? 'no' : 'yes');
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
            set: x => Bridge.requestSetBridgeButtonVisibility(x),
        }),
        drawSystemWallpaperBehindWebView: computed({
            get: () => toValue(drawSystemWallpaperBehindWebView),
            set: x => Bridge.requestSetDrawSystemWallpaperBehindWebViewEnabled(x),
        }),
        overscrollEffects: computed({
            get: () => toValue(overscrollEffects),
            set: x => Bridge.requestSetOverscrollEffects(x),
        }),
        systemNightMode: computed({
            get: () => toValue(systemNightMode),
            set: x =>
            {
                if (supportsNightMode && x !== 'unknown' && x !== 'error')
                    Bridge.requestSetSystemNightMode(x);
            }
        }),
        bridgeTheme: computed({
            get: () => toValue(bridgeTheme),
            set: x => Bridge.requestSetBridgeTheme(x),
        }),
        statusBarAppearance: computed({
            get: () => toValue(statusBarAppearance),
            set: x => Bridge.requestSetStatusBarAppearance(x),
        }),
        navigationBarAppearance: computed({
            get: () => toValue(navigationBarAppearance),
            set: x => Bridge.requestSetNavigationBarAppearance(x),
        }),

        supportsLockScreen,
        supportsNightMode,
        canLockScreen: readonly(canLockScreen),
        canRequestSystemNightMode: readonly(canRequestSystemNightMode),
        lockScreen,
        toggleNightMode,
    };
});