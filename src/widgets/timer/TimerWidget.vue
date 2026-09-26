<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { formatDuration } from '@/utils/stopwatch';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// Stopwatch and countdown timer (2x1). The state keeps timestamps rather than a running counter, so it
// stays right while the launcher is paused in the background. The timer beeps only while the launcher
// is visible: a WebView can't notify from the background, so on return it just shows "¡Tiempo!".

type Mode = 'stopwatch' | 'timer';

interface TimerData
{
    mode: Mode;
    running: boolean;
    /** When the current run started (ms since the epoch). */
    startedAt: number;
    /** Time counted before the current run. */
    accumulated: number;
    /** The timer's length. */
    timerMs: number;
    finished: boolean;
}

const props = defineProps<{
    widgetId?: string;
}>();

const data = useWidgetData<TimerData>(() => props.widgetId,
    { mode: 'stopwatch', running: false, startedAt: 0, accumulated: 0, timerMs: 5 * 60_000, finished: false },
    { mode: 'stopwatch', running: false, startedAt: 0, accumulated: 83_400, timerMs: 5 * 60_000, finished: false });

const now = ref(Date.now());
let ticker = 0;
watch(() => data.value.running, running =>
{
    clearInterval(ticker);
    if (running)
        ticker = window.setInterval(() => now.value = Date.now(), 100);
}, { immediate: true });
onBeforeUnmount(() => clearInterval(ticker));

const elapsed = computed(() =>
    data.value.accumulated + (data.value.running ? Math.max(0, now.value - data.value.startedAt) : 0));
const remaining = computed(() => Math.max(0, data.value.timerMs - elapsed.value));
const display = computed(() => data.value.mode === 'stopwatch'
    ? formatDuration(elapsed.value)
    : formatDuration(remaining.value, false));

function update(patch: Partial<TimerData>)
{
    data.value = { ...data.value, ...patch };
}

function setMode(mode: Mode)
{
    if (mode !== data.value.mode)
        update({ mode, running: false, accumulated: 0, finished: false });
}

function startPause()
{
    if (data.value.running)
        update({ running: false, accumulated: elapsed.value });
    else if (data.value.mode === 'timer' && remaining.value === 0)
        update({ running: true, startedAt: Date.now(), accumulated: 0, finished: false });
    else
    {
        now.value = Date.now();
        update({ running: true, startedAt: now.value, finished: false });
    }
}

function reset()
{
    update({ running: false, accumulated: 0, finished: false });
}

// the timer ran out: stop, and beep if it happened just now (not while the launcher was in the background)
watch(remaining, left =>
{
    if (data.value.mode !== 'timer' || !data.value.running || left > 0) return;
    const overshoot = now.value - (data.value.startedAt + data.value.timerMs - data.value.accumulated);
    update({ running: false, accumulated: data.value.timerMs, finished: true });
    if (overshoot < 2000)
        alarm();
});

function alarm()
{
    try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch { /* not allowed */ }
    try
    {
        const audio = new AudioContext();
        for (let i = 0; i < 3; i++)
        {
            const osc = audio.createOscillator();
            const gain = audio.createGain();
            osc.frequency.value = 880;
            gain.gain.value = 0.2;
            osc.connect(gain).connect(audio.destination);
            osc.start(audio.currentTime + i * 0.45);
            osc.stop(audio.currentTime + i * 0.45 + 0.25);
        }
        setTimeout(() => audio.close(), 2000);
    }
    catch { /* no audio */ }
}

// setting the timer's length
const isSetting = ref(false);
const draftMin = ref(5);
const draftSec = ref(0);

function openSetting()
{
    if (!props.widgetId || data.value.mode !== 'timer' || data.value.running) return;
    draftMin.value = Math.floor(data.value.timerMs / 60_000);
    draftSec.value = Math.floor(data.value.timerMs / 1000) % 60;
    isSetting.value = true;
}

