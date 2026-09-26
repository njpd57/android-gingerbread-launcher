<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { describeWeatherCode } from './weather-codes';
import WeatherIcon from './WeatherIcon.vue';
import GbDialog from '@/components/GbDialog.vue';
import GbButton from '@/components/GbButton.vue';

const weather = useWeatherStore();

const description = computed(() => weather.data ? describeWeatherCode(weather.data.code) : null);

const isEditing = ref(false);
const cityInput = ref('');
const inputEl = ref<HTMLInputElement>();

async function startEditing()
{
    cityInput.value = weather.city?.name ?? '';
    isEditing.value = true;
    await nextTick();
    inputEl.value?.focus();
    inputEl.value?.select();
}

function submit()
{
    isEditing.value = false;
    if (cityInput.value.trim())
        weather.setCityAsync(cityInput.value);
}

function onContentClick()
{
    if (weather.city)
        weather.refreshAsync();
}

</script>

<template>
    <div class="weather-widget">

        <!-- a dialog rather than a field in the widget: the widget can sit low on the screen, where
             the keyboard would cover it, while the dialog recenters above the keyboard. Mounted only
             while editing, since .launcher-root doesn't exist yet when the widgets first mount. -->
        <Teleport v-if="isEditing" to=".launcher-root">
            <GbDialog open title="Ciudad del tiempo" @close="isEditing = false">
                <form class="city-form" @submit.prevent="submit">
                    <input
                        ref="inputEl"
                        v-model="cityInput"
                        type="text"
                        enterkeyhint="search"
                        placeholder="Escribe tu ciudad"
                        aria-label="Ciudad"
                        @keydown.esc="isEditing = false" />
                </form>
                <template #buttons>
                    <GbButton @click="isEditing = false">Cancelar</GbButton>
                    <GbButton @click="submit">Aceptar</GbButton>
                </template>
            </GbDialog>
        </Teleport>

        <button class="city-bar" @click="startEditing">{{ weather.city?.name ?? 'Elige tu ciudad' }}</button>

        <div class="content" @click="onContentClick">
            <div v-if="!weather.city" class="empty">
                Toca la ciudad para elegirla
            </div>

            <template v-else>
                <WeatherIcon
                    v-if="description && weather.data"
                    class="icon"
                    :kind="description.kind"
                    :is-day="weather.data.isDay" />

                <div v-if="weather.data" class="temperature">
                    {{ Math.round(weather.data.temperature) }}°
                </div>

                <div class="details">
                    <div v-if="description" class="condition">{{ description.label }}</div>
                    <div v-if="weather.data" class="range">
                        {{ Math.round(weather.data.max) }}° / {{ Math.round(weather.data.min) }}°
                    </div>
                    <div v-if="weather.status === 'loading'" class="status">Actualizando…</div>
                    <div v-else-if="weather.status === 'error'" class="status error">{{ weather.errorMessage }}</div>
                </div>
            </template>
        </div>

    </div>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, the city on a dark bar, the reading recessed below
.weather-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    > .city-bar {
        @include gb-widget-bar;
        appearance: none;
        padding: 3px 8px;
        border: 1px solid #111;
        border-radius: 4px;
        font: inherit;
        font-size: 13px;
        font-weight: bold;
        text-align: left;
        cursor: pointer;

        &:active {
            @include gb-pressed;
        }
    }

    > .content {
        @include gb-widget-inset;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 0;
        padding: 4px 10px;
        cursor: pointer;

        > .icon {
            flex-shrink: 0;
            width: 48px;
            height: 48px;
        }

        > .temperature {
            font-size: 34px;
            line-height: 1;
            font-weight: 300;
        }

        > .details {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
            margin-left: auto;
            text-align: right;
            font-size: 13px;

            > .condition,
            > .range {
                color: rgba(#fff, 0.85);
            }

            > .status {
                font-size: 11px;
                color: rgba(#fff, 0.6);

                &.error {
                    color: #ffb74d;
                }
            }
        }

        > .empty {
            flex: 1;
            text-align: center;
            font-size: 13px;
            color: #ccc;
        }
    }
}

// teleported into the dialog, outside .weather-widget
.city-form {
    padding: 8px 16px;

    > input {
        width: 100%;
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
