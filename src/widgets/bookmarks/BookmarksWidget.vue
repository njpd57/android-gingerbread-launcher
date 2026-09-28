<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { bridgeHas } from '@/utils/bridge-utils';
import { bridgeRequest, showToast } from '@/utils/toast';
import { bookmarkInitial, defaultBookmarkName, faviconUrl, MAX_BOOKMARKS, normalizeBookmarkUrl, type Bookmark } from '@/utils/bookmarks';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// The browser's "Bookmarks" widget from 2.3 (4x2, idea 48): a grid of sites with their icon and name
// that open in the browser (our Bridge fork's requestOpenUrl). Tapping the title edits the list.

const props = defineProps<{
    widgetId?: string;
}>();

const SAMPLE: Bookmark[] = [
    { id: 1, name: 'Wikipedia', url: 'https://es.wikipedia.org/' },
    { id: 2, name: 'Google', url: 'https://www.google.com/' },
    { id: 3, name: 'YouTube', url: 'https://m.youtube.com/' },
];

const bookmarks = useWidgetData<Bookmark[]>(() => props.widgetId, SAMPLE);

// sites whose favicon didn't load show their initial instead
const brokenIcons = reactive(new Set<number>());

const canOpen = bridgeHas('requestOpenUrl');
function open(b: Bookmark)
{
    if (!props.widgetId) return;
    if (canOpen)
        bridgeRequest(t => Bridge.requestOpenUrl(b.url, t));
    else
        showToast('Tu versión de Bridge no puede abrir enlaces.');
}

const isEditing = ref(false);
const draftName = ref('');
const draftUrl = ref('');
const urlEl = ref<HTMLInputElement>();

async function edit()
{
    if (!props.widgetId) return;
    draftName.value = '';
    draftUrl.value = '';
    isEditing.value = true;
    await nextTick();
    if (bookmarks.value.length < MAX_BOOKMARKS) urlEl.value?.focus();
}

function add()
{
    const url = normalizeBookmarkUrl(draftUrl.value);
    if (!url)
    {
        showToast('Escribe una dirección web, por ejemplo wikipedia.org.');
        return;
    }
    const id = Math.max(0, ...bookmarks.value.map(b => b.id)) + 1;
    const name = draftName.value.trim() || defaultBookmarkName(url);
    bookmarks.value = [...bookmarks.value, { id, name, url }];
    draftName.value = '';
    draftUrl.value = '';
}

function remove(b: Bookmark)
{
    bookmarks.value = bookmarks.value.filter(x => x.id !== b.id);
    brokenIcons.delete(b.id);
}
</script>

<template>
    <div class="bookmarks-widget">
        <button class="header" @click="edit">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 1h8v14l-4-3-4 3z" />
            </svg>
            <span>Marcadores</span>
        </button>

        <div v-if="bookmarks.length > 0" class="grid">
            <button v-for="b in bookmarks.slice(0, MAX_BOOKMARKS)" :key="b.id" class="site" @click="open(b)">
                <span class="icon">
                    <img
                        v-if="!brokenIcons.has(b.id)"
                        :src="faviconUrl(b.url)"
                        alt=""
                        draggable="false"
                        @error="brokenIcons.add(b.id)" />
                    <span v-else class="letter">{{ bookmarkInitial(b.name) }}</span>
                </span>
                <span class="name">{{ b.name }}</span>
            </button>
        </div>
        <button v-else class="message" @click="edit">Toca para añadir sitios.</button>

        <WidgetDialog :open="isEditing" title="Marcadores" @close="isEditing = false">
            <ul class="list">
                <li v-for="b in bookmarks" :key="b.id">
                    <span class="text">
                        <span class="name">{{ b.name }}</span>
                        <span class="url">{{ b.url }}</span>
                    </span>
                    <button class="remove" :aria-label="`Quitar ${b.name}`" @click="remove(b)">✕</button>
                </li>
            </ul>
            <form v-if="bookmarks.length < MAX_BOOKMARKS" class="form" @submit.prevent="add">
                <input ref="urlEl" v-model="draftUrl" type="url" placeholder="Dirección (wikipedia.org)" enterkeyhint="next" />
                <input v-model="draftName" type="text" placeholder="Nombre (opcional)" enterkeyhint="done" />
            </form>
            <p v-else class="full">Caben {{ MAX_BOOKMARKS }} sitios. Quita uno para añadir otro.</p>
            <template #buttons>
                <GbButton v-if="bookmarks.length < MAX_BOOKMARKS" @click="add">Añadir</GbButton>
                <GbButton @click="isEditing = false">Listo</GbButton>
            </template>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
.bookmarks-widget {
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

    > .header {
        @include gb-widget-bar;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border: 1px solid #111;
        border-radius: 4px;
        font-size: 13px;
        font-weight: bold;
        text-align: left;

        &:active {
            @include gb-pressed;
        }

        > svg {
            flex-shrink: 0;
            width: 14px;
            height: 14px;
            fill: #ffa800;
        }
    }

    > .grid {
        @include gb-widget-inset;
        flex: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(2, 1fr);
        padding: 2px;

        > .site {
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            padding: 2px;
            border-radius: 3px;

            &:active {
                @include gb-pressed;
            }

            > .icon {
                display: grid;
                place-items: center;
                width: 32px;
                height: 32px;
                border: 1px solid rgba(#fff, 0.25);
                border-radius: 3px;
                background: linear-gradient(to bottom, #f4f4f4, #cfcfcf);
                overflow: hidden;

                > img {
                    width: 24px;
                    height: 24px;
                }

                > .letter {
                    color: #333;
                    font-size: 18px;
                    font-weight: bold;
                    text-shadow: none;
                }
            }

            > .name {
                max-width: 100%;
                font-size: 11px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    > .message {
        @include gb-widget-inset;
        flex: 1;
        font-size: 13px;
        opacity: 0.8;
    }
}

.list {
    margin: 0;
    padding: 4px 0;
    list-style: none;

    > li {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 16px;
        border-bottom: 1px solid rgba(#fff, 0.08);

        > .text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;

            > .name {
                font-size: 15px;
            }

            > .url {
                font-size: 12px;
                opacity: 0.6;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        > .remove {
            appearance: none;
            border: none;
            background: none;
            color: inherit;
            width: 32px;
            height: 32px;
            font-size: 16px;
            opacity: 0.7;

            &:active {
                @include gb-pressed;
            }
        }
    }
}

.form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 16px;

    > input {
        padding: 8px 10px;
        border: 1px solid #ffa800;
        border-radius: 4px;
        background: rgba(#fff, 0.95);
        color: #000;
        font: inherit;
        font-size: 15px;
        outline: none;
    }
}

.full {
    padding: 8px 16px;
    font-size: 13px;
    opacity: 0.7;
}
</style>
