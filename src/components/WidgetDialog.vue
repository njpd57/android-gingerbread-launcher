<script setup lang="ts">
import GbDialog from './GbDialog.vue';

// A GbDialog for a widget's settings: moved out of the widget (which may sit low on the home screen, or
// be clipped by its cell) into .launcher-root, where it recenters above the keyboard. It's mounted only
// while open, since .launcher-root doesn't exist yet when the widgets first mount.

defineProps<{
    open: boolean;
    title: string;
}>();

const emit = defineEmits<{
    close: [];
}>();
</script>

<template>
    <Teleport v-if="open" to=".launcher-root">
        <GbDialog open :title="title" @close="emit('close')">
            <slot></slot>
            <template v-if="$slots.buttons" #buttons>
                <slot name="buttons"></slot>
            </template>
        </GbDialog>
    </Teleport>
</template>
