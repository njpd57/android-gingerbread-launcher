<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useBridgeEventStore, type AnyBridgeEventListener } from '@/stores/useBridgeEventStore';
import { formatNotificationTime, missedCallNotifications } from '@/utils/notifications';
import { bridgeHas } from '@/utils/bridge-utils';
import { bridgeRequest } from '@/utils/toast';
import type { BridgeNotification, BridgeNotificationAction } from '@/types/bridge-fork';
import ContactGlyph from '@/widgets/search/ContactGlyph.vue';

// Missed calls (4x2), like the messages widget: read from the phone app's notifications (Bridge fork,
// with notification access), with the notification's own buttons ("Devolver llamada", "Mensaje").
// Tapping a call opens it (the call log); the title bar opens the phone app.

const props = defineProps<{
    // the "Añadir" preview shows sample calls
    preview?: boolean;
}>();

const notifications = useNotificationsStore();
const launcher = useAppLauncherStore();
const now = useNow({ interval: 60_000 });

// the user's phone app; asked again when coming back, in case it changed
const hasDefaultApps = bridgeHas('getDefaultAppPackageName');
const readDialerPackage = () => hasDefaultApps ? Bridge.getDefaultAppPackageName('dialer') : null;
const dialerPackage = ref(readDialerPackage());

const bridgeEvents = useBridgeEventStore();
const onBridgeEvent: AnyBridgeEventListener = ev =>
{
    if (ev.name === 'afterResume') dialerPackage.value = readDialerPackage();
};
bridgeEvents.addEventListener(onBridgeEvent);
onBeforeUnmount(() => bridgeEvents.removeEventListener(onBridgeEvent));

const SAMPLE = [
    { key: '1', title: 'Ana', text: 'Llamada perdida', postTime: Date.now() - 12 * 60_000 },
    { key: '2', title: '+56 9 1234 5678', text: 'Llamada perdida', postTime: Date.now() - 3 * 3_600_000 },
];

const calls = computed(() => missedCallNotifications(notifications.notifications, dialerPackage.value));

const message = computed(() =>
{
    if (!notifications.isSupported) return 'Tu versión de Bridge no puede leer las llamadas perdidas.';
    if (!notifications.canRead) return 'Toca para permitir el acceso a las notificaciones.';
    if (calls.value.length === 0) return 'No hay llamadas perdidas.';
    return null;
});

// the notification's buttons, except "Reply" ones that take text
const buttons = (n: BridgeNotification) => (n.actions ?? []).filter(a => !a.acceptsText).slice(0, 2);

function openApp()
{
    if (props.preview) return;
    if (dialerPackage.value) launcher.launch(dialerPackage.value);
}

function onMessageAreaClick()
{
    if (props.preview) return;
    if (notifications.isSupported && !notifications.canRead) notifications.requestAccess();
    else openApp();
}

function open(n: BridgeNotification)
{
    bridgeRequest(t => Bridge.requestOpenNotification(n.key, t));
}

function runAction(n: BridgeNotification, action: BridgeNotificationAction)
{
    bridgeRequest(t => Bridge.requestNotificationAction(n.key, action.index, t));
}
</script>

<template>
    <div class="missed-calls-widget">
        <button class="bar" @click="openApp">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <!-- a handset with the "missed" arrow -->
                <path d="M3.2 1.5l2 2.4-1.2 1.6c.7 1.6 2 2.9 3.6 3.6l1.6-1.2 2.4 2-1.1 2.3C6 12 2.8 8.8 1 4.3z" />
                <path d="M9.5 1.5l2.5 2.5 2.5-2.5M12 4V1" fill="none" stroke="#e53935" stroke-width="1.6" />
            </svg>
            <span>Llamadas perdidas</span>
            <span v-if="!preview && calls.length > 0" class="count">{{ calls.length }}</span>
        </button>

        <ul v-if="preview" class="list">
            <li v-for="c in SAMPLE" :key="c.key">
                <div class="row">
                    <span class="photo glyph"><ContactGlyph /></span>
                    <span class="texts">
                        <span class="title">{{ c.title }}</span>
                        <span class="text">{{ c.text }}</span>
                    </span>
                    <span class="time">{{ formatNotificationTime(c.postTime, now) }}</span>
                </div>
            </li>
        </ul>

        <button v-else-if="message" class="message" @click="onMessageAreaClick">{{ message }}</button>

        <ul v-else class="list">
            <li v-for="n in calls" :key="n.key">
                <button class="row" @click="open(n)">
                    <img v-if="n.hasLargeIcon" class="photo" :src="Bridge.getNotificationIconURL(n.key, true)" alt="" draggable="false" />
                    <span v-else class="photo glyph"><ContactGlyph /></span>
                    <span class="texts">
                        <span class="title">{{ n.title ?? 'Llamada perdida' }}</span>
                        <span v-if="n.text" class="text">{{ n.text }}</span>
                    </span>
                    <span class="time">{{ formatNotificationTime(n.postTime, now) }}</span>
                </button>
                <button
                    v-for="a in buttons(n)"
                    :key="a.index"
                    class="action"
                    @click="runAction(n, a)">
                    {{ a.title }}
                </button>
            </li>
        </ul>
    </div>
</template>

<style scoped lang="scss">
// the messages widget's look: a title bar over a recessed list
.missed-calls-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    > .bar {
        @include gb-widget-bar;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border: 1px solid #111;
        border-radius: 4px;
        font-size: 13px;
        font-weight: bold;

        &:active {
            @include gb-pressed;
        }

        > svg {
            flex-shrink: 0;
            width: 14px;
            height: 14px;
            fill: #8bc34a;
        }

        > .count {
            margin-left: auto;
            padding: 0 6px;
            border: 1px solid rgba(#fff, 0.3);
            border-radius: 2px;
            background: linear-gradient(to bottom, #5a5a5a, #333);
            font-size: 11px;
        }
    }

    > .message {
        @include gb-widget-inset;
        flex: 1;
        padding: 8px 12px;
        font-size: 13px;
        color: #ccc;
        text-align: center;
    }

    > .list {
        @include gb-widget-inset;
        flex: 1;
        min-height: 0;
        margin: 0;
        padding: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        list-style: none;

        > li {
            display: flex;
            align-items: center;

            & + li {
                border-top: 1px solid rgba(#fff, 0.08);
            }

            > .row {
                flex: 1;
                min-width: 0;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 5px 8px;

                &:active {
                    @include gb-pressed;
                }
            }

            > .action {
                @include gb-widget-button;
                align-self: stretch;
                max-width: 76px;
                padding: 0 6px;
                border-left: 1px solid #111;
                font-size: 11px;
                text-align: center;
            }
        }
    }

    .photo {
        @include gb-contact-photo;
        flex-shrink: 0;
        width: 32px;
        height: 32px;

        &.glyph {
            display: grid;
            place-items: end center;
            overflow: hidden;

            > :deep(svg) {
                width: 26px;
                height: 26px;
            }
        }
    }

    .texts {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;

        > span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        > .title {
            font-size: 13px;
            font-weight: bold;
        }

        > .text {
            font-size: 12px;
            opacity: 0.8;
        }
    }

    .time {
        flex-shrink: 0;
        align-self: flex-start;
        font-size: 11px;
        opacity: 0.6;
    }
}
</style>
