<script setup lang="ts">
import { computed, ref } from 'vue';
import { useWidgetData } from '@/stores/useWidgetDataStore';
import { useContactsStore } from '@/stores/useContactsStore';
import { searchContacts } from '@/utils/search';
import type { BridgeContact } from '@/types/bridge-fork';
import ContactGlyph from '@/widgets/search/ContactGlyph.vue';
import WidgetDialog from '@/components/WidgetDialog.vue';

// Gingerbread's "Direct dial" / "Direct message" shortcuts (1x1): pick a contact and one of their
// numbers once, and the icon calls or texts that number straight away from then on. Reconfigure by
// removing and re-adding it. Needs our Bridge fork's contacts API.

interface DirectContactData
{
    lookupKey: string;
    name: string;
    number: string;
    label: string | null;
    hasPhoto: boolean;
}

const props = defineProps<{
    widgetId?: string;
    mode: 'call' | 'message';
}>();

const contacts = useContactsStore();

// an empty `lookupKey` means "not configured yet"
const data = useWidgetData<DirectContactData>(() => props.widgetId,
    { lookupKey: '', name: '', number: '', label: null, hasPhoto: false },
    { lookupKey: '', name: 'Contacto', number: '', label: null, hasPhoto: false });

// the picker: every contact with a number is offered as one row per number, so choosing a row
// picks the contact and the number in a single tap
const isPicking = ref(false);
const query = ref('');
const allContacts = ref<BridgeContact[]>([]);

interface NumberRow
{
    contact: BridgeContact;
    number: string;
    label: string | null;
}

const rows = computed<NumberRow[]>(() =>
{
    const matches = query.value.trim() ? searchContacts(allContacts.value, query.value) : allContacts.value;
    return matches.flatMap(c => c.phoneNumbers.map(p => ({ contact: c, number: p.number, label: p.label })));
});

async function openPicker()
{
    if (!props.widgetId || !contacts.canRead) return;
    query.value = '';
    allContacts.value = await contacts.fetchContacts();
    isPicking.value = true;
}

function pick(row: NumberRow)
{
    data.value = {
        lookupKey: row.contact.lookupKey,
        name: row.contact.name,
        number: row.number,
        label: row.label,
        hasPhoto: row.contact.hasPhoto,
    };
    isPicking.value = false;
    // ask for CALL_PHONE right away, so the icon can call directly from the first tap on;
    // without it requestCallPhoneNumber() just opens the dialer, silently, forever
    if (props.mode === 'call' && !contacts.canCall)
        contacts.requestCallAccess();
}

const message = computed(() =>
{
    if (!contacts.isSupported) return 'Necesita nuestro fork de Bridge';
    if (!contacts.canRead) return 'Toca para permitir el acceso a los contactos';
    return null;
});

function onClick()
{
    if (!contacts.isSupported) return;
    if (!contacts.canRead) { contacts.requestAccess(); return; }
    if (!data.value.lookupKey) { openPicker(); return; }
    if (props.mode === 'call')
        contacts.call(data.value.number);
    else
        Bridge.requestOpenUrl(`smsto:${data.value.number}`);
}
</script>

<template>
    <div class="direct-contact-widget">
        <button class="tile" :aria-label="message ?? data.name" @click="onClick">
            <span class="photo">
                <img v-if="data.hasPhoto" :src="contacts.photoUrl(data)" alt="" draggable="false" />
                <ContactGlyph v-else />
                <!-- Gingerbread's shortcut overlay: a green action glyph in the corner, no badge behind it -->
                <svg v-if="mode === 'call'" class="action" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                        d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.8c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.4 0 .8-.2 1L6.6 10.8z" />
                </svg>
                <svg v-else class="action" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                </svg>
            </span>
            <span class="label">{{ message ? (mode === 'call' ? 'Marcación directa' : 'Mensaje directo') : data.name }}</span>
        </button>

        <WidgetDialog :open="isPicking" :title="mode === 'call' ? 'Marcación directa' : 'Mensaje directo'" @close="isPicking = false">
            <div class="picker">
                <input v-model="query" type="text" placeholder="Buscar contacto" enterkeyhint="search" />
                <div class="rows">
                    <button
                        v-for="row in rows"
                        :key="`${row.contact.lookupKey}-${row.number}`"
                        class="row"
                        @click="pick(row)">
                        <img v-if="row.contact.hasPhoto" :src="contacts.photoUrl(row.contact)" alt="" draggable="false" />
                        <span v-else class="glyph"><ContactGlyph /></span>
                        <span class="texts">
                            <span class="name">{{ row.contact.name }}</span>
                            <span class="number">{{ row.label ? `${row.label} · ` : '' }}{{ row.number }}</span>
                        </span>
                    </button>
                    <div v-if="rows.length === 0" class="empty">Sin resultados</div>
                </div>
            </div>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
$gb-green: #7ed31b;

.direct-contact-widget {
    display: flex;
    width: 100%;
    height: 100%;

    > .tile {
        appearance: none;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        border: none;
        background: none;
        color: inherit;
        font: inherit;
        cursor: pointer;

        > .photo {
            @include gb-contact-photo;
            position: relative;
            display: grid;
            place-items: center;
            width: var(--icon-size, 48px);
            height: var(--icon-size, 48px);

            > img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            > :deep(svg:first-child) {
                width: 85%;
                height: 85%;
                margin-top: 15%;
            }

            > .action {
                position: absolute;
                right: -5px;
                bottom: -5px;
                width: 45%;
                height: 45%;
                min-width: 16px;
                min-height: 16px;
                fill: $gb-green;
                stroke: #1f3d05;
                stroke-width: 1.2;
                stroke-linejoin: round;
                filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.8));
            }
        }

        > .label {
            max-width: 100%;
            padding: 1px 6px;
            border-radius: 6px;
            background-color: rgba(#000, 0.45);
            font-size: 12px;
            line-height: 1.3;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &:active > .photo {
            border-color: #ffa800;
            box-shadow: 0 0 4px #ffa800, 0 0 2px #ffa800;
        }
    }
}

// teleported into the dialog, outside .direct-contact-widget
.picker {
    display: flex;
    flex-direction: column;

    > input {
        margin: 8px 16px;
        padding: 8px 10px;
        border: 1px solid #ffa800;
        border-radius: 4px;
        background: rgba(#fff, 0.95);
        color: #000;
        font: inherit;
        font-size: 16px;
        outline: none;
    }

    > .rows {
        display: flex;
        flex-direction: column;
        max-height: 50vh;
        overflow-y: auto;

        > .row {
            appearance: none;
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 56px;
            padding: 6px 16px;
            border: none;
            border-top: 1px solid rgba(#000, 0.12);
            background: none;
            color: inherit;
            font: inherit;
            text-align: left;
            cursor: pointer;

            &:active {
                background: linear-gradient(to bottom, #ffc64d, #ff8a00);
            }

            > img,
            > .glyph {
                @include gb-contact-photo;
                flex-shrink: 0;
                width: 40px;
                height: 40px;
            }

            > .glyph {
                display: grid;
                place-items: end center;
                overflow: hidden;

                > :deep(svg) {
                    width: 34px;
                    height: 34px;
                }
            }

            > .texts {
                display: flex;
                flex-direction: column;
                min-width: 0;

                > .name {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                > .number {
                    overflow: hidden;
                    font-size: 13px;
                    opacity: 0.7;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }
        }

        > .empty {
            padding: 16px;
            text-align: center;
            opacity: 0.7;
        }
    }
}
</style>
