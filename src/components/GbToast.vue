<script setup lang="ts">
import { useToastStore } from '@/stores/useToastStore';

// Gingerbread's toast: a dark translucent box with a thin light border, low on the screen
const toast = useToastStore();
</script>

<template>
    <Transition name="toast">
        <div
            v-if="toast.message"
            :key="toast.id"
            class="gb-toast"
            role="status">
            {{ toast.message }}
        </div>
    </Transition>
</template>

<style scoped lang="scss">
.gb-toast {
    position: absolute;
    left: 50%;
    bottom: calc(var(--nav-bar-height, 0px) + 96px);
    transform: translateX(-50%);
    max-width: calc(100% - 48px);
    padding: 8px 14px;
    border: 1px solid rgba(#fff, 0.35);
    border-radius: 4px;
    background: rgba(#1a1a1a, 0.88);
    box-shadow: 0 2px 6px rgba(#000, 0.6);
    color: #fff;
    font-size: 15px;
    line-height: 1.3;
    text-align: center;
    pointer-events: none;
    z-index: 1000;
}

.toast-enter-active,
.toast-leave-active {
    transition: opacity 0.2s;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
}
</style>
