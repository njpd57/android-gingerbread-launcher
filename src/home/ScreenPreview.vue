<script setup lang="ts">
import { computed } from 'vue';
import { useMenuStore } from '@/stores/useMenuStore';
import { DEFAULT_PAGE, PAGE_COUNT, useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useHomeGridSize } from '@/composables/useHomeGridSize';
import HomeGrid from './HomeGrid.vue';

// Gingerbread's screen previews (idea 46): long-pressing the dock's page dots shows the 5 home
// screens in miniature, drawn with the same HomeGrid, scaled down; tapping one jumps to it.

const COLUMNS = 3;
const GAP = 10;
const SIDE_PADDING = 16;

const menu = useMenuStore();
const workspace = useWorkspaceStore();
const { windowSize, gridWidth, gridHeight } = useHomeGridSize();

const isOpen = computed(() => menu.openDialog === 'screens');
const pages = Array.from({ length: PAGE_COUNT }, (_, p) => p);

const thumbWidth = computed(() =>
    Math.min(120, (windowSize.width.value - 2 * SIDE_PADDING - (COLUMNS - 1) * GAP) / COLUMNS));
const scale = computed(() => thumbWidth.value / gridWidth.value);

const thumbStyle = computed(() => ({
    width: `${thumbWidth.value}px`,
    height: `${gridHeight.value * scale.value}px`,
}));

const gridStyle = computed(() => ({
    width: `${gridWidth.value}px`,
    height: `${gridHeight.value}px`,
    transform: `scale(${scale.value})`,
}));

function goTo(page: number)
{
    menu.closeAll();
    workspace.goToPage(page);
}
</script>

<template>
    <Transition name="previews">
        <div v-if="isOpen" class="screen-previews" @click.self="menu.closeAll()">
            <div class="panel" :style="{ gap: `${GAP}px` }">
                <button
                    v-for="page in pages"
                    :key="page"
                    class="thumb"
                    :class="{ current: page === workspace.currentPage }"
                    :style="thumbStyle"
                    :aria-label="`Pantalla ${page + 1}${page === DEFAULT_PAGE ? ' (principal)' : ''}`"
                    @click="goTo(page)">
                    <div class="grid" :style="gridStyle">
                        <HomeGrid :page="page" preview />
                    </div>
                    <span v-if="page === DEFAULT_PAGE" class="home-mark" aria-hidden="true"></span>
                </button>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.screen-previews {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background-color: rgba(#000, 0.55);

    > .panel {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        max-width: 100%;
        padding: 12px;
        border: 1px solid #7a7a7a;
        border-radius: 6px;
        background-color: rgba(#101010, 0.9);
        box-shadow: 0 6px 24px rgba(#000, 0.7);
    }
}

.thumb {
    appearance: none;
    position: relative;
    padding: 0;
    overflow: hidden;
    border: 2px solid rgba(#fff, 0.35);
    border-radius: 3px;
    background: rgba(#fff, 0.06);
    cursor: pointer;

    &.current {
        border-color: $gingerbread-orange;
    }

    &:active {
        border-color: $gingerbread-orange;
        box-shadow: 0 0 6px $gingerbread-orange;
    }

    > .grid {
        transform-origin: top left;
    }

    // the default (home) screen, like the house on Gingerbread's middle preview
    > .home-mark {
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 8px;
        height: 8px;
        border-radius: 1px;
        background: $gingerbread-orange;
    }
}

.previews-enter-active,
.previews-leave-active {
    transition: opacity 0.2s;
}

.previews-enter-from,
.previews-leave-to {
    opacity: 0;
}
</style>
