import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { useDragStore } from "./useDragStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeAppShortcut, BridgeGetAppShortcutsResponse } from "@/types/bridge-fork";

export interface AppShortcutsMenu
{
    packageName: string;
    label: string;
    /** The long-pressed icon's box, to place the menu next to it. */
    anchor: DOMRect;
    shortcuts: BridgeAppShortcut[];
}

// The menu that long-pressing an app opens, with its shortcuts ("New message", "Navigate home"...)
// and "App info". Only with our Bridge fork. The same long press also starts a drag: moving the
// finger closes the menu and carries on dragging (like Android 7.1+ launchers).
export const useAppShortcutsStore = defineStore('appShortcuts', () =>
{
    const bridgeEvents = useBridgeEventStore();
    const drag = useDragStore();

    const isSupported = bridgeHas('getAppShortcutsURL') && Bridge.getCanAccessAppShortcuts();

    const menu = ref<AppShortcutsMenu | null>(null);
    let requestId = 0;

    async function open(packageName: string, label: string, anchor: DOMRect)
    {
        if (!isSupported) return;

        const id = ++requestId;
        menu.value = { packageName, label, anchor, shortcuts: [] };

        try
        {
            const res = await fetch(Bridge.getAppShortcutsURL(packageName));
            const data = await res.json() as BridgeGetAppShortcutsResponse;
            // a newer menu (or none) may have replaced this one meanwhile
            if (id === requestId && menu.value)
                menu.value = { ...menu.value, shortcuts: data.shortcuts };
        }
        catch (ex)
        {
            console.error('Failed to load app shortcuts', ex);
        }
    }

    function close()
    {
        requestId++;
        menu.value = null;
    }

    function start(shortcut: BridgeAppShortcut)
    {
        const m = menu.value;
        if (!m) return;
        Bridge.requestStartAppShortcut(m.packageName, shortcut.id, true);
        close();
    }

    function openAppInfo()
    {
        const m = menu.value;
        if (!m) return;
        Bridge.requestOpenAppInfo(m.packageName, true);
        close();
    }

    // dragging the app instead
    watch(() => drag.hasMoved, moved =>
    {
        if (moved) close();
    });

    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'newIntent' || ev.name === 'beforePause')
            close();
    });

    return {
        isSupported,
        menu,
        open,
        close,
        start,
        openAppInfo,
    };
});
