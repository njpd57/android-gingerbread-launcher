import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { forgetApp, recordLaunch, type LaunchCounts } from "@/utils/mostUsed";

const MAX_RECENT = 8;

/**
 * Every app launch goes through here (drawer, home screen, folders, dock, search), so the launcher
 * knows which apps were used recently, for the search panel's "recent apps", and how often each one
 * is opened, for the "most used apps" widget.
 */
export const useAppLauncherStore = defineStore('appLauncher', () =>
{
    const bridgeEvents = useBridgeEventStore();

    // most recent first
    const recent = useLocalStorage<string[]>('launcher.recentApps', []);
    const launchCounts = useLocalStorage<LaunchCounts>('launcher.launchCounts', {});

    function launch(packageName: string)
    {
        const ok = Bridge.requestLaunchApp(packageName, true);
        if (ok)
        {
            recent.value = [packageName, ...recent.value.filter(p => p !== packageName)].slice(0, MAX_RECENT);
            launchCounts.value = recordLaunch(launchCounts.value, packageName);
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
