<script setup lang="ts">
import { computed, ref } from 'vue';
import { useNow } from '@vueuse/core';
import { useMediaStore } from '@/stores/useMediaStore';
import { useAppsStore } from '@/stores/useAppsStore';
import { formatMediaTime, mediaPosition } from '@/utils/media';

// What's playing, with previous / play-pause / next. Used by the music widget (translucent, over the
// wallpaper) and at the top of our notification panel (dark). Needs our Bridge fork and notification access.

const props = defineProps<{
    variant: 'widget' | 'panel';
}>();

const media = useMediaStore();
const apps = useAppsStore();

const artFailed = ref(false);
const session = computed(() => media.session);
const isPlaying = computed(() => session.value?.state === 'playing' || session.value?.state === 'buffering');

// the progress bar only needs to tick while playing
const now = useNow({ interval: 1000 });
const position = computed(() => session.value ? mediaPosition(session.value, now.value.getTime()) : null);
const progress = computed(() =>
{
    const duration = session.value?.durationMs;
    return duration && position.value !== null ? position.value / duration : null;
});

const title = computed(() => session.value?.title ?? apps.apps.get(session.value?.packageName ?? '')?.label ?? 'Música');
const subtitle = computed(() => session.value?.artist ?? session.value?.album ?? apps.apps.get(session.value?.packageName ?? '')?.label ?? '');

const message = computed(() =>
{
    if (!media.isSupported) return 'Tu versión de Bridge no puede controlar la música.';
    if (!media.canRead) return 'Toca para permitir que Bridge vea lo que suena.';
    if (!session.value) return 'No hay música sonando.';
    return null;
});

function onMessageClick()
{
    if (media.isSupported && !media.canRead)
        media.requestAccess();
}
</script>

<template>
    <div class="music-player" :class="props.variant">
        <button v-if="message" class="message" @click="onMessageClick">
            <svg class="note" viewBox="0 0 32 32" aria-hidden="true">
                <path d="M12 6h14v5h-9v13a5 5 0 1 1-5-5z" fill="currentColor" />
            </svg>
            <span>{{ message }}</span>
        </button>

        <template v-else-if="session">
            <button class="info" aria-label="Abrir la app de música" @click="media.openApp()">
                <img
                    v-if="media.artUrl && !artFailed"
                    :key="media.artUrl"
                    class="art"
                    :src="media.artUrl"
                    alt=""
                    draggable="false"
                    @error="artFailed = true"
                    @load="artFailed = false" />
                <span v-else class="art placeholder">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M12 6h14v5h-9v13a5 5 0 1 1-5-5z" fill="currentColor" />
                    </svg>
                </span>
                <span class="texts">
                    <span class="title">{{ title }}</span>
                    <span v-if="subtitle" class="subtitle">{{ subtitle }}</span>
                    <span v-if="props.variant === 'panel' && position !== null && session.durationMs" class="time">
                        {{ formatMediaTime(position) }} / {{ formatMediaTime(session.durationMs) }}
                    </span>
                </span>
            </button>

            <div class="controls">
                <button :disabled="!session.canSkipToPrevious" aria-label="Anterior" @click="media.previous()">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M8 7h3v18H8zM26 7v18L12 16z" fill="currentColor" />
                    </svg>
                </button>
                <button class="play" :aria-label="isPlaying ? 'Pausar' : 'Reproducir'" @click="media.playPause()">
                    <svg v-if="isPlaying" viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M9 6h5v20H9zM18 6h5v20h-5z" fill="currentColor" />
                    </svg>
                    <svg v-else viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M10 5l17 11-17 11z" fill="currentColor" />
                    </svg>
                </button>
                <button :disabled="!session.canSkipToNext" aria-label="Siguiente" @click="media.next()">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path d="M21 7h3v18h-3zM6 7v18l14-9z" fill="currentColor" />
                    </svg>
                </button>
            </div>

            <div v-if="progress !== null" class="progress">
                <div class="fill" :style="{ width: `${progress * 100}%` }"></div>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
$gingerbread-orange: #ffa800;

.music-player {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 72px;
    padding: 8px 8px 10px;
    overflow: hidden;
    color: #fff;

    // on the home screen: Songbird's look, with the cover in a light frame and glossy grouped buttons
    &.widget {
        @include gb-widget-frame;
        padding: 5px 5px 8px;
        text-shadow: 0 1px 1px #000;

        > .info > .art {
            padding: 3px;
            border-radius: 2px;
            background: linear-gradient(to bottom, #f2f2f2, #cfcfcf);
        }

        > .controls {
            overflow: hidden;
            border: 1px solid #111;
            border-radius: 4px;

            > button {
                @include gb-widget-button;
                border-radius: 0;

                & + button {
                    border-left: 1px solid #111;
                }

                &:disabled {
                    opacity: 1;
                }
            }
        }
    }

    // in the notification panel: a dark glossy card like the quick toggles
    &.panel {
        border: 1px solid rgba(#fff, 0.16);
        border-radius: 6px;
        background:
            linear-gradient(to bottom, rgba(#fff, 0.08), rgba(#fff, 0.02) 50%, transparent 50%),
            linear-gradient(to bottom, #2e2e2e, #0c0c0c);
    }

    button {
        appearance: none;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;
    }

    > .message {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 0 4px;
        font-size: 14px;
        text-align: left;
        color: rgba(#fff, 0.8);

        > .note {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
        }
    }

    > .info {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0;
        text-align: left;

        > .art {
            flex-shrink: 0;
            width: 52px;
            height: 52px;
            border-radius: 3px;
            object-fit: cover;
            box-shadow: 0 1px 3px rgba(#000, 0.6);

            &.placeholder {
                display: grid;
                place-items: center;
                background: linear-gradient(to bottom, #555, #2a2a2a);

                > svg {
                    width: 26px;
                    height: 26px;
                    color: #ccc;
                }
            }
        }

        > .texts {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 2px;

            > span {
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            > .title {
                font-size: 16px;
                font-weight: bold;
            }

            > .subtitle,
            > .time {
                font-size: 13px;
                color: rgba(#fff, 0.7);
            }
        }

        &:active > .texts > .title {
            color: $gingerbread-orange;
        }
    }

    > .controls {
        flex-shrink: 0;
        display: flex;
        align-items: center;

        > button {
            display: grid;
            place-items: center;
            width: 40px;
            height: 44px;
            border-radius: 4px;

            > svg {
                width: 22px;
                height: 22px;
            }

            &.play > svg {
                width: 28px;
                height: 28px;
            }

            &:disabled {
                opacity: 0.35;
            }

            &:active:not(:disabled) {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                color: #111;
            }
        }
    }

    // a thin orange bar along the bottom edge
    > .progress {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background-color: rgba(#fff, 0.15);

        > .fill {
            height: 100%;
            background-color: $gingerbread-orange;
        }
    }
}
</style>
