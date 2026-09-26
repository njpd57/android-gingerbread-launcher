<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { useMenuStore } from '@/stores/useMenuStore';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { useQuickSettingsStore } from '@/stores/useQuickSettingsStore';
import { useAppsStore } from '@/stores/useAppsStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import { formatNotificationTime, notificationPanelSections } from '@/utils/notifications';
import type { BridgeNotification, BridgeNotificationAction } from '@/types/bridge-fork';
import { useLongPress } from '@/composables/useLongPress';
import { bridgeHas } from '@/utils/bridge-utils';
import GbDialog from '@/components/GbDialog.vue';
import OverscrollGlow from '@/components/OverscrollGlow.vue';
import QuickToggles from './QuickToggles.vue';
import MusicPlayer from '@/widgets/music/MusicPlayer.vue';
import { useMediaStore } from '@/stores/useMediaStore';

// Our own notification panel, in the style of Gingerbread's (2.3's dark one): "Borrar" at the top,
// "En curso" and "Notificaciones" sections, and a handle at the bottom to close it. On top, a row of
// quick settings. Only with our Bridge fork; it covers the launcher, not other apps.
// Long-pressing a notification opens a menu (open / dismiss / app info), and notifications show their
// buttons ("Marcar como leído"…); a "Reply" button opens a text field right under the notification.

const menu = useMenuStore();
const notifications = useNotificationsStore();
const qs = useQuickSettingsStore();
const apps = useAppsStore();
const settings = useSettingsStore();
const media = useMediaStore();

const listEl = ref<HTMLElement>();
const glow = useOverscrollGlow(listEl, 'y', () => settings.gingerbreadOverscroll);

const now = useNow({ interval: 60_000 });
const dateLabel = computed(() =>
    new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(now.value));

// the player above the list already stands for the media app's notification
const sections = computed(() => notificationPanelSections(notifications.notifications, !!media.session));
const isEmpty = computed(() => sections.value.ongoing.length === 0 && sections.value.others.length === 0);
const hasClearable = computed(() => [...sections.value.ongoing, ...sections.value.others].some(n => n.isClearable));

function title(n: BridgeNotification)
{
    return n.title ?? apps.apps.get(n.packageName)?.label ?? n.packageName;
}

// the large icon (a contact photo, album art...), else the app's icon; system notifications (e.g.
// SystemUI's "flashlight on") come from packages that aren't launchable apps and have no app icon,
// so those fall back to the notification's small icon
function iconUrl(n: BridgeNotification)
{
    if (n.hasLargeIcon)
        return Bridge.getNotificationIconURL(n.key, true);
    return Bridge.getDefaultAppIconURL(n.packageName);
}

// the small icon is only a silhouette (Android tints it), so it's drawn as a mask in a light color,
// like the status bar does; used as is, it could come out black on the dark panel
function usesSmallIcon(n: BridgeNotification)
{
    return !n.hasLargeIcon && !apps.apps.has(n.packageName);
}

function smallIconStyle(n: BridgeNotification)
{
    const url = `url("${Bridge.getNotificationIconURL(n.key)}")`;
    return { maskImage: url, webkitMaskImage: url };
}

// older fork builds send notifications without actions
const supportsActions = bridgeHas('requestNotificationAction');

// the notification whose long-press menu is open
const menuFor = ref<BridgeNotification | null>(null);
const longPress = useLongPress<BridgeNotification>(n => menuFor.value = n);

function open(n: BridgeNotification)
{
    if (longPress.consumeLongPress()) return;
    if (Bridge.requestOpenNotification(n.key, true))
        menu.closeAll();
}

function openFromMenu()
{
    const n = menuFor.value;
    menuFor.value = null;
    if (n && Bridge.requestOpenNotification(n.key, true))
        menu.closeAll();
}

function dismissFromMenu()
{
    const n = menuFor.value;
    menuFor.value = null;
    if (n) Bridge.requestDismissNotification(n.key, true);
}

