<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { useAppShortcutsStore } from '@/stores/useAppShortcutsStore';
import { placeMenu } from './menu-position';

// The menu next to a long-pressed app: its shortcuts, then "Información de la app". Drawn like
// Gingerbread's context menus (a gray title band over light rows, orange when pressed).

const shortcuts = useAppShortcutsStore();
const viewport = useWindowSize();

const MENU_WIDTH = 250;
const TITLE_HEIGHT = 36;
const ROW_HEIGHT = 48;

const menuEl = ref<HTMLElement>();
const failedIcons = ref(new Set<string>());

const menu = computed(() => shortcuts.menu);

const placement = computed(() =>
{
    const m = menu.value;
    if (!m) return null;
    // shortcuts load after the menu opens; measure when rendered, estimate before
    const rows = m.shortcuts.length + 1;
    const height = menuEl.value?.offsetHeight || TITLE_HEIGHT + rows * ROW_HEIGHT;
    return placeMenu(m.anchor, MENU_WIDTH, height, viewport.width.value, viewport.height.value);
});

watch(() => menu.value?.packageName, () => failedIcons.value = new Set());
</script>

<template>
    <template v-if="menu && placement">
        <!-- a new press anywhere else closes the menu (the press that opened it is already down) -->
        <div class="backdrop" @pointerdown="shortcuts.close()" @contextmenu.prevent></div>

        <div
            ref="menuEl"
            class="app-shortcuts-menu"
            :style="{ left: `${placement.left}px`, top: `${placement.top}px`, width: `${MENU_WIDTH}px` }"
            @contextmenu.prevent>
            <div class="title">{{ menu.label }}</div>

            <button
                v-for="s in menu.shortcuts"
                :key="s.id"
                class="row"
                @click="shortcuts.start(s)">
                <img
                    v-if="!failedIcons.has(s.id)"
                    :src="Bridge.getAppShortcutIconURL(menu.packageName, s.id)"
                    alt=""
                    draggable="false"
                    @error="failedIcons.add(s.id)" />
                <span v-else class="icon-placeholder"></span>
                <span class="label">{{ s.shortLabel }}</span>
            </button>

            <button class="row info" @click="shortcuts.openAppInfo()">
                <span class="info-icon">i</span>
                <span class="label">Información de la app</span>
            </button>
        </div>
    </template>
</template>

<style scoped lang="scss">
.backdrop {
    position: absolute;
    inset: 0;
}

.app-shortcuts-menu {
    position: absolute;
    overflow: hidden;
    border: 1px solid #5a5a5a;
    border-radius: 6px;
    background-color: #fafafa;
    box-shadow: 0 4px 14px rgba(#000, 0.6);
    animation: pop-in 0.12s $ease-mat-decel;

    // Gingerbread's gray title band
    > .title {
        overflow: hidden;
        padding: 8px 12px;
        background: linear-gradient(to bottom, #5a5a5a, #454545);
        color: #e8e8e8;
        font-size: 14px;
        font-weight: bold;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > .row {
        appearance: none;
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        min-height: 48px;
        padding: 6px 12px;
        border: none;
        border-bottom: 1px solid #ddd;
        background: none;
        color: #222;
        font: inherit;
        font-size: 16px;
        text-align: left;
        cursor: pointer;

        &:last-child {
            border-bottom: none;
        }

        > img,
        > .icon-placeholder,
        > .info-icon {
            flex-shrink: 0;
            width: 30px;
            height: 30px;
        }

        > .icon-placeholder {
            border-radius: 50%;
            background-color: #ccc;
        }

        > .info-icon {
            display: grid;
            place-items: center;
            border-radius: 50%;
            background: linear-gradient(to bottom, #6fa0e8, #2f67c5);
            color: #fff;
            font-family: Georgia, serif;
            font-size: 18px;
            font-style: italic;
            font-weight: bold;
        }

        > .label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &:active {
            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        }
    }
}

@keyframes pop-in {
    from {
        opacity: 0;
        transform: scale(0.92);
    }
}
</style>
