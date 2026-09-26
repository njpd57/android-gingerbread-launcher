<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// A short task list (2x2): tap a task to tick it off; "+" adds tasks in a dialog (above the keyboard),
// which also clears the finished ones.

interface Task
{
    id: number;
    text: string;
    done: boolean;
}

const props = defineProps<{
    widgetId?: string;
}>();

const tasks = useWidgetData<Task[]>(() => props.widgetId, [], [
    { id: 1, text: 'Regar las plantas', done: true },
    { id: 2, text: 'Pagar la luz', done: false },
    { id: 3, text: 'Llamar al dentista', done: false },
]);

// pending first, in the order they were added
const shown = computed(() => [...tasks.value].sort((a, b) => Number(a.done) - Number(b.done)));
const doneCount = computed(() => tasks.value.filter(t => t.done).length);

function toggle(task: Task)
{
    tasks.value = tasks.value.map(t => t.id === task.id ? { ...t, done: !t.done } : t);
}

const isAdding = ref(false);
const draft = ref('');
const inputEl = ref<HTMLInputElement>();

async function openAdd()
{
    if (!props.widgetId) return;
    draft.value = '';
    isAdding.value = true;
    await nextTick();
    inputEl.value?.focus();
}

// Enter adds the task and keeps the dialog open for the next one
function add()
{
    const text = draft.value.trim();
    if (!text) return;
    const id = Math.max(0, ...tasks.value.map(t => t.id)) + 1;
    tasks.value = [...tasks.value, { id, text, done: false }];
    draft.value = '';
}

function clearDone()
{
    tasks.value = tasks.value.filter(t => !t.done);
}
</script>

<template>
    <div class="tasks-widget">
        <header>
            <span class="title">Tareas</span>
            <button class="add" aria-label="Añadir tarea" @click="openAdd">+</button>
        </header>

        <ul v-if="shown.length > 0">
            <li v-for="task in shown" :key="task.id">
                <button :class="{ done: task.done }" @click="toggle(task)">
                    <span class="check" aria-hidden="true"></span>
                    <span class="text">{{ task.text }}</span>
                </button>
            </li>
        </ul>
        <button v-else class="empty" @click="openAdd">Toca + para añadir una tarea</button>

        <WidgetDialog :open="isAdding" title="Añadir tareas" @close="isAdding = false">
            <form class="form" @submit.prevent="add">
                <input ref="inputEl" v-model="draft" type="text" maxlength="80" placeholder="Nueva tarea" enterkeyhint="done" />
                <GbButton @click="add">Añadir</GbButton>
            </form>
            <template #buttons>
                <GbButton v-if="doneCount > 0" @click="clearDone">Borrar hechas ({{ doneCount }})</GbButton>
                <GbButton @click="isAdding = false">Listo</GbButton>
            </template>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;

// Songbird's look: a gray frame, a title bar with a glossy "+" and the list recessed below
.tasks-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
    }

    > header {
        @include gb-widget-bar;
        display: flex;
        align-items: stretch;
        overflow: hidden;
        border: 1px solid #111;
        border-radius: 4px;

        > .title {
            flex: 1;
            align-self: center;
            padding: 0 8px;
            font-size: 13px;
            font-weight: bold;
        }

        > .add {
            @include gb-widget-button;
            width: 34px;
            height: 26px;
            border-left: 1px solid #111;
            font-size: 20px;
            line-height: 1;
        }
    }

    > ul {
        @include gb-widget-inset;
        flex: 1;
        margin: 0;
        padding: 2px 0;
        list-style: none;

        > li > button {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 4px 10px;
            text-align: left;
            font-size: 13px;

            > .check {
                flex-shrink: 0;
                width: 14px;
                height: 14px;
                border: 2px solid rgba(#fff, 0.7);
                border-radius: 3px;
            }

            > .text {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            &.done {
                > .check {
                    border-color: $gb-green;
                    background: $gb-green;
                }

                > .text {
                    opacity: 0.5;
                    text-decoration: line-through;
                }
            }

            &:active {
                @include gb-pressed;
            }
        }
    }

    > .empty {
        @include gb-widget-inset;
        flex: 1;
        padding: 8px;
        font-size: 13px;
        color: #ccc;
    }
}

.form {
    display: flex;
    gap: 8px;
    padding: 8px 16px;

    > input {
        flex: 1;
        min-width: 0;
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
</style>
