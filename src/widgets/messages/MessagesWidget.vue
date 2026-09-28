<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useBridgeEventStore, type AnyBridgeEventListener } from '@/stores/useBridgeEventStore';
import { formatNotificationTime, messageNotifications } from '@/utils/notifications';
import { bridgeHas } from '@/utils/bridge-utils';
import { bridgeRequest } from '@/utils/toast';
import type { BridgeNotification, BridgeNotificationAction } from '@/types/bridge-fork';
import ContactGlyph from '@/widgets/search/ContactGlyph.vue';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// The last conversations of the default messaging app (4x2, idea 44), with a quick reply. Read from its
// notifications (Bridge fork, with notification access), so it only shows unread messages: the fork
// doesn't read SMS. Tapping a message opens it; the title bar opens the messaging app.

const props = defineProps<{
    // the "Añadir" preview shows sample messages
    preview?: boolean;
}>();

const notifications = useNotificationsStore();
const launcher = useAppLauncherStore();
const now = useNow({ interval: 60_000 });

// the user's messaging app; asked again when coming back, in case it changed
const hasDefaultApps = bridgeHas('getDefaultAppPackageName');
const readMessagingPackage = () => hasDefaultApps ? Bridge.getDefaultAppPackageName('sms') : null;
const messagingPackage = ref(readMessagingPackage());

const bridgeEvents = useBridgeEventStore();
const onBridgeEvent: AnyBridgeEventListener = ev =>
{
    if (ev.name === 'afterResume') messagingPackage.value = readMessagingPackage();
};
bridgeEvents.addEventListener(onBridgeEvent);
onBeforeUnmount(() => bridgeEvents.removeEventListener(onBridgeEvent));

const SAMPLE = [
    { key: '1', title: 'Ana', text: '¿Nos vemos mañana a las 10?', postTime: Date.now() - 5 * 60_000 },
    { key: '2', title: 'Mamá', text: 'Llámame cuando puedas', postTime: Date.now() - 50 * 60_000 },
];

const messages = computed(() => messageNotifications(notifications.notifications, messagingPackage.value));

const message = computed(() =>
{
    if (!notifications.isSupported || !hasDefaultApps) return 'Tu versión de Bridge no puede leer los mensajes.';
    if (!notifications.canRead) return 'Toca para permitir el acceso a las notificaciones.';
    if (!messagingPackage.value) return 'No hay una app de mensajes predeterminada.';
    if (messages.value.length === 0) return 'No hay mensajes sin leer.';
    return null;
});

function openApp()
{
    if (props.preview) return;
    if (messagingPackage.value) launcher.launch(messagingPackage.value);
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

const replyAction = (n: BridgeNotification) => n.actions?.find(a => a.acceptsText) ?? null;

// the reply dialog
const replyTo = ref<{ n: BridgeNotification; action: BridgeNotificationAction } | null>(null);
const replyText = ref('');
const replyInput = ref<HTMLInputElement>();

async function startReply(n: BridgeNotification)
{
    const action = replyAction(n);
    if (!action) return;
    replyTo.value = { n, action };
    replyText.value = '';
    await nextTick();
    replyInput.value?.focus();
}

function sendReply()
{
    const r = replyTo.value;
    const text = replyText.value.trim();
    if (!r || !text) return;
    if (bridgeRequest(t => Bridge.requestReplyToNotification(r.n.key, r.action.index, text, t)))
        replyTo.value = null;
}
</script>

<template>
    <div class="messages-widget">
        <button class="bar" @click="openApp">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 2h12v9H6l-4 3z" />
            </svg>
            <span>Mensajes</span>
            <span v-if="!preview && messages.length > 0" class="count">{{ messages.length }}</span>
        </button>

        <ul v-if="preview" class="list">
            <li v-for="m in SAMPLE" :key="m.key">
                <div class="row">
                    <span class="photo glyph"><ContactGlyph /></span>
                    <span class="texts">
                        <span class="title">{{ m.title }}</span>
                        <span class="text">{{ m.text }}</span>
                    </span>
                    <span class="time">{{ formatNotificationTime(m.postTime, now) }}</span>
                </div>
            </li>
        </ul>

        <button v-else-if="message" class="message" @click="onMessageAreaClick">{{ message }}</button>

        <ul v-else class="list">
            <li v-for="n in messages" :key="n.key">
                <button class="row" @click="open(n)">
                    <img v-if="n.hasLargeIcon" class="photo" :src="Bridge.getNotificationIconURL(n.key, true)" alt="" draggable="false" />
                    <span v-else class="photo glyph"><ContactGlyph /></span>
                    <span class="texts">
                        <span class="title">{{ n.title ?? 'Mensaje' }}</span>
                        <span v-if="n.text" class="text">{{ n.text }}</span>
                    </span>
                    <span class="time">{{ formatNotificationTime(n.postTime, now) }}</span>
                </button>
                <button v-if="replyAction(n)" class="reply" @click="startReply(n)">Responder</button>
            </li>
        </ul>

        <WidgetDialog :open="!!replyTo" :title="replyTo?.n.title ?? 'Responder'" @close="replyTo = null">
            <form class="reply-form" @submit.prevent="sendReply">
                <p v-if="replyTo?.n.text" class="quoted">{{ replyTo.n.text }}</p>
                <input
                    ref="replyInput"
                    v-model="replyText"
                    type="text"
                    enterkeyhint="send"
                    :placeholder="replyTo?.action.title ?? 'Responder'" />
            </form>
            <template #buttons>
                <GbButton @click="replyTo = null">Cancelar</GbButton>
                <GbButton :disabled="!replyText.trim()" @click="sendReply">Enviar</GbButton>
            </template>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
// Songbird's look: "Mensajes" on a dark bar, the conversations recessed below
.messages-widget {
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

            > .reply {
                @include gb-widget-button;
                align-self: stretch;
                padding: 0 8px;
                border-left: 1px solid #111;
                font-size: 12px;
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

        > .title {
            font-size: 13px;
            font-weight: bold;
        }

        > .text {
            font-size: 12px;
            opacity: 0.8;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        > span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .time {
        flex-shrink: 0;
        align-self: flex-start;
        font-size: 11px;
        opacity: 0.6;
    }
}

// teleported into the dialog, outside .messages-widget
.reply-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 16px;

    > .quoted {
        margin: 0;
        font-size: 13px;
        opacity: 0.7;
    }

    > input {
        padding: 8px 10px;
        border: 1px solid #ffa800;
        border-radius: 4px;
        background: rgba(#fff, 0.95);
        color: #000;
        font: inherit;
        font-size: 15px;
        outline: none;
    }
}
</style>
