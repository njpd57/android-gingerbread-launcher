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
import { appKey, toAppRef } from '@/utils/appKey';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import OverscrollGlow from '@/components/OverscrollGlow.vue';
import GbDialog from '@/components/GbDialog.vue';
import ContactGlyph from '@/widgets/search/ContactGlyph.vue';
import { useContactsStore } from '@/stores/useContactsStore';
import type { BridgeContact } from '@/types/bridge-fork';
import { bridgeRequest } from '@/utils/toast';

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
    (folder.value?.apps ?? []).filter(a => apps.apps.size === 0 || apps.has(a)));

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
    drag.start({ source: 'folder', folderId, ...toAppRef(app), label: app.label }, pos.x, pos.y);
});

function launch(app: FolderApp)
{
    if (longPress.consumeLongPress()) return;
    menu.closeAll();
    launcher.launch(app);
}

// contact folders (idea 43) list contacts (Bridge fork, READ_CONTACTS) instead of apps; tapping one opens
// the same Quick Contact style menu as the favorite contacts widget
const contacts = useContactsStore();
const folderContacts = ref<BridgeContact[]>([]);

watch([() => folder.value?.source, () => contacts.canRead, () => contacts.version], async ([source]) =>
{
    folderContacts.value = source && contacts.canRead
        ? await contacts.fetchContacts('', source === 'starredContacts')
        : [];
}, { immediate: true });

const contactsMessage = computed(() =>
{
    const source = folder.value?.source;
    if (!source) return null;
    if (!contacts.isSupported) return 'Tu versión de Bridge no puede leer los contactos.';
    if (!contacts.canRead) return 'Toca para permitir el acceso a los contactos.';
    if (folderContacts.value.length > 0) return null;
    return source === 'starredContacts'
        ? 'Marca tus contactos favoritos con una estrella.'
        : 'No hay contactos con número de teléfono.';
});

function onContactsMessageClick()
{
    if (contacts.isSupported && !contacts.canRead) contacts.requestAccess();
}

const contactMenu = ref<BridgeContact | null>(null);

function primaryNumber(c: BridgeContact)
{
    return c.phoneNumbers.find(p => p.isPrimary) ?? c.phoneNumbers[0];
}

function callNumber(number: string)
{
    contactMenu.value = null;
    menu.closeAll();
    contacts.call(number);
}

function messageContact(c: BridgeContact)
{
    contactMenu.value = null;
    menu.closeAll();
    bridgeRequest(t => Bridge.requestOpenUrl(`smsto:${primaryNumber(c).number}`, t));
}

function viewContact(c: BridgeContact)
{
    contactMenu.value = null;
    menu.closeAll();
    contacts.openContact(c);
}

watch(() => menu.openFolderId, () => contactMenu.value = null);

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
                    <div v-if="folder.source" class="grid" ref="gridEl">
                        <button
                            v-if="contactsMessage"
                            class="empty"
                            @click="onContactsMessageClick">
                            {{ contactsMessage }}
                        </button>
                        <button
                            v-for="c in folderContacts"
                            v-else
                            :key="c.lookupKey"
                            class="contact"
                            @click="contactMenu = c">
                            <img v-if="c.hasPhoto" class="photo" :src="contacts.photoUrl(c)" loading="lazy" alt="" draggable="false" />
                            <span v-else class="photo glyph"><ContactGlyph /></span>
                            <span class="name">{{ c.name }}</span>
                        </button>
                    </div>

                    <div v-else class="grid" ref="gridEl">
                        <button
                            v-for="(app, index) in visibleApps"
                            :key="`${appKey(app)}-${index}`"
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
                                :user-serial="app.userSerial"
                                :label="apps.get(app)?.label ?? app.label" />
                        </button>

                        <div v-if="visibleApps.length === 0" class="empty">
                            Carpeta vacía. Arrastra aplicaciones hasta aquí.
                        </div>
                    </div>
                </div>

            </div>

            <!-- Quick Contact style menu for contact folders -->
            <GbDialog :open="!!contactMenu" :title="contactMenu?.name ?? ''" @close="contactMenu = null">
                <div v-if="contactMenu" class="quick-menu">
                    <button v-for="p in contactMenu.phoneNumbers" :key="p.number" @click="callNumber(p.number)">
                        Llamar{{ p.label ? ` · ${p.label}` : '' }}: {{ p.number }}
                    </button>
                    <button @click="messageContact(contactMenu)">Enviar mensaje</button>
                    <button @click="viewContact(contactMenu)">Ver contacto</button>
                </div>
            </GbDialog>
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

        // a button when it asks for contacts access
        > button.empty {
            appearance: none;
            border: none;
            background: none;
            font: inherit;
            cursor: pointer;
        }

        > .contact {
            appearance: none;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 4px;
            border: none;
            border-radius: 4px;
            background: none;
            color: inherit;
            font: inherit;
            cursor: pointer;

            &:active {
                @include gb-pressed;
            }

            > .photo {
                @include gb-contact-photo;
                flex-shrink: 0;
                width: 48px;
                height: 48px;
            }

            > .glyph {
                display: grid;
                place-items: end center;
                overflow: hidden;

                > :deep(svg) {
                    width: 40px;
                    height: 40px;
                }
            }

            > .name {
                max-width: 100%;
                font-size: 12px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}

// the contact menu, teleported or not, uses Gingerbread's list rows
.quick-menu {
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
