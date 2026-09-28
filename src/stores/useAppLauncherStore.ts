import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { forgetApp, recordLaunch, type LaunchCounts } from "@/utils/mostUsed";
import { appKey, type AppRef } from "@/utils/appKey";
import { bridgeRequest } from "@/utils/toast";

const MAX_RECENT = 8;

/**
 * Every app launch goes through here (drawer, home screen, folders, dock, search), so the launcher
 * knows which apps were used recently, for the search panel's "recent apps", and how often each one
 * is opened, for the "most used apps" widget. Both are keyed by `appKey()` (the package name, plus
 * the profile for work apps).
 */
export const useAppLauncherStore = defineStore('appLauncher', () =>
{
    const bridgeEvents = useBridgeEventStore();

    // most recent first
    const recent = useLocalStorage<string[]>('launcher.recentApps', []);
    const launchCounts = useLocalStorage<LaunchCounts>('launcher.launchCounts', {});

    /** Opens an app: a package name (personal profile) or an AppRef (with `userSerial` for work apps). */
    function launch(app: string | AppRef)
    {
        const ref: AppRef = typeof app === 'string' ? { packageName: app } : app;
        const userSerial = ref.userSerial;
        const ok = userSerial == null
            ? bridgeRequest(t => Bridge.requestLaunchApp(ref.packageName, t))
            : bridgeRequest(t => Bridge.requestLaunchProfileApp(ref.packageName, userSerial, t));
        if (ok)
        {
            const key = appKey(ref);
            recent.value = [key, ...recent.value.filter(k => k !== key)].slice(0, MAX_RECENT);
            launchCounts.value = recordLaunch(launchCounts.value, key);
        }
        return ok;
    }

    bridgeEvents.addEventListener(ev =>
    {
        if (ev.name === 'appRemoved')
        {
            recent.value = recent.value.filter(p => p !== ev.packageName);
            launchCounts.value = forgetApp(launchCounts.value, ev.packageName);
        }
    });

    return {
        recent,
        launchCounts,
        launch,
    };
});
