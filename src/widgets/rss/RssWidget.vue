<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { useBridgeEventStore, type AnyBridgeEventListener } from '@/stores/useBridgeEventStore';
import { normalizeFeedUrl, parseFeed, type FeedItem } from '@/utils/rss';
import { bridgeHas } from '@/utils/bridge-utils';
import WidgetDialog from '@/components/WidgetDialog.vue';
import GbButton from '@/components/GbButton.vue';

// The latest headlines of an RSS or Atom feed (4x2). Tapping a headline opens it (our Bridge fork's
// requestOpenUrl); tapping the title changes the feed. The WebView can only read feeds that allow CORS,
// which many don't: the error says so.

// a Chilean news feed that allows CORS, so the widget works right away (the m. site: see normalizeFeedUrl)
const DEFAULT_FEED = 'https://m.cooperativa.cl/noticias/site/tax/port/all/rss_3___1.xml';
const REFRESH_MS = 30 * 60_000;
const MAX_ITEMS = 8;

const props = defineProps<{
    widgetId?: string;
}>();

const feedUrl = useWidgetData<string>(() => props.widgetId, DEFAULT_FEED);

const title = ref('');
const items = ref<FeedItem[]>([]);
const error = ref('');
const loading = ref(false);
let lastFetch = 0;

async function load()
{
    loading.value = true;
    error.value = '';
    try
    {
        const resp = await fetch(normalizeFeedUrl(feedUrl.value));
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const feed = parseFeed(await resp.text());
        if (!feed)
        {
            error.value = 'La dirección no es un feed RSS o Atom.';
            return;
        }
        title.value = feed.title;
        items.value = feed.items.slice(0, MAX_ITEMS);
        lastFetch = Date.now();
    }
    catch
    {
        // a CORS refusal and no connection look the same from here
        error.value = navigator.onLine
            ? 'No se pudo leer este feed. Muchos sitios no permiten leerlos desde otra página (CORS).'
            : 'Sin conexión.';
    }
    finally
    {
        loading.value = false;
    }
}

// the preview in "Añadir" shows sample headlines instead of downloading the feed
if (props.widgetId)
    watch(feedUrl, load, { immediate: true });
else
{
    title.value = 'Titulares';
    items.value = ['Hoy se espera un día soleado en la costa', 'Nuevo récord de visitas en el museo', 'Los resultados de la fecha del domingo']
        .map(t => ({ title: t, link: '' }));
}
const timer = window.setInterval(() =>
{
    if (props.widgetId && Date.now() - lastFetch > REFRESH_MS) load();
}, 60_000);
onBeforeUnmount(() => clearInterval(timer));

// coming back to the launcher after a while
const bridgeEvents = useBridgeEventStore();
const onBridgeEvent: AnyBridgeEventListener = ev =>
{
    if (ev.name === 'afterResume' && props.widgetId && Date.now() - lastFetch > REFRESH_MS) load();
};
bridgeEvents.addEventListener(onBridgeEvent);
onBeforeUnmount(() => bridgeEvents.removeEventListener(onBridgeEvent));

const canOpen = bridgeHas('requestOpenUrl');
function open(item: FeedItem)
{
    if (!item.link) return;
    if (canOpen)
        Bridge.requestOpenUrl(item.link, true);
    else
        Bridge.showToast('Tu versión de Bridge no puede abrir enlaces.');
}

const isEditing = ref(false);
const draft = ref('');
const inputEl = ref<HTMLInputElement>();

async function edit()
{
    if (!props.widgetId) return;
    draft.value = feedUrl.value;
    isEditing.value = true;
    await nextTick();
    inputEl.value?.select();
}

function save()
{
    const url = draft.value.trim();
    if (url)
        feedUrl.value = normalizeFeedUrl(url);
    isEditing.value = false;
}
</script>

<template>
    <div class="rss-widget">
        <button class="header" @click="edit">
            <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="3" cy="13" r="2" />
                <path d="M1 7a8 8 0 0 1 8 8M1 2a13 13 0 0 1 13 13" fill="none" stroke-width="2.2" />
            </svg>
            <span>{{ title || 'Titulares' }}</span>
        </button>

        <ul v-if="items.length > 0">
            <li v-for="(item, i) in items" :key="i">
                <button @click="open(item)">{{ item.title }}</button>
            </li>
        </ul>
        <div v-else class="message">{{ error || (loading ? 'Cargando…' : 'El feed no tiene titulares.') }}</div>

        <WidgetDialog :open="isEditing" title="Feed de titulares" @close="isEditing = false">
            <form class="form" @submit.prevent="save">
                <input ref="inputEl" v-model="draft" type="url" placeholder="https://…/feed.xml" enterkeyhint="done" />
                <p>Dirección de un feed RSS o Atom. Solo funcionan los que permiten CORS, como el de Cooperativa.cl.</p>
            </form>
            <template #buttons>
                <GbButton @click="draft = DEFAULT_FEED">Por defecto</GbButton>
                <GbButton @click="save">Aceptar</GbButton>
            </template>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, the feed's name on a dark bar and the headlines recessed below
.rss-widget {
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
        text-align: left;
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

        &:active {
            @include gb-pressed;
        }

        > svg {
            flex-shrink: 0;
            width: 14px;
            height: 14px;
            fill: #ff9800;
            stroke: #ff9800;
        }

        > span {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    > ul {
        @include gb-widget-inset;
        flex: 1;
        margin: 0;
        padding: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        list-style: none;

        > li + li {
            border-top: 1px solid rgba(#fff, 0.08);
        }

        > li > button {
            width: 100%;
            padding: 5px 10px;
            font-size: 13px;
            line-height: 1.25;
            // up to two lines per headline
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;

            &:active {
                @include gb-pressed;
            }
        }
    }

    > .message {
        @include gb-widget-inset;
        flex: 1;
        display: grid;
        place-items: center;
        padding: 8px 12px;
        font-size: 13px;
        text-align: center;
        opacity: 0.8;
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

    > p {
        margin: 0;
        font-size: 12px;
        opacity: 0.65;
    }
}
</style>
