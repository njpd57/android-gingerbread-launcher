<script setup lang="ts">
import type { BridgeRingerMode } from '@/types/bridge-fork';

// a speaker: sound waves when on, shake marks for vibrate, a slash when silenced
defineProps<{
    mode: BridgeRingerMode;
}>();
</script>

<template>
    <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 12h4l7-6v20l-7-6H4z" fill="currentColor" />
        <g v-if="mode === 'normal'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path d="M19 11a7 7 0 0 1 0 10" />
            <path d="M22.5 7.5a12.5 12.5 0 0 1 0 17" />
        </g>
        <g v-else-if="mode === 'vibrate'" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 9l3 3-3 3M28 9l-3 3 3 3" />
        </g>
        <path v-else d="M6 6l20 20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
    </svg>
</template>
