<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMediaStore } from '@/stores/useMediaStore';
import { useAppsStore } from '@/stores/useAppsStore';

// The music widget in the style of Songbird's (and other Android 2.x players'): the album art in a
// light frame on the left; on the right, "Artist - Title" on a dark bar over three big glossy buttons.
// An alternative look to MusicPlayer.vue, with the same data (useMediaStore).

const media = useMediaStore();
const apps = useAppsStore();

const artFailed = ref(false);
const session = computed(() => media.session);
const isPlaying = computed(() => session.value?.state === 'playing' || session.value?.state === 'buffering');
const hasSession = computed(() => media.isSupported && media.canRead && !!session.value);

const appLabel = computed(() => apps.apps.get(session.value?.packageName ?? '')?.label);

// "Incubus - Stellar": the artist stands out, the title is dimmer
const artist = computed(() => session.value?.artist ?? appLabel.value ?? null);
const title = computed(() => session.value?.title ?? null);

const message = computed(() =>
{
    if (!media.isSupported) return 'Bridge no puede controlar la música';
    if (!media.canRead) return 'Toca para permitir el acceso';
    if (!session.value) return 'No hay música sonando';
    return null;
});

function onInfoClick()
{
    if (hasSession.value)
        media.openApp();
    else if (media.isSupported && !media.canRead)
        media.requestAccess();
}
</script>

<template>
    <div class="songbird-player">
        <button class="art-frame" aria-label="Abrir la app de música" @click="onInfoClick">
            <img
                v-if="hasSession && media.artUrl && !artFailed"
                :key="media.artUrl"
                :src="media.artUrl"
                alt=""
                draggable="false"
                @error="artFailed = true"
                @load="artFailed = false" />
            <span v-else class="placeholder">
                <svg viewBox="0 0 32 32" aria-hidden="true">
                    <path d="M12 6h14v5h-9v13a5 5 0 1 1-5-5z" fill="currentColor" />
                </svg>
            </span>
        </button>

        <div class="right">
            <button class="track" @click="onInfoClick">
                <template v-if="message">
                    <span class="dim">{{ message }}</span>
                </template>
                <template v-else>
                    <span v-if="artist" class="artist">{{ artist }}</span>
                    <span v-if="artist && title" class="dim"> - </span>
                    <span v-if="title" class="dim">{{ title }}</span>
                </template>
            </button>

            <div class="buttons">
                <button
                    :disabled="!hasSession || !session?.canSkipToPrevious"
                    aria-label="Anterior"
                    @click="media.previous()">
                    <svg viewBox="0 0 40 24" aria-hidden="true">
                        <path d="M19 4v16L5 12zM35 4v16L21 12z" fill="currentColor" />
                    </svg>
                </button>
                <button :disabled="!hasSession" :aria-label="isPlaying ? 'Pausar' : 'Reproducir'" @click="media.playPause()">
                    <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" fill="currentColor" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7 4l13 8-13 8z" fill="currentColor" />
                    </svg>
                </button>
                <button
                    :disabled="!hasSession || !session?.canSkipToNext"
                    aria-label="Siguiente"
                    @click="media.next()">
                    <svg viewBox="0 0 40 24" aria-hidden="true">
                        <path d="M5 4v16l14-8zM21 4v16l14-8z" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.songbird-player {
    display: flex;
    gap: 6px;
    height: 100%;
    max-height: 104px;
    min-height: 76px;
    padding: 5px;
    border: 1px solid rgba(#fff, 0.25);
    border-radius: 7px;
    background: linear-gradient(to bottom, rgba(#3c3c3c, 0.85), rgba(#1a1a1a, 0.9));
    box-shadow: 0 3px 8px rgba(#000, 0.5);

    button {
        appearance: none;
        border: none;
        font: inherit;
        cursor: pointer;
    }

    // the cover in a light frame, square and as tall as the widget
    > .art-frame {
        flex-shrink: 0;
        height: 100%;
        aspect-ratio: 1;
        padding: 3px;
        border-radius: 2px;
        background: linear-gradient(to bottom, #f2f2f2, #cfcfcf);
        box-shadow: 0 1px 2px rgba(#000, 0.6);

        > img,
        > .placeholder {
            display: block;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        > .placeholder {
            display: grid;
            place-items: center;
            background: linear-gradient(to bottom, #555, #2a2a2a);
            color: #bbb;

            > svg {
                width: 45%;
                height: 45%;
            }
        }

        &:active {
            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        }
    }

    > .right {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #111;
        border-radius: 4px;

        // "Artist - Title" on a dark bar
        > .track {
            flex-shrink: 0;
            overflow: hidden;
            padding: 5px 8px;
            border-bottom: 1px solid #0a0a0a;
            background: linear-gradient(to bottom, #4a4a4a, #2c2c2c);
            color: #fff;
            font-size: 15px;
            text-align: left;
            text-overflow: ellipsis;
            text-shadow: 0 1px 1px #000;
            white-space: nowrap;

            > .artist {
                font-weight: bold;
            }

            > .dim {
                color: #bdbdbd;
            }
        }

        // three big glossy gray buttons split by dividers
        > .buttons {
            flex: 1;
            display: flex;

            > button {
                flex: 1;
                display: grid;
                place-items: center;
                border-right: 1px solid #111;
                background:
                    linear-gradient(to bottom, rgba(#fff, 0.14), rgba(#fff, 0.04) 50%, transparent 50%),
                    linear-gradient(to bottom, #6a6a6a, #383838);
                box-shadow: inset 0 1px 0 rgba(#fff, 0.15);
                color: #e8e8e8;

                &:last-child {
                    border-right: none;
                }

                > svg {
                    height: 22px;
                    filter: drop-shadow(0 1px 1px #000);
                }

                &:disabled {
                    color: #8a8a8a;
                }

                &:active:not(:disabled) {
                    background: linear-gradient(to bottom, #ffc64d, #ff8a00);
                    color: #111;
                }
            }
        }
    }
}
</style>
