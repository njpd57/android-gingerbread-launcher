<script setup lang="ts">
import { computed } from 'vue';

// Draws Gingerbread's orange overscroll glow on one edge of the (relatively positioned) parent:
// a thin bright edge line plus a soft oval glow that grows with the pull.

const props = defineProps<{
    edge: 'top' | 'bottom' | 'left' | 'right';
    // 0..1
    intensity: number;
    // true while following the finger (no fade), false to fade out
    pulling: boolean;
}>();

// the glow reaches up to this far into the content at full strength
const MAX_DEPTH_PX = 110;

const style = computed(() => ({
    opacity: props.intensity,
    '--depth': `${Math.round(props.intensity * MAX_DEPTH_PX)}px`,
}));

</script>

<template>
    <div
        class="overscroll-glow"
        :class="[edge, { pulling }]"
        :style="style"
        aria-hidden="true"></div>
</template>

<style scoped lang="scss">
$glow-strong: rgba(255, 170, 30, 0.75);
$glow-soft: rgba(255, 140, 0, 0.3);
$edge-line: rgba(255, 205, 90, 0.95);

.overscroll-glow {
    position: absolute;
    z-index: 5;
    pointer-events: none;
    transition: opacity 0.45s $ease-mat-decel;

    &.pulling {
        transition: none;
    }

    &.top,
    &.bottom {
        left: 0;
        right: 0;
        height: max(var(--depth), 2px);
    }

    &.left,
    &.right {
        top: 0;
        bottom: 0;
        width: max(var(--depth), 2px);
    }

    &.top {
        top: 0;
        border-top: 2px solid $edge-line;
        background: radial-gradient(ellipse 70% 100% at 50% 0%, $glow-strong, $glow-soft 45%, transparent 75%);
    }

    &.bottom {
        bottom: 0;
        border-bottom: 2px solid $edge-line;
        background: radial-gradient(ellipse 70% 100% at 50% 100%, $glow-strong, $glow-soft 45%, transparent 75%);
    }

    &.left {
        left: 0;
        border-left: 2px solid $edge-line;
        background: radial-gradient(ellipse 100% 70% at 0% 50%, $glow-strong, $glow-soft 45%, transparent 75%);
    }

    &.right {
        right: 0;
        border-right: 2px solid $edge-line;
        background: radial-gradient(ellipse 100% 70% at 100% 50%, $glow-strong, $glow-soft 45%, transparent 75%);
    }
}
</style>
