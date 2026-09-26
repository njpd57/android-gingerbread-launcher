<script setup lang="ts">
// Gingerbread's seek bar: a dark recessed track, the filled part in 2.3's orange-yellow, and a glossy
// gray thumb. A range input underneath, so dragging and the keyboard work as usual.

const props = withDefaults(defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
}>(), { min: 0, max: 1, step: 0.01 });

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

function fill()
{
    return `${((props.modelValue - props.min) / (props.max - props.min)) * 100}%`;
}
</script>

<template>
    <input
        class="gb-slider"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="modelValue"
        :aria-label="label"
        :style="{ '--fill': fill() }"
        @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
        @pointerdown.stop />
</template>

<style scoped lang="scss">
@mixin thumb
{
    width: 22px;
    height: 22px;
    border: 1px solid #555;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 35%, #fafafa, #b8b8b8 60%, #8a8a8a);
    box-shadow: 0 1px 3px rgba(#000, 0.6);
}

.gb-slider {
    appearance: none;
    width: 100%;
    height: 28px;
    margin: 0;
    background: transparent;
    cursor: pointer;

    &::-webkit-slider-runnable-track {
        height: 6px;
        border: 1px solid #111;
        border-radius: 3px;
        background:
            linear-gradient(to bottom, #ffd24d, #ff9d00) 0 0 / var(--fill) 100% no-repeat,
            linear-gradient(to bottom, #1a1a1a, #333);
        box-shadow: inset 0 1px 2px rgba(#000, 0.7);
    }

    &::-webkit-slider-thumb {
        @include thumb;
        appearance: none;
        margin-top: -9px;
    }

    &:active::-webkit-slider-thumb {
        background: radial-gradient(circle at 50% 35%, #ffe08a, #ffa800 60%, #d07800);
    }

    &::-moz-range-track {
        height: 6px;
        border: 1px solid #111;
        border-radius: 3px;
        background: linear-gradient(to bottom, #1a1a1a, #333);
    }

    &::-moz-range-progress {
        height: 6px;
        border-radius: 3px;
        background: linear-gradient(to bottom, #ffd24d, #ff9d00);
    }

    &::-moz-range-thumb {
        @include thumb;
    }
}
</style>
