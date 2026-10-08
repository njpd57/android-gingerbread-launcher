<script setup lang="ts">
import { computed, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { dayNumber } from '@/utils/daily';
import WidgetDialog from '@/components/WidgetDialog.vue';

// The shell of the "card of the day" widgets (4x2): the card face down until tapped, when it turns over
// (remembered per widget until midnight), and beside it what the card says; tapping again opens the
// full reading. The face, back, text and reading come in slots.

const props = defineProps<{
    widgetId?: string;
    title: string;
    /** The reading dialog's title. */
    readingTitle: string;
}>();

const now = useNow({ interval: 60_000 });
const today = computed(() => dayNumber(now.value));

// the day this widget's card was last turned over; the "Añadir" preview shows it face up
const state = useWidgetData(() => props.widgetId, { revealedDay: -1 });
const revealed = computed(() => !props.widgetId || state.value.revealedDay === today.value);

const readingOpen = ref(false);

function onTap()
{
    if (!props.widgetId) return;
    if (revealed.value)
        readingOpen.value = true;
    else
        state.value = { revealedDay: today.value };
}
</script>

<template>
    <div class="daily-card-widget" @click="onTap">
        <div class="card" :class="{ revealed }">
            <div class="side back"><slot name="back"></slot></div>
            <div class="side face"><slot name="face"></slot></div>
        </div>

        <div class="info">
            <div class="title">{{ title }}</div>
            <slot v-if="revealed" name="info"></slot>
            <p v-else class="hint">Toca para descubrir la carta de hoy.</p>
        </div>

        <WidgetDialog :open="readingOpen" :title="readingTitle" @close="readingOpen = false">
            <div class="reading"><slot name="reading"></slot></div>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
.daily-card-widget {
    @include gb-widget-frame;
    display: flex;
    gap: 10px;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 8px;
    cursor: pointer;

    > .card {
        position: relative;
        flex-shrink: 0;
        height: 100%;
        aspect-ratio: 200 / 340;
        transform-style: preserve-3d;
        transition: transform 0.6s $ease-mat-accel-decel;
        perspective: 800px;

        &.revealed {
            transform: rotateY(180deg);
        }

        > .side {
            position: absolute;
            inset: 0;
            overflow: hidden;
            border-radius: 5px;
            box-shadow: 0 2px 6px rgba(#000, 0.7);
            backface-visibility: hidden;
        }

        > .face {
            transform: rotateY(180deg);
        }
    }

    > .info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        text-shadow: 0 1px 2px #000;

        > .title {
            font-size: 12px;
            color: #ffa800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        > .hint {
            margin: auto 0;
            font-size: 15px;
            color: rgba(#fff, 0.75);
        }
    }

    &:active > .info > .title {
        color: #ffc64d;
    }
}

.reading {
    padding: 12px 16px 4px;
}
</style>
