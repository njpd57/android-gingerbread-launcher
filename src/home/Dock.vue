<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { PAGE_COUNT, useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useDrawerStore } from '@/stores/useDrawerStore';
import { useDragStore } from '@/stores/useDragStore';
import PhoneIcon from './icons/PhoneIcon.vue';
import AllAppsIcon from './icons/AllAppsIcon.vue';
import BrowserIcon from './icons/BrowserIcon.vue';
import TrashIcon from './icons/TrashIcon.vue';
import { bridgeHas } from '@/utils/bridge-utils';
import type { BridgeDefaultAppRole } from '@/types/bridge-fork';

// fallback for Bridge builds that can't tell us the default dialer/browser: the first installed candidate
const PHONE_PACKAGES = [
    'com.google.android.dialer',
    'com.android.dialer',
    'com.samsung.android.dialer',
    'com.android.contacts',
];

const BROWSER_PACKAGES = [
    'com.android.chrome',
    'org.mozilla.firefox',
    'org.mozilla.fenix',
    'com.brave.browser',
    'com.sec.android.app.sbrowser',
    'com.microsoft.emmx',
    'com.opera.browser',
    'com.duckduckgo.mobile.android',
];

const apps = useAppsStore();
const launcher = useAppLauncherStore();
const workspace = useWorkspaceStore();
const drawer = useDrawerStore();
const drag = useDragStore();

// while dragging, the hotseat becomes the delete zone
const hotseatEl = ref<HTMLElement>();
watch(hotseatEl, el => drag.trashEl = el ?? null);
onBeforeUnmount(() => drag.trashEl = null);

const isOverTrash = computed(() => drag.target?.kind === 'trash');

// apps dragged out of the drawer get uninstalled; everything else is just removed from the home screen
const trashLabel = computed(() => drag.active?.payload.source === 'drawer' ? 'Desinstalar' : 'Quitar');

const dotsLeft = computed(() => workspace.currentPage);
const dotsRight = computed(() => PAGE_COUNT - 1 - workspace.currentPage);

// the user's default app when Bridge can tell us, otherwise the first installed candidate
function launchDefaultApp(role: BridgeDefaultAppRole, candidates: string[], notFoundMessage: string)
{
    const defaultPackage = bridgeHas('getDefaultAppPackageName') ? Bridge.getDefaultAppPackageName(role) : null;
    const packageName = defaultPackage ?? candidates.find(p => apps.apps.has(p));
    if (packageName)
        launcher.launch(packageName);
    else
        Bridge.showToast(notFoundMessage);
}

</script>

<template>
    <nav class="dock">
        <button
            class="dots left"
            :disabled="dotsLeft === 0"
            aria-label="Página anterior"
            @click="workspace.goToPage(workspace.currentPage - 1)">
            <span v-for="i in dotsLeft" :key="i" class="dot"></span>
        </button>

        <div
            v-if="drag.active"
            ref="hotseatEl"
            class="hotseat trash"
            :class="{ hover: isOverTrash }">
            <TrashIcon />
            <span class="trash-label">{{ trashLabel }}</span>
        </div>

        <div v-else class="hotseat">
            <button
                class="hotseat-button"
                aria-label="Teléfono"
                @click="launchDefaultApp('dialer', PHONE_PACKAGES, 'No se encontró una app de teléfono')">
                <PhoneIcon />
            </button>
            <button
                class="hotseat-button"
                aria-label="Aplicaciones"
                @click="drawer.open()">
                <AllAppsIcon />
            </button>
            <button
                class="hotseat-button"
                aria-label="Navegador"
                @click="launchDefaultApp('browser', BROWSER_PACKAGES, 'No se encontró un navegador')">
                <BrowserIcon />
            </button>
        </div>

        <button
            class="dots right"
            :disabled="dotsRight === 0"
            aria-label="Página siguiente"
            @click="workspace.goToPage(workspace.currentPage + 1)">
            <span v-for="i in dotsRight" :key="i" class="dot"></span>
        </button>
    </nav>
</template>

<style scoped lang="scss">
$hotseat-height: 56px;
$icon-size: 44px;
$gingerbread-orange: #ffa800;

button {
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    color: inherit;
    cursor: pointer;
}

.dock {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: $hotseat-height;

    > .dots {
        display: flex;
        align-items: center;
        gap: 5px;
        width: 64px;
        height: $hotseat-height;
        padding: 0 14px;

        &.left {
            justify-content: flex-start;
        }

        &.right {
            justify-content: flex-end;
        }

        &:disabled {
            cursor: default;
        }

        > .dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background-color: rgba(#fff, 0.8);
            box-shadow: 0 0 3px rgba(#fff, 0.6);
        }

        &:active:not(:disabled) > .dot {
            background-color: $gingerbread-orange;
            box-shadow: 0 0 5px $gingerbread-orange;
        }
    }

    > .hotseat {
        display: flex;
        align-items: center;
        justify-content: space-around;
        flex: 0 1 220px;
        height: $hotseat-height;
        // Gingerbread's glassy dock: a gloss on the top half over a dark translucent body
        border-radius: 8px 8px 0 0;
        border: 1px solid rgba(#fff, 0.16);
        border-bottom: none;
        background:
            linear-gradient(to bottom, rgba(#fff, 0.16), rgba(#fff, 0.05) 50%, transparent 50%),
            linear-gradient(to bottom, rgba(#4a4a4a, 0.7), rgba(#101010, 0.9));
        box-shadow:
            inset 0 1px 0 rgba(#fff, 0.3),
            0 -2px 10px rgba(#000, 0.45);

        &.trash {
            justify-content: center;
            gap: 6px;
            transition: background 0.1s;

            > svg {
                width: 36px;
                height: 36px;
                color: #e8e8e8;
            }

            > .trash-label {
                color: #e8e8e8;
                font-size: 15px;
                text-shadow: 0 1px 2px #000;
            }

            // Gingerbread's delete zone turns red when an item is over it
            &.hover {
                background: linear-gradient(to bottom, rgba(#c62828, 0.9), rgba(#7f0000, 0.95));
            }
        }

        > .hotseat-button {
            display: grid;
            place-items: center;
            width: $icon-size + 16px;
            height: $hotseat-height;

            > svg {
                width: $icon-size;
                height: $icon-size;
                transition: filter 0.1s;
            }

            &:active > svg {
                filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
            }
        }
    }
}
</style>
