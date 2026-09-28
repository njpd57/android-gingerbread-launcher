import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { useNotificationsStore } from "./useNotificationsStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeMediaSession } from "@/types/bridge-fork";
import { bridgeRequest } from "@/utils/toast";

// What's playing, for the music widget and the notification panel. Only our Bridge fork can see other
// apps' media sessions, and only with notification access (Android lists them to notification listeners).
export const useMediaStore = defineStore('media', () =>
{
    const bridgeEvents = useBridgeEventStore();
    const notifications = useNotificationsStore();

    const isSupported = bridgeHas('getMediaSession') && bridgeHas('requestMediaAction');

    const session = ref<BridgeMediaSession | null>(null);
    const artUrl = ref<string | null>(null);

    function setSession(value: BridgeMediaSession | null)
    {
        session.value = value;
        // the art URL changes with every track, so it's read again with each change
        artUrl.value = value?.hasArt ? Bridge.getMediaArtURL() : null;
    }

    if (isSupported)
    {
        setSession(JSON.parse(Bridge.getMediaSession()));

        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'mediaSessionChanged')
                setSession(ev.session);
        });
    }

    return {
        isSupported,
        canRead: computed(() => notifications.canRead),
        session,
        artUrl,
        requestAccess: () => notifications.requestAccess(),
        playPause: () => bridgeRequest(t => Bridge.requestMediaAction('playPause', t)),
        next: () => bridgeRequest(t => Bridge.requestMediaAction('next', t)),
        previous: () => bridgeRequest(t => Bridge.requestMediaAction('previous', t)),
        openApp: () => bridgeRequest(t => Bridge.requestOpenMediaApp(t)),
    };
});
