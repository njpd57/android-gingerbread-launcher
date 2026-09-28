<script setup lang="ts">
defineProps<{
    open?: boolean;
    // a contact folder: a contact silhouette on the paper, like Gingerbread's live folders
    contacts?: boolean;
}>();
</script>

<template>
    <svg viewBox="0 0 48 48" aria-hidden="true">
        <defs>
            <linearGradient id="folder-back" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#7d7d7d" />
                <stop offset="1" stop-color="#3d3d3d" />
            </linearGradient>
            <linearGradient id="folder-front" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#e2e2e2" />
                <stop offset="1" stop-color="#9a9a9a" />
            </linearGradient>
        </defs>

        <!-- back panel with tab -->
        <path fill="url(#folder-back)" stroke="#2a2a2a" stroke-width="1"
            d="M5 12a2 2 0 0 1 2-2h11l4 4h19a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />

        <!-- paper peeking out -->
        <rect x="9" y="16" width="30" height="16" rx="1" fill="#f7f7f7" />

        <!-- contact folders: a contact's head and shoulders peeking over the front panel -->
        <g v-if="contacts" fill="#5b7fa8">
            <circle cx="24" cy="17.5" r="3.6" />
            <path d="M16.5 26c0-4 3.4-5.6 7.5-5.6s7.5 1.6 7.5 5.6z" />
        </g>

        <!-- front panel: flat when closed, tilted open when the folder is open -->
        <path
            fill="url(#folder-front)" stroke="#555" stroke-width="1"
            :d="open
                ? 'M3 26h42l-5 16H8z'
                : 'M5 20h38a2 2 0 0 1 2 2l-1 18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L3 22a2 2 0 0 1 2-2z'" />
        <path
            v-if="!open"
            d="M7 22h34"
            stroke="#fff" stroke-opacity="0.6" stroke-width="1" />
    </svg>
</template>