function appInfoFromMenu()
{
    const n = menuFor.value;
    menuFor.value = null;
    if (n && Bridge.requestOpenAppInfo(n.packageName, true))
        menu.closeAll();
}

// the "Reply" field that is open, if any
const replyTo = ref<{ key: string; action: BridgeNotificationAction } | null>(null);
const replyText = ref('');
const replyInput = ref<HTMLInputElement[]>([]);

async function runAction(n: BridgeNotification, action: BridgeNotificationAction)
{
    if (action.acceptsText)
    {
        replyTo.value = { key: n.key, action };
        replyText.value = '';
        await nextTick();
        replyInput.value[0]?.focus();
        return;
    }
    Bridge.requestNotificationAction(n.key, action.index, true);
}

function sendReply()
{
    const r = replyTo.value;
    const text = replyText.value.trim();
    if (!r || !text) return;
    if (Bridge.requestReplyToNotification(r.key, r.action.index, text, true))
    {
        replyTo.value = null;
        replyText.value = '';
    }
}

// like Gingerbread's "Clear" button: dismisses everything that can be dismissed
function clearAll()
{
    for (const n of notifications.notifications)
    {
        if (n.isClearable)
            Bridge.requestDismissNotification(n.key, false);
    }
}

function openSystemShade()
{
    menu.closeAll();
    Bridge.requestExpandNotificationShade(true);
}
</script>

