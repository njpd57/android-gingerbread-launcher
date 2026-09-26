<script setup lang="ts">
// An icon with its label, as shown on the home screen and in folders.
// Pass `packageName` for an app icon, or put a custom icon in the default slot.
defineProps<{
    label: string;
    packageName?: string;
}>();
</script>

<template>
    <div class="shortcut">
        <img v-if="packageName" :src="Bridge.getDefaultAppIconURL(packageName)" alt="" draggable="false" />
        <slot v-else></slot>
        <span class="label">{{ label }}</span>
    </div>
</template>

<style scoped lang="scss">
.shortcut {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    width: 100%;
    height: 100%;

    > img,
    > :deep(svg) {
        // set on .launcher-root from the "Tamaño de los iconos" setting
        width: var(--icon-size, 48px);
        height: var(--icon-size, 48px);
        flex-shrink: 0;
        // Gingerbread icons carried a soft shadow underneath
        filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.6));
        transition: filter 0.1s;
    }

    // Gingerbread draws home screen labels on a dark translucent bubble
    > .label {
        max-width: 100%;
        padding: 1px 6px;
        border-radius: 6px;
        background-color: rgba(#000, 0.45);
        font-size: 12px;
        line-height: 1.3;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}
</style>