function saveSetting()
{
    const ms = (Math.max(0, draftMin.value || 0) * 60 + Math.max(0, Math.min(59, draftSec.value || 0))) * 1000;
    if (ms > 0)
        update({ timerMs: ms, accumulated: 0, finished: false });
    isSetting.value = false;
}
</script>

<template>
    <div class="timer-widget" :class="{ finished: data.finished }">
        <div class="modes">
            <button :class="{ selected: data.mode === 'stopwatch' }" @click="setMode('stopwatch')">Cronómetro</button>
            <button :class="{ selected: data.mode === 'timer' }" @click="setMode('timer')">Temporizador</button>
        </div>

        <button class="display" :aria-label="data.mode === 'timer' ? 'Cambiar duración' : undefined" @click="openSetting">
            {{ data.finished ? '¡Tiempo!' : display }}
        </button>

        <div class="controls">
            <button :aria-label="data.running ? 'Pausar' : 'Iniciar'" @click="startPause">
                <svg v-if="data.running" viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="5" width="4" height="14" fill="currentColor" />
                    <rect x="14" y="5" width="4" height="14" fill="currentColor" />
                </svg>
                <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M7 5l12 7-12 7z" fill="currentColor" />
                </svg>
            </button>
            <button aria-label="Reiniciar" @click="reset">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18 12a6 6 0 1 1-2-4.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
                    <path d="M17.5 3v5h-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        </div>

        <WidgetDialog :open="isSetting" title="Temporizador" @close="isSetting = false">
            <form class="form" @submit.prevent="saveSetting">
                <label><input v-model.number="draftMin" type="number" min="0" max="999" inputmode="numeric" /> min</label>
                <label><input v-model.number="draftSec" type="number" min="0" max="59" inputmode="numeric" /> s</label>
            </form>
            <template #buttons>
                <GbButton @click="isSetting = false">Cancelar</GbButton>
                <GbButton @click="saveSetting">Aceptar</GbButton>
            </template>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, glossy tabs on top, a recessed display and big glossy buttons below
.timer-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
    }

    // two tabs; the selected one is lit, the other dim
    > .modes {
        display: flex;
        overflow: hidden;
        border: 1px solid #111;
        border-radius: 4px;

        > button {
            @include gb-widget-button;
            flex: 1;
            padding: 2px 0;
            font-size: 11px;
            color: #aaa;

            & + button {
                border-left: 1px solid #111;
            }

            &.selected {
                background: linear-gradient(to bottom, #2c2c2c, #4a4a4a);
                box-shadow: inset 0 1px 3px rgba(#000, 0.6);
                color: #ffc64d;
            }
        }
    }

    > .display {
        @include gb-widget-inset;
        flex: 1;
        min-height: 0;
        font-family: "Clockopia", "Droid Sans", sans-serif;
        font-size: 28px;
        letter-spacing: 1px;
        color: #f2f2f2;
        text-shadow: 0 0 6px rgba(#fff, 0.25);
    }

    &.finished > .display {
        color: #ffc64d;
        font-family: "Droid Sans", sans-serif;
        font-size: 20px;
        font-weight: bold;
        animation: blink 1s steps(2) infinite;
    }

    > .controls {
        display: flex;
        height: 30px;
        overflow: hidden;
        border: 1px solid #111;
        border-radius: 4px;

        > button {
            @include gb-widget-button;
            flex: 1;
            display: grid;
            place-items: center;

            & + button {
                border-left: 1px solid #111;
            }

            > svg {
                height: 18px;
                filter: drop-shadow(0 1px 1px #000);
            }
        }
    }
}

@keyframes blink {
    50% { opacity: 0.35; }
}

.form {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 12px 16px;

    > label {
        display: flex;
        align-items: center;
        gap: 6px;

        > input {
            width: 72px;
            padding: 8px 10px;
            border: 1px solid #ffa800;
            border-radius: 4px;
            background: rgba(#fff, 0.95);
            color: #000;
            font: inherit;
            font-size: 18px;
            text-align: center;
            outline: none;
        }
    }
}
</style>