<template>
    <Transition name="shade">
        <div v-if="menu.isNotificationPanelOpen" class="notification-panel">
            <QuickToggles v-if="qs.isSupported" class="quick-toggles" />

            <div class="header">
                <span class="date">{{ dateLabel }}</span>
                <button v-if="hasClearable" class="clear" @click="clearAll">Borrar</button>
            </div>

            <!-- only while something is playing (or paused), like Android's media controls -->
            <MusicPlayer v-if="media.session" variant="panel" class="player" />

            <div class="list-wrap">
                <div class="list" ref="listEl">
                    <div v-if="!notifications.canRead" class="empty">
                        <p>Para ver tus notificaciones aquí, permite que Bridge acceda a ellas.</p>
                        <button class="access" @click="notifications.requestAccess()">Permitir acceso</button>
                    </div>

                    <template v-else>
                        <template v-for="section in [
                            { label: 'En curso', items: sections.ongoing },
                            { label: 'Notificaciones', items: sections.others },
                        ]" :key="section.label">
                            <template v-if="section.items.length > 0">
                                <div class="section">{{ section.label }}</div>
                                <div v-for="n in section.items" :key="n.key" class="item">
                                    <button
                                        class="row"
                                        @pointerdown="longPress.down(n, $event)"
                                        @pointermove="longPress.move"
                                        @pointerup="longPress.cancel"
                                        @pointercancel="longPress.cancel"
                                        @pointerleave="longPress.cancel"
                                        @contextmenu.prevent
                                        @click="open(n)">
                                        <span
                                            v-if="usesSmallIcon(n)"
                                            class="small-icon"
                                            :style="smallIconStyle(n)"
                                            aria-hidden="true"></span>
                                        <img v-else :src="iconUrl(n)" alt="" draggable="false" />
                                        <span class="texts">
                                            <span class="title">{{ title(n) }}</span>
                                            <span v-if="n.text" class="text">{{ n.text }}</span>
                                        </span>
                                        <span class="time">{{ formatNotificationTime(n.postTime, now) }}</span>
                                    </button>

                                    <div v-if="supportsActions && n.actions?.length" class="actions">
                                        <button
                                            v-for="a in n.actions"
                                            :key="a.index"
                                            @click="runAction(n, a)">
                                            {{ a.title }}
                                        </button>
                                    </div>

                                    <form
                                        v-if="replyTo?.key === n.key"
                                        class="reply"
                                        @submit.prevent="sendReply">
                                        <input
                                            ref="replyInput"
                                            v-model="replyText"
                                            type="text"
                                            enterkeyhint="send"
                                            :placeholder="replyTo.action.title"
                                            :aria-label="replyTo.action.title" />
                                        <button type="submit" :disabled="!replyText.trim()">Enviar</button>
                                        <button type="button" class="cancel" aria-label="Cancelar" @click="replyTo = null">×</button>
                                    </form>
                                </div>
                            </template>
                        </template>

                        <div v-if="isEmpty" class="empty">No hay notificaciones</div>
                    </template>

                    <button class="system-shade" @click="openSystemShade">Abrir notificaciones de Android</button>
                </div>
                <OverscrollGlow edge="top" :intensity="glow.start.value" :pulling="glow.pulling.value" />
                <OverscrollGlow edge="bottom" :intensity="glow.end.value" :pulling="glow.pulling.value" />
            </div>

            <!-- the long-press menu, like Gingerbread's context menus -->
            <GbDialog
                :open="!!menuFor"
                :title="menuFor ? title(menuFor) : ''"
                @close="menuFor = null">
                <div class="notification-menu">
                    <button @click="openFromMenu">Abrir</button>
                    <button v-if="menuFor?.isClearable" @click="dismissFromMenu">Descartar</button>
                    <button @click="appInfoFromMenu">Información de la app</button>
                </div>
            </GbDialog>

            <!-- Gingerbread's grip at the bottom of the shade -->
            <button class="handle" aria-label="Cerrar notificaciones" @click="menu.closeAll()">
                <span class="grip"></span>
            </button>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.notification-panel {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: calc(var(--status-bar-height) + 8px) 8px var(--nav-bar-height);
    background-color: #000;
    color: #fff;

    > .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 40px;
        padding: 0 4px 0 8px;

        > .date {
            font-size: 15px;
            color: #ddd;
            // "jueves, 25 de septiembre" -> "Jueves, 25 de septiembre"
            &::first-letter {
                text-transform: uppercase;
            }
        }

        > .clear {
            appearance: none;
            min-width: 80px;
            min-height: 36px;
            padding: 4px 14px;
            border: 1px solid #5a5a5a;
            border-radius: 5px;
            background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
            color: #111;
            font: inherit;
            font-size: 14px;
            cursor: pointer;

            &:active {
                border-color: #b35f00;
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
            }
        }
    }

    > .list-wrap {
        position: relative;
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;

        > .list {
            flex: 1;
            overflow-y: auto;
            overscroll-behavior: contain;

            // Gingerbread's gray section bands
            > .section {
                padding: 4px 12px;
                background: linear-gradient(to bottom, #5a5a5a, #454545);
                color: #e0e0e0;
                font-size: 13px;
                font-weight: bold;
            }

            > .item {
                border-bottom: 1px solid #2a2a2a;

                > .row {
                    appearance: none;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    width: 100%;
                    min-height: 64px;
                    padding: 8px 12px;
                    border: none;
                    border-bottom: none;
                    background: none;
                    color: inherit;
                    font: inherit;
                    text-align: left;
                    cursor: pointer;

                    > img {
                        flex-shrink: 0;
                        width: 40px;
                        height: 40px;
                        border-radius: 3px;
                        object-fit: cover;
                    }

                    // a silhouette, centered in the same 40px box as the images
                    > .small-icon {
                        flex-shrink: 0;
                        width: 40px;
                        height: 40px;
                        background-color: #e6e6e6;
                        mask-size: 28px;
                        mask-repeat: no-repeat;
                        mask-position: center;
                        -webkit-mask-size: 28px;
                        -webkit-mask-repeat: no-repeat;
                        -webkit-mask-position: center;
                    }

                    > .texts {
                        flex: 1;
                        min-width: 0;
                        display: flex;
                        flex-direction: column;
                        gap: 2px;

                        > .title {
                            overflow: hidden;
                            font-size: 16px;
                            font-weight: bold;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }

                        > .text {
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            color: #aaa;
                            font-size: 14px;
                            line-height: 1.3;
                        }
                    }

                    > .time {
                        flex-shrink: 0;
                        align-self: flex-start;
                        color: #aaa;
                        font-size: 12px;
                    }

                    &:active {
                        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                        color: #111;

                        > .texts > .text,
                        > .time {
                            color: #333;
                        }
                    }
                }

                // the notification's buttons, in a row under it
                > .actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    padding: 0 12px 8px 64px;

                    > button {
                        appearance: none;
                        min-height: 32px;
                        padding: 4px 12px;
                        border: 1px solid #5a5a5a;
                        border-radius: 4px;
                        background: linear-gradient(to bottom, #4a4a4a, #2c2c2c);
                        color: #e8e8e8;
                        font: inherit;
                        font-size: 13px;
                        cursor: pointer;

                        &:active {
                            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                            color: #111;
                        }
                    }
                }

                // the "Reply" field
                > .reply {
                    display: flex;
                    gap: 6px;
                    padding: 0 12px 10px 64px;

                    > input {
                        flex: 1;
                        min-width: 0;
                        padding: 6px 10px;
                        border: 1px solid #ffa800;
                        border-radius: 3px;
                        background: #fff;
                        color: #111;
                        font: inherit;
                        font-size: 15px;
                        outline: none;
                    }

                    > button {
                        appearance: none;
                        padding: 4px 12px;
                        border: 1px solid #5a5a5a;
                        border-radius: 4px;
                        background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
                        color: #111;
                        font: inherit;
                        font-size: 14px;
                        cursor: pointer;

                        &:disabled {
                            opacity: 0.5;
                        }

                        &.cancel {
                            padding: 4px 10px;
                            font-size: 18px;
                            line-height: 1;
                        }

                        &:active:not(:disabled) {
                            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                        }
                    }
                }
            }

            > .empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                padding: 32px 16px;
                color: #888;
                text-align: center;

                > p {
                    margin: 0;
                }

                > .access {
                    appearance: none;
                    min-height: 44px;
                    padding: 8px 16px;
                    border: 1px solid #5a5a5a;
                    border-radius: 5px;
                    background: linear-gradient(to bottom, #f4f4f4, #c9c9c9);
                    color: #111;
                    font: inherit;
                    cursor: pointer;

                    &:active {
                        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                    }
                }
            }

            > .system-shade {
                appearance: none;
                display: block;
                width: 100%;
                padding: 16px 12px;
                border: none;
                background: none;
                color: #888;
                font: inherit;
                font-size: 13px;
                text-decoration: underline;
                cursor: pointer;
            }
        }
    }

    > .handle {
        appearance: none;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        height: 36px;
        margin: 0 -8px;
        border: none;
        border-top: 1px solid #555;
        background: linear-gradient(to bottom, #4a4a4a, #1a1a1a);
        cursor: pointer;

        > .grip {
            width: 48px;
            height: 6px;
            border-top: 2px solid #999;
            border-bottom: 2px solid #999;
        }

        &:active {
            background: linear-gradient(to bottom, rgba($gingerbread-orange, 0.9), #ff8a00);
        }
    }
}

// the long-press menu's rows, like the other Gingerbread lists
.notification-menu {
    display: flex;
    flex-direction: column;

    > button {
        appearance: none;
        min-height: 52px;
        padding: 8px 16px;
        border: none;
        border-bottom: 1px solid rgba(#000, 0.15);
        background: none;
        color: inherit;
        font: inherit;
        font-size: 17px;
        text-align: left;
        cursor: pointer;

        &:last-child {
            border-bottom: none;
        }

        &:active {
            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        }
    }
}

// the shade slides down from the status bar
.shade-enter-active,
.shade-leave-active {
    transition: transform 0.25s $ease-mat-decel;
}

.shade-enter-from,
.shade-leave-to {
    transform: translateY(-100%);
}
</style>
