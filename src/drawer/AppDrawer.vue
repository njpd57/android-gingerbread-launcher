<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RequestStatus, useAppsStore } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useDrawerStore } from '@/stores/useDrawerStore';
import { useDragStore } from '@/stores/useDragStore';
import { useAppShortcutsStore } from '@/stores/useAppShortcutsStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useLongPress } from '@/composables/useLongPress';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import { useSettingsStore } from '@/stores/useSettingsStore';
import OverscrollGlow from '@/components/OverscrollGlow.vue';
import type { InstalledAppInfo } from '@/stores/useAppsStore';
import HomeIcon from '@/home/icons/HomeIcon.vue';

const apps = useAppsStore();
const launcher = useAppLauncherStore();
const drawer = useDrawerStore();
const drag = useDragStore();
const appShortcuts = useAppShortcutsStore();
const menu = useMenuStore();

const gridEl = ref<HTMLElement>();

const settings = useSettingsStore();
const glow = useOverscrollGlow(gridEl, 'y', () => settings.gingerbreadOverscroll);

const sortedApps = computed(() =>
    Array.from(apps.apps.values())
        .sort((a, b) => a.label.localeCompare(b.label))
);

// like Gingerbread, the drawer always opens scrolled to the top
watch(() => drawer.isOpen, isOpen =>
{
    if (isOpen && gridEl.value)
        gridEl.value.scrollTop = 0;
});

// long-pressing an app picks it up, to drop it on the home screen, and (Bridge fork) opens its shortcuts
// menu; the drawer only closes once the finger moves, so the menu can show over it
const longPress = useLongPress<{ app: InstalledAppInfo; el: HTMLElement }>(({ app, el }, pos) =>
{
    drag.start({ source: 'drawer', packageName: app.packageName, label: app.label }, pos.x, pos.y);
    appShortcuts.open(app.packageName, app.label, el.getBoundingClientRect());
});

watch(() => drag.hasMoved, moved =>
{
    if (moved && drag.active?.payload.source === 'drawer')
        drawer.close();
});

function launch(packageName: string)
{
    if (longPress.consumeLongPress()) return;
    launcher.launch(packageName);
}

</script>

<template>
    <Transition name="zoom">
        <div
            v-show="drawer.isOpen"
            class="app-drawer"
            :style="{
                'padding-top': 'var(--status-bar-height)',
                'padding-bottom': 'var(--nav-bar-height)',
            }">

            <div class="grid-wrap">
                <OverscrollGlow edge="top" :intensity="glow.start.value" :pulling="glow.pulling.value" />
                <OverscrollGlow edge="bottom" :intensity="glow.end.value" :pulling="glow.pulling.value" />
                <div class="grid" ref="gridEl">
                    <button
                        v-for="app in sortedApps"
                        :key="app.packageName"
                        class="app"
                        @pointerdown="longPress.down({ app, el: $event.currentTarget as HTMLElement }, $event)"
                        @pointermove="longPress.move"
                        @pointerup="longPress.cancel"
                        @pointercancel="longPress.cancel"
                        @pointerleave="longPress.cancel"
                        @contextmenu.prevent
                        @click="launch(app.packageName)">
                        <img
                            :src="Bridge.getDefaultAppIconURL(app.packageName)"
                            loading="lazy"
                            draggable="false"
                            alt="" />
                        <span class="label">{{ app.label }}</span>
                    </button>

                    <div v-if="sortedApps.length === 0" class="message">
                        <template v-if="apps.requestStatus === RequestStatus.Error">
                            No se pudieron cargar las aplicaciones.
                            <button class="retry" @click="apps.requestAppsAsync()">Reintentar</button>
                        </template>
                        <template v-else>Cargando…</template>
                    </div>
                </div>
            </div>

            <div class="bottom-bar">
                <button class="home" aria-label="Volver al inicio" @click="drawer.close()">
                    <HomeIcon />
                </button>
                <!-- Gingerbread put "Manage applications" in the drawer's menu -->
                <button class="manage" aria-label="Administrar aplicaciones" @click="menu.showDialog('manageApps')">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <g fill="currentColor">
                            <rect x="4" y="6" width="5" height="5" rx="1" />
                            <rect x="4" y="14" width="5" height="5" rx="1" />
                            <rect x="4" y="22" width="5" height="5" rx="1" />
                            <rect x="12" y="7.5" width="16" height="2" rx="1" />
                            <rect x="12" y="15.5" width="16" height="2" rx="1" />
                            <rect x="12" y="23.5" width="10" height="2" rx="1" />
                        </g>
                    </svg>
                </button>
            </div>

        </div>
    </Transition>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;
$bar-height: 56px;

button {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
}

.app-drawer {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    background-color: #000;

    > .grid-wrap {
        position: relative;
        flex: 1;
        min-height: 0;
        display: flex;
    }

    > .grid-wrap > .grid {
        flex: 1;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: min-content;
        row-gap: 4px;
        padding: 10px 2px;
        overflow-y: auto;
        overscroll-behavior: contain;

        > .app {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            padding: 6px 2px 4px;
            border-radius: 6px;

            > img {
                width: var(--drawer-icon-size, 48px);
                height: var(--drawer-icon-size, 48px);
                filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.6));
            }

            > .label {
                max-width: 100%;
                min-height: 2.3em;
                font-size: 12px;
                line-height: 1.15;
                text-align: center;
                text-shadow: 0 1px 2px #000;
                // up to two lines, then ellipsis
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                word-break: break-word;
            }

            // Gingerbread's orange pressed highlight
            &:active {
                background: linear-gradient(to bottom, rgba($gingerbread-orange, 0.9), rgba(#e07000, 0.9));
            }
        }

        > .message {
            grid-column: 1 / -1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding-top: 48px;
            color: rgba(#fff, 0.7);

            > .retry {
                padding: 8px 16px;
                border: 1px solid rgba(#fff, 0.3);
                border-radius: 4px;
            }
        }
    }

    > .bottom-bar {
        position: relative;
        display: flex;
        justify-content: center;
        height: $bar-height;
        border-top: 1px solid rgba(#fff, 0.18);
        background: linear-gradient(to bottom, #2a2a2a, #0a0a0a);

        > .home {
            display: grid;
            place-items: center;
            width: 72px;

            > svg {
                width: 36px;
                height: 36px;
                transition: filter 0.1s;
            }

            &:active > svg {
                filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
            }
        }

        > .manage {
            position: absolute;
            top: 0;
            right: 8px;
            bottom: 0;
            display: grid;
            place-items: center;
            width: 56px;
            color: #d8d8d8;

            > svg {
                width: 28px;
                height: 28px;
                transition: filter 0.1s;
            }

            &:active > svg {
                filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
            }
        }
    }
}

// Gingerbread's all-apps zoom: grows from slightly smaller while fading in
.zoom-enter-active,
.zoom-leave-active {
    transition: transform 0.25s $ease-mat-decel, opacity 0.25s $ease-mat-decel;
}

.zoom-enter-from,
.zoom-leave-to {
    transform: scale(0.8);
    opacity: 0;
}
</style>
