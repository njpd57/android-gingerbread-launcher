<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// A yellow sticky note (2x2). Tapping it edits the text in a dialog, so the keyboard never covers it.

const props = defineProps<{
    widgetId?: string;
}>();

const text = useWidgetData<string>(() => props.widgetId, '', 'Comprar pan\nLlamar a mamá');

const isEditing = ref(false);
const draft = ref('');
const textEl = ref<HTMLTextAreaElement>();

async function edit()
{
    if (!props.widgetId) return;
    draft.value = text.value;
    isEditing.value = true;
    await nextTick();
    textEl.value?.focus();
}

function save()
{
    text.value = draft.value.trimEnd();
    isEditing.value = false;
}
</script>

<template>
    <button class="note-widget" @click="edit">
        <span v-if="text" class="text">{{ text }}</span>
        <span v-else class="empty">Toca para escribir</span>

        <WidgetDialog :open="isEditing" title="Nota" @close="isEditing = false">
            <div class="form">
                <textarea ref="textEl" v-model="draft" rows="6" maxlength="500" placeholder="Escribe aquí…"></textarea>
            </div>
            <template #buttons>
                <GbButton @click="isEditing = false">Cancelar</GbButton>
                <GbButton @click="save">Guardar</GbButton>
            </template>
        </WidgetDialog>
    </button>
</template>

<style scoped lang="scss">
// a paper note: pale yellow, a darker strip at the top like tape, a soft shadow
.note-widget {
    appearance: none;
    position: relative;
    display: flex;
    width: 100%;
    height: 100%;
    padding: 18px 10px 10px;
    border: none;
    border-radius: 2px;
    background: linear-gradient(to bottom, #fff59d, #fbe46a);
    box-shadow: 0 3px 8px rgba(#000, 0.5);
    color: #3b3200;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 10px;
        background: rgba(#c9a800, 0.35);
    }

    > .text {
        overflow: hidden;
        font-size: 14px;
        line-height: 1.35;
        white-space: pre-wrap;
        word-break: break-word;
    }

    > .empty {
        margin: auto;
        font-size: 13px;
        opacity: 0.6;
    }
}

.form {
    padding: 8px 16px;

    > textarea {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ffa800;
        border-radius: 4px;
        background: #fff9c4;
        color: #3b3200;
        font: inherit;
        font-size: 16px;
        resize: none;
        outline: none;
    }
}
</style>
