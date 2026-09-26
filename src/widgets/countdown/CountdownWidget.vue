<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { countdownLabel, daysUntil } from '@/utils/countdown';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// Days left until a date the user picks (a birthday, a trip), with a title (2x1). Tapping it edits both.

interface CountdownData
{
    title: string;
    /** "YYYY-MM-DD", or '' until set. */
    date: string;
}

const props = defineProps<{
    widgetId?: string;
}>();

const data = useWidgetData<CountdownData>(() => props.widgetId,
    { title: '', date: '' },
    { title: 'Vacaciones', date: offsetDate(12) });

function offsetDate(days: number)
{
    const d = new Date(Date.now() + days * 86_400_000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// days only change at midnight, so once a minute is plenty
const now = useNow({ interval: 60_000 });
const label = computed(() => data.value.date ? countdownLabel(daysUntil(data.value.date, now.value), data.value.title) : null);

const isEditing = ref(false);
const draftTitle = ref('');
const draftDate = ref('');
const titleEl = ref<HTMLInputElement>();

async function edit()
{
    if (!props.widgetId) return;
    draftTitle.value = data.value.title;
    draftDate.value = data.value.date || offsetDate(7);
    isEditing.value = true;
    await nextTick();
    titleEl.value?.focus();
}

function save()
{
    if (draftDate.value)
        data.value = { title: draftTitle.value.trim(), date: draftDate.value };
    isEditing.value = false;
}
</script>

<template>
    <button class="countdown-widget" @click="edit">
        <template v-if="label">
            <span class="text">{{ label.text }}</span>
            <span class="number">{{ label.number }}</span>
        </template>
        <template v-else>
            <span class="text">Cuenta regresiva</span>
            <span class="number empty">Toca para elegir una fecha</span>
        </template>

        <WidgetDialog :open="isEditing" title="Cuenta regresiva" @close="isEditing = false">
            <form class="form" @submit.prevent="save">
                <label>
                    <span>Título</span>
                    <input ref="titleEl" v-model="draftTitle" type="text" maxlength="40" placeholder="Vacaciones" enterkeyhint="next" />
                </label>
                <label>
                    <span>Fecha</span>
                    <input v-model="draftDate" type="date" required />
                </label>
            </form>
            <template #buttons>
                <GbButton @click="isEditing = false">Cancelar</GbButton>
                <GbButton @click="save">Aceptar</GbButton>
            </template>
        </WidgetDialog>
    </button>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, the title on a dark bar and the number on a recessed display
.countdown-widget {
    @include gb-widget-frame;
    appearance: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    font: inherit;
    cursor: pointer;

    > .text {
        @include gb-widget-bar;
        max-width: 100%;
        overflow: hidden;
        padding: 3px 6px;
        border: 1px solid #111;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > .number {
        @include gb-widget-inset;
        flex: 1;
        display: grid;
        place-items: center;
        font-family: "Clockopia", "Droid Sans", sans-serif;
        font-size: 32px;
        line-height: 1;
        color: #ffc64d;
        text-shadow: 0 0 6px rgba(#ffa800, 0.35);

        &.empty {
            padding: 0 6px;
            font-family: "Droid Sans", sans-serif;
            font-size: 12px;
            color: #ccc;
            text-shadow: none;
        }
    }

    &:active > .number {
        @include gb-pressed;
    }
}

.form {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 16px;

    > label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;

        > span {
            opacity: 0.75;
        }

        > input {
            padding: 8px 10px;
            border: 1px solid #ffa800;
            border-radius: 4px;
            background: rgba(#fff, 0.95);
            color: #000;
            font: inherit;
            font-size: 16px;
            outline: none;
        }
    }
}
</style>
