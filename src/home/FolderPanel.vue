<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useDragStore } from '@/stores/useDragStore';
import { useHomeLayoutStore, type FolderApp, type FolderItem } from '@/stores/useHomeLayoutStore';
import { useMenuStore } from '@/stores/useMenuStore';
import { useLongPress } from '@/composables/useLongPress';
import { useKeyboardInset } from '@/composables/useKeyboardInset';
import Shortcut from './Shortcut.vue';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import OverscrollGlow from '@/components/OverscrollGlow.vue';

const apps = useAppsStore();
const launcher = useAppLauncherStore();
const drag = useDragStore();
const layout = useHomeLayoutStore();
const menu = useMenuStore();
const settings = useSettingsStore();

const gridEl = ref<HTMLElement>();
// while renaming, the panel recenters above the keyboard
const keyboardInset = useKeyboardInset();
const glow = useOverscrollGlow(gridEl, 'y', () => settings.gingerbreadOverscroll);

const folder = computed(() =>
    layout.items.find((i): i is FolderItem => i.type === 'folder' && i.id === menu.openFolderId) ?? null);

const visibleApps = computed(() =>
    (folder.value?.apps ?? []).filter(a => apps.apps.size === 0 || apps.apps.has(a.packageName)));

// renaming: tap the title to edit it, like Gingerbread's long-press on the folder title
const isRenaming = ref(false);
const nameInput = ref('');
const inputEl = ref<HTMLInputElement>();

async function startRenaming()
{
    if (!folder.value) return;
    nameInput.value = folder.value.name;
    isRenaming.value = true;
    await nextTick();
    inputEl.value?.focus();
    inputEl.value?.select();
}

function commitRename()
{
    if (isRenaming.value && folder.value)
        layout.renameFolder(folder.value.id, nameInput.value);
    isRenaming.value = false;
}

watch(() => menu.openFolderId, () => isRenaming.value = false);

// long-press an app to drag it out of the folder
const longPress = useLongPress<FolderApp>((app, pos) =>
{
    const folderId = menu.openFolderId;
    if (!folderId) return;
    menu.closeAll();
    drag.start({ source: 'folder', folderId, packageName: app.packageName, label: app.label }, pos.x, pos.y);
});

function launch(app: FolderApp)
{
    if (longPress.consumeLongPress()) return;
    menu.closeAll();
    launcher.launch(app.packageName);
}

</script>

<template>
    <Transition name="folder">
        <div
            v-if="folder"
            class="folder-overlay"
            :style="{ 'padding-bottom': `${16 + keyboardInset}px` }"
            @click.self="menu.closeAll()">
            <div class="folder-panel">

                <header class="title">
                    <form v-if="isRenaming" @submit.prevent="commitRename">
                        <input
                            ref="inputEl"
                            v-model="nameInput"
                            type="text"
                            enterkeyhint="done"
                            maxlength="40"
                            @blur="commitRename" />
                    </form>
                    <button v-else class="name" @click="startRenaming">{{ folder.name }}</button>
                </header>

                <div class="grid-wrap">
                    <OverscrollGlow edge="top" :intensity="glow.start.value" :pulling="glow.pulling.value" />
                    <OverscrollGlow edge="bottom" :intensity="glow.end.value" :pulling="glow.pulling.value" />
                    <div class="grid" ref="gridEl">
                        <button
                            v-for="(app, index) in visibleApps"
                            :key="`${app.packageName}-${index}`"
                            class="app"
                            @pointerdown="longPress.down(app, $event)"
                            @pointermove="longPress.move"
                            @pointerup="longPress.cancel"
                            @pointercancel="longPress.cancel"
                            @pointerleave="longPress.cancel"
                            @contextmenu.prevent
                            @click="launch(app)">
                            <Shortcut
                                :package-name="app.packageName"
                                :label="apps.apps.get(app.packageName)?.label ?? app.label" />
                        </button>

                        <div v-if="visibleApps.length === 0" class="empty">
                            Carpeta vacía. Arrastra aplicaciones hasta aquí.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.folder-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background-color: rgba(#000, 0.35);
}

// Gingerbread's open folder: a gray title bar over a dark translucent box of icons
.folder-panel {
    width: min(100%, 360px);
    max-height: 80%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #7a7a7a;
    border-radius: 6px;
    background-color: rgba(#101010, 0.92);
    box-shadow: 0 6px 24px rgba(#000, 0.7);

    > .title {
        padding: 6px 10px;
        border-bottom: 1px solid #111;
        background: linear-gradient(to bottom, #bdbdbd, #7d7d7d);

        > .name {
            appearance: none;
            width: 100%;
            padding: 6px 4px;
            border: none;
            background: none;
            color: #111;
            font: inherit;
            font-size: 17px;
            font-weight: bold;
            text-align: left;
            text-shadow: 0 1px 0 rgba(#fff, 0.5);
            cursor: text;
        }

        input {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid $gingerbread-orange;
            border-radius: 4px;
            background: #fff;
            color: #000;
            font: inherit;
            font-size: 16px;
            outline: none;
        }
    }

    > .grid-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;
    }

    > .grid-wrap > .grid {
        display: grid;
        overscroll-behavior: contain;
        grid-template-columns: repeat(4, 1fr);
        grid-auto-rows: 96px;
        padding: 8px 4px;
        overflow-y: auto;

        > .app {
            appearance: none;
            min-width: 0;
            padding: 4px;
            border: none;
            border-radius: 6px;
            background: none;
            color: inherit;
            font: inherit;
            cursor: pointer;

            &:active :deep(img) {
                filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
            }
        }

        > .empty {
            grid-column: 1 / -1;
            align-self: center;
            padding: 16px;
            text-align: center;
            color: rgba(#fff, 0.7);
        }
    }
}

.folder-enter-active,
.folder-leave-active {
    transition: opacity 0.2s;

    > .folder-panel {
        transition: transform 0.2s $ease-mat-decel;
    }
}

.folder-enter-from,
.folder-leave-to {
    opacity: 0;

    > .folder-panel {
        transform: scale(0.85);
    }
}
</style>
