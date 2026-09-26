<script setup lang="ts">
import { ref } from 'vue';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useOverscrollGlow } from '@/composables/useOverscrollGlow';
import OverscrollGlow from './OverscrollGlow.vue';
import { useKeyboardInset } from '@/composables/useKeyboardInset';

defineProps<{
    open: boolean;
    title: string;
}>();

const emit = defineEmits<{
    close: [];
}>();

const settings = useSettingsStore();
const bodyEl = ref<HTMLElement>();
const glow = useOverscrollGlow(bodyEl, 'y', () => settings.gingerbreadOverscroll);
// a dialog with a text field recenters above the keyboard
const keyboardInset = useKeyboardInset();

</script>

<template>
    <Transition name="dialog">
        <div
            v-if="open"
            class="gb-dialog-overlay"
            :style="{ 'padding-bottom': `${16 + keyboardInset}px` }"
            @click.self="emit('close')">
            <div class="gb-dialog" role="dialog" :aria-label="title">
                <header class="title">{{ title }}</header>
                <div class="body-wrap">
                    <div class="body" ref="bodyEl">
                        <slot></slot>
                    </div>
                    <OverscrollGlow edge="top" :intensity="glow.start.value" :pulling="glow.pulling.value" />
                    <OverscrollGlow edge="bottom" :intensity="glow.end.value" :pulling="glow.pulling.value" />
                </div>
                <footer v-if="$slots.buttons" class="buttons">
                    <slot name="buttons"></slot>
                </footer>
            </div>
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.gb-dialog-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 16px;
    background-color: rgba(#000, 0.6);
}

// Gingerbread AlertDialog: dark body, title separated by a thin line, gray button bar
.gb-dialog {
    width: min(100%, 340px);
    max-height: 90%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #6a6a6a;
    border-radius: 6px;
    background-color: #2b2b2b;
    box-shadow: 0 6px 24px rgba(#000, 0.7);

    > .title {
        padding: 14px 16px;
        border-bottom: 2px solid #9a9a9a;
        font-size: 19px;
        color: #fff;
    }

    > .body-wrap {
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 0;

        > .body {
            overflow-y: auto;
            overscroll-behavior: contain;
            padding: 8px 0;
        }
    }

    > .buttons {
        display: flex;
        gap: 6px;
        padding: 6px;
        background: linear-gradient(to bottom, #9a9a9a, #7a7a7a);

        > :deep(*) {
            flex: 1;
        }
    }
}

.dialog-enter-active,
.dialog-leave-active {
    transition: opacity 0.15s;

    > .gb-dialog {
        transition: transform 0.15s $ease-mat-decel;
    }
}

.dialog-enter-from,
.dialog-leave-to {
    opacity: 0;

    > .gb-dialog {
        transform: scale(0.9);
    }
}
</style>
