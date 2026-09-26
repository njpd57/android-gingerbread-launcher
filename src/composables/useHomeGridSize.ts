import { computed } from "vue";
import { useWindowSize } from "@vueuse/core";
import { useWindowInsetsStore } from "@/stores/useWindowInsetsStore";
import { GRID_COLS, useHomeLayoutStore } from "@/stores/useHomeLayoutStore";

export const DOCK_HEIGHT = 56;
// HomeGrid's side padding, both sides together
export const GRID_SIDE_PADDING = 8;

/** The home screen grid's area and the size of one cell, in CSS px, derived from the window. */
export function useHomeGridSize()
{
    const windowSize = useWindowSize();
    const insets = useWindowInsetsStore();
    const layout = useHomeLayoutStore();

    const gridWidth = computed(() => windowSize.width.value - GRID_SIDE_PADDING);
    const gridHeight = computed(() =>
        windowSize.height.value - insets.statusBarHeight - DOCK_HEIGHT - insets.navigationBarHeight);

    return {
        windowSize,
        gridWidth,
        gridHeight,
        cellWidth: computed(() => gridWidth.value / GRID_COLS),
        cellHeight: computed(() => gridHeight.value / layout.rows),
    };
}
