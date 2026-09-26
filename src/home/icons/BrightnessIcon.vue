<script setup lang="ts">
import type { BrightnessStep } from '@/utils/brightness';

// the sun shows the level: outline (low), half filled (mid), filled (high), an "A" for automatic
defineProps<{
    step: BrightnessStep;
}>();
</script>

<template>
    <svg viewBox="0 0 32 32" aria-hidden="true">
        <g stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <path
                v-for="a in 8"
                :key="a"
                d="M16 2.5v4"
                :transform="`rotate(${a * 45} 16 16)`" />
        </g>
        <circle
            cx="16" cy="16" r="6.25"
            :fill="step === 'auto' || step === 'high' ? 'currentColor' : 'none'"
            stroke="currentColor" stroke-width="1.5" />
        <path v-if="step === 'mid'" d="M16 9.75a6.25 6.25 0 0 1 0 12.5z" fill="currentColor" />
        <text
            v-if="step === 'auto'"
            x="16" y="20"
            text-anchor="middle"
            font-family="Droid Sans, sans-serif"
            font-weight="bold"
            font-size="11"
            fill="#1a1a1a">A</text>
    </svg>
</template>
