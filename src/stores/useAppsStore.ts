import { simplifyString } from "@/utils/misc-utils";
import { appKey, type AppRef } from "@/utils/appKey";
import { bridgeHas } from "@/utils/bridge-utils";
import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import type { BridgeGetAppsResponse, BridgeInstalledAppInfo } from "@bridgelauncher/api";
import type { BridgeGetProfileAppsResponse, BridgeProfileApp } from "@/types/bridge-fork";
import { bridgeRequest } from "@/utils/toast";

export interface InstalledAppInfo extends BridgeInstalledAppInfo, AppRef
{
    /** See `appKey()`: the package name, plus the profile for work apps. */
    key: string;
    labelSimplified: string;
    /** In the work profile (Bridge fork only). */
    isWork: boolean;
    /** Work apps turned off. */
    isPaused: boolean;
}

export enum RequestStatus
{
    Idle,
    InProgress,
    Error,
}

export const useAppsStore = defineStore('apps', () =>
{
    const bridgeEvents = useBridgeEventStore();

    // Bridge fork: the apps of every profile, so work apps (e.g. work Teams) show up too
    const hasProfiles = bridgeHas('getProfileAppsURL');

    /** Keyed by `appKey()`: personal apps by package name, so lookups by package name find them. */
    const apps = ref(new Map<string, InstalledAppInfo>());

    const requestStatus = ref(RequestStatus.Idle);
    const requestErrorMessage = ref('');
    // a change arrived while a request was running: request again once it ends
    let requestAgain = false;

    async function requestAppsAsync()
    {
        if (requestStatus.value === RequestStatus.InProgress)
        {
            requestAgain = true;
            return;
        }

        requestStatus.value = RequestStatus.InProgress;
        requestErrorMessage.value = '';

        try
        {
            const newApps = new Map<string, InstalledAppInfo>();

            if (hasProfiles)
            {
                const resp = await fetch(Bridge.getProfileAppsURL());
                const respApps = await resp.json() as BridgeGetProfileAppsResponse;
                for (const a of respApps.apps)
                {
                    const app = processProfileAppFromAPI(a);
                    newApps.set(app.key, app);
                }
            }
            else
            {
                const resp = await fetch(Bridge.getAppsURL());
                const respApps = await resp.json() as BridgeGetAppsResponse;
                for (const a of respApps.apps)
                    newApps.set(a.packageName, processAppFromAPI(a));
            }

            apps.value = newApps;
            requestStatus.value = RequestStatus.Idle;
        }
        catch (err)
        {
            console.error(err);
            requestStatus.value = RequestStatus.Error;
            requestErrorMessage.value = `${err}`;
        }

        if (requestAgain)
        {
            requestAgain = false;
            requestAppsAsync();
        }
    }

    function processAppFromAPI(a: BridgeInstalledAppInfo): InstalledAppInfo
    {
        return {
            ...a,
            key: a.packageName,
            labelSimplified: simplifyString(a.label),
            isWork: false,
            isPaused: false,
        };
    }

    function processProfileAppFromAPI(a: BridgeProfileApp): InstalledAppInfo
    {
        const isWork = a.profile !== 'personal';
        const ref: AppRef = isWork ? { packageName: a.packageName, userSerial: a.userSerial } : { packageName: a.packageName };
        return {
            ...ref,
            label: a.label,
            key: appKey(ref),
            labelSimplified: simplifyString(a.label),
            isWork,
            isPaused: a.isPaused,
        };
    }

    function get(app: AppRef)
    {
        return apps.value.get(appKey(app));
    }

    function has(app: AppRef)
    {
        return apps.value.has(appKey(app));
    }

    /** The app's icon; work apps get it with the work briefcase. */
    function iconURL(app: AppRef)
    {
        return app.userSerial == null
            ? Bridge.getDefaultAppIconURL(app.packageName)
            : Bridge.getProfileAppIconURL(app.packageName, app.userSerial);
    }

    function openAppInfo(app: AppRef)
    {
        const userSerial = app.userSerial;
        return userSerial == null
            ? bridgeRequest(t => Bridge.requestOpenAppInfo(app.packageName, t))
            : bridgeRequest(t => Bridge.requestOpenProfileAppInfo(app.packageName, userSerial, t));
    }

    requestAppsAsync();

    bridgeEvents.addEventListener(ev =>
    {
        // with profiles, every change (personal ones too) also comes as profileAppsChanged
        if (ev.name === 'profileAppsChanged')
        {
            requestAppsAsync();
        }
        else if (hasProfiles)
        {
            return;
        }
        else if (ev.name === 'appInstalled' || ev.name === 'appChanged')
        {
            apps.value.set(ev.app.packageName, processAppFromAPI(ev.app));
        }
        else if (ev.name === 'appRemoved')
        {
            apps.value.delete(ev.packageName);
        }
    });

    return {
        apps,
        hasProfiles,
        get,
        has,
        iconURL,
        openAppInfo,
        requestAppsAsync,
        requestStatus,
        requestErrorMessage,
    };
});
