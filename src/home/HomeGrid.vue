<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useAppsStore } from '@/stores/useAppsStore';
import { useAppLauncherStore } from '@/stores/useAppLauncherStore';
import { useDragStore } from '@/stores/useDragStore';
import { useAppShortcutsStore } from '@/stores/useAppShortcutsStore';
import { useHomeLayoutStore, type GridArea, type HomeItem } from '@/stores/useHomeLayoutStore';
import { useLongPress } from '@/composables/useLongPress';
import Shortcut from './Shortcut.vue';
import FolderIcon from './icons/FolderIcon.vue';
import { useMenuStore } from '@/stores/useMenuStore';
import WidgetView from '@/widgets/WidgetView.vue';

const props = defineProps<{
    page: number;
}>();

const apps = useAppsStore();
const launcher = useAppLauncherStore();
const drag = useDragStore();
const appShortcuts = useAppShortcutsStore();
const layout = useHomeLayoutStore();
const menu = useMenuStore();

const el = ref<HTMLElement>();

onMounted(() => drag.registerGrid(props.page, el.value ?? null));
onBeforeUnmount(() => drag.registerGrid(props.page, null));

const items = computed(() => layout.items.filter(i =>
    i.page === props.page
    && layout.isInGrid(i)
    // hide shortcuts to apps that aren't installed (once the app list has loaded)
    && (i.type !== 'app' || apps.apps.size === 0 || apps.apps.has(i.packageName))
));

const dropOutline = computed(() =>
{
    const a = drag.active;
    const t = drag.target;
    if (!a || !t || t.kind === 'trash' || t.page !== props.page) return null;
    if (t.kind === 'folder')
        return { page: t.page, x: t.x, y: t.y, w: 1, h: 1, state: 'folder' };
    return { page: t.page, x: t.x, y: t.y, w: a.w, h: a.h, state: t.valid ? 'valid' : 'invalid' };
});

function gridArea(area: GridArea)
{
    return {
        'grid-column': `${area.x + 1} / span ${area.w}`,
        'grid-row': `${area.y + 1} / span ${area.h}`,
    };
}

// long-pressing picks the item up; for apps it also opens their shortcuts menu (Bridge fork), which
// closes as soon as the finger moves on to drag
const longPress = useLongPress<{ item: HomeItem; el: HTMLElement }>(({ item, el }, pos) =>
{
    const rect = el.getBoundingClientRect();
    drag.start({ source: 'home', itemId: item.id }, pos.x, pos.y, rect);
    if (item.type === 'app')
        appShortcuts.open(item.packageName, apps.apps.get(item.packageName)?.label ?? item.label, rect);
});

function onItemPointerDown(item: HomeItem, e: PointerEvent)
{
    longPress.down({ item, el: e.currentTarget as HTMLElement }, e);
}

// swallow the click that ends a long press, before it reaches the item (or a widget's own buttons)
function onItemClickCapture(e: MouseEvent)
{
    if (longPress.consumeLongPress() || drag.justDropped())
    {
        e.stopPropagation();
        e.preventDefault();
    }
}

function onItemClick(item: HomeItem)
{
    if (item.type === 'app')
        launcher.launch(item.packageName);
    else if (item.type === 'folder')
        menu.showFolder(item.id);
}

</script>

<template>
    <div
        class="home-grid"
        ref="el"
        :style="{ 'grid-template-rows': `repeat(${layout.rows}, 1fr)` }">
        <div
            v-for="item in items"
            :key="item.id"
            class="home-item"
            :class="[item.type, item.type === 'widget' ? item.widget : null, { dragging: drag.draggedItemId === item.id }]"
            :style="gridArea(item)"
            @pointerdown="onItemPointerDown(item, $event)"
            @pointermove="longPress.move"
            @pointerup="longPress.cancel"
            @pointercancel="longPress.cancel"
            @pointerleave="longPress.cancel"
            @click.capture="onItemClickCapture"
            @click="onItemClick(item)">

            <Shortcut
                v-if="item.type === 'app'"
                :package-name="item.packageName"
                :label="apps.apps.get(item.packageName)?.label ?? item.label" />
            <Shortcut v-else-if="item.type === 'folder'" :label="item.name">
                <FolderIcon :open="menu.openFolderId === item.id" />
            </Shortcut>
            <WidgetView v-else :kind="item.widget" :widget-id="item.id" />
        </div>

        <div
            v-if="dropOutline"
            class="drop-outline"
            :class="dropOutline.state"
            :style="gridArea(dropOutline)"></div>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.home-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    height: 100%;
    padding: 0 4px;

    > .home-item {
        min-width: 0;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;

        &.dragging {
            visibility: hidden;
        }

        // let the clocks use the whole cell area
        &.clock,
        &.clockLarge {
            padding: 0;
        }

        &.app,
        &.folder {
            cursor: pointer;

            &:active :deep(:is(img, svg)) {
                filter: drop-shadow(0 0 4px $gingerbread-orange) drop-shadow(0 0 2px $gingerbread-orange);
            }
        }
    }

    > .drop-outline {
        margin: 2px;
        border: 2px solid rgba(#fff, 0.75);
        border-radius: 8px;
        background-color: rgba(#fff, 0.12);
        pointer-events: none;

        &.invalid {
            border-color: rgba(#ff4040, 0.85);
            background-color: rgba(#ff4040, 0.15);
        }

        // dropping onto a folder: highlight it in Gingerbread orange
        &.folder {
            border-color: $gingerbread-orange;
            background-color: rgba($gingerbread-orange, 0.25);
        }
    }
}
</style>
