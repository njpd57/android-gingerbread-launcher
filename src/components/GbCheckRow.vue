<script setup lang="ts">
defineProps<{
    modelValue: boolean;
    label: string;
    hint?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();
</script>

<template>
    <label class="gb-check-row">
        <span class="text">
            <span class="label">{{ label }}</span>
            <span v-if="hint" class="hint">{{ hint }}</span>
        </span>
        <input
            type="checkbox"
            :checked="modelValue"
            @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)" />
    </label>
</template>

<style scoped lang="scss">
// a Gingerbread list row with a check box on the right (the radio row's sibling)
.gb-check-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 6px 16px;
    border-bottom: 1px solid rgba(#fff, 0.1);
    cursor: pointer;

    &:active {
        background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        color: #111;
    }

    > .text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        > .label {
            font-size: 17px;
        }

        > .hint {
            font-size: 13px;
            opacity: 0.65;
        }
    }

    // Gingerbread check box: a dark, barely rounded box with a gray bezel and a green tick when checked
    > input {
        appearance: none;
        flex-shrink: 0;
        width: 26px;
        height: 26px;
        margin: 0;
        border: 2px solid #8a8a8a;
        border-radius: 3px;
        background: linear-gradient(to bottom, #2a2a2a, #555);

        &:checked {
            border-color: #bdbdbd;
            background:
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M4 12.5l5 5L20 6' fill='none' stroke='%238fd400' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 20px no-repeat,
                linear-gradient(to bottom, #2a2a2a, #555);
        }
    }
}
</style>
