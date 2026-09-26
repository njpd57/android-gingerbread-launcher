<template>
    <svg viewBox="0 0 32 32" aria-hidden="true">
        <g fill="currentColor">
            <rect
                v-for="a in 8"
                :key="a"
                x="14" y="3" width="4" height="7" rx="1"
                :transform="`rotate(${a * 45} 16 16)`" />
        </g>
        <circle cx="16" cy="16" r="8.5" fill="currentColor" />
        <circle cx="16" cy="16" r="3.5" fill="#1a1a1a" />
    </svg>
</template>
