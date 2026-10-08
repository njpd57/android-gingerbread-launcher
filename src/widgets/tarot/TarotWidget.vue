<script setup lang="ts">
import { computed } from 'vue';
import { useNow } from '@vueuse/core';
import { tarotCardImage, tarotCardOfTheDay } from './tarotCards';
import DailyCardWidget from './DailyCardWidget.vue';

// Tarot card of the day (4x2): one of the Rider-Waite-Smith major arcana, upright or reversed.

defineProps<{
    widgetId?: string;
}>();

const now = useNow({ interval: 60_000 });
const draw = computed(() => tarotCardOfTheDay(now.value));
const heading = computed(() =>
    `${draw.value.card.roman} · ${draw.value.card.name}${draw.value.reversed ? ' (invertida)' : ''}`);
const message = computed(() => draw.value.reversed ? draw.value.card.reversed : draw.value.card.upright);
</script>

<template>
    <DailyCardWidget :widget-id="widgetId" title="Tarot · carta del día" :reading-title="heading">
        <template #back>
            <div class="tarot-back"></div>
        </template>

        <template #face>
            <img
                class="tarot-face"
                :class="{ reversed: draw.reversed }"
                :src="tarotCardImage(draw.card)"
                alt=""
                draggable="false" />
        </template>

        <template #info>
            <div class="name">{{ heading }}</div>
            <div class="keywords">{{ draw.card.keywords }}</div>
            <p class="message">{{ message }}</p>
        </template>

        <template #reading>
            <img
                class="reading-card"
                :class="{ reversed: draw.reversed }"
                :src="tarotCardImage(draw.card)"
                alt=""
                draggable="false" />
            <p class="reading-keywords">{{ draw.card.keywords }}</p>
            <p><strong>{{ draw.reversed ? 'Invertida' : 'Al derecho' }}:</strong> {{ message }}</p>
            <p class="reading-other">
                <strong>{{ draw.reversed ? 'Al derecho' : 'Invertida' }}:</strong>
                {{ draw.reversed ? draw.card.upright : draw.card.reversed }}
            </p>
        </template>
    </DailyCardWidget>
</template>

<style scoped lang="scss">
// the back of the deck: dark blue with a gold diamond lattice and border
.tarot-back {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: 3px solid #c9a24a;
    border-radius: 5px;
    background:
        repeating-linear-gradient(45deg, transparent 0 7px, rgba(#c9a24a, 0.45) 7px 8px),
        repeating-linear-gradient(-45deg, transparent 0 7px, rgba(#c9a24a, 0.45) 7px 8px),
        radial-gradient(circle at 50% 50%, #2b3f7a, #101a38);
}

.tarot-face {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.reversed {
    transform: rotate(180deg);
}

.name {
    font-size: 16px;
    font-weight: bold;
}

.keywords {
    font-size: 12px;
    color: rgba(#fff, 0.6);
    font-style: italic;
}

.message {
    margin: 2px 0 0;
    font-size: 14px;
    line-height: 1.3;
    // what fits in the widget; the full reading is a tap away
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.reading-card {
    display: block;
    width: 120px;
    margin: 0 auto 12px;
    border-radius: 5px;
    box-shadow: 0 2px 6px rgba(#000, 0.5);
}

.reading-keywords {
    font-style: italic;
    opacity: 0.7;
    text-align: center;
}

.reading-other {
    opacity: 0.6;
}
</style>
