<script setup lang="ts">
import { computed } from 'vue';
import { useDragStore } from '@/stores/useDragStore';
import Shortcut from './Shortcut.vue';
import FolderIcon from './icons/FolderIcon.vue';
import WidgetView from '@/widgets/WidgetView.vue';

const drag = useDragStore();

const ghostStyle = computed(() =>
{
    const a = drag.active;
    if (!a) return {};
    const left = drag.pointer.x - a.offsetX;
    const top = drag.pointer.y - a.offsetY;
    return {
        width: `${a.ghostWidth}px`,
        height: `${a.ghostHeight}px`,
        transform: `translate(${left}px, ${top}px) scale(1.08)`,
    };
});

</script>

<template>
    <div v-if="drag.active" class="drag-layer">
        <div class="ghost" :style="ghostStyle">
            <Shortcut
                v-if="drag.active.ghost.type === 'app'"
                :package-name="drag.active.ghost.packageName"
                :label="drag.active.ghost.label" />
            <Shortcut v-else-if="drag.active.ghost.type === 'folder'" :label="drag.active.ghost.name">
                <FolderIcon />
            </Shortcut>
            <WidgetView v-else :kind="drag.active.ghost.widget" :widget-id="drag.active.ghost.id" />
        </div>
    </div>
</template>

<style scoped lang="scss">
.drag-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;

    > .ghost {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        opacity: 0.85;
        transform-origin: center;
        filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.6));
    }
}
</style>
