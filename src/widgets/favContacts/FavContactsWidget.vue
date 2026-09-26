<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useContactsStore } from '@/stores/useContactsStore';
import type { BridgeContact } from '@/types/bridge-fork';
import ContactGlyph from '@/widgets/search/ContactGlyph.vue';
import WidgetDialog from '@/components/WidgetDialog.vue';

// Up to 4 favorite contacts (4x1), starred in the Contacts app, with a Quick Contact style menu on
// tap: call, message or view the contact. Needs our Bridge fork's contacts API and READ_CONTACTS.

const MAX_SHOWN = 4;

const contacts = useContactsStore();
const favorites = ref<BridgeContact[]>([]);

watch([() => contacts.canRead, () => contacts.version], async () =>
{
    favorites.value = contacts.canRead ? await contacts.fetchContacts('', true, MAX_SHOWN) : [];
}, { immediate: true });

const message = computed(() =>
{
    if (!contacts.isSupported) return 'Tu versión de Bridge no puede leer los contactos.';
    if (!contacts.canRead) return 'Toca para permitir el acceso a los contactos.';
    if (favorites.value.length === 0) return 'Marca tus contactos favoritos con una estrella.';
    return null;
});

function primaryNumber(c: BridgeContact)
{
    return c.phoneNumbers.find(p => p.isPrimary) ?? c.phoneNumbers[0];
}

const menuFor = ref<BridgeContact | null>(null);

function onTileClick(c: BridgeContact)
{
    if (!contacts.canRead) contacts.requestAccess();
    else menuFor.value = c;
}

function callNumber(number: string)
{
    menuFor.value = null;
    contacts.call(number);
}

function messageNumber(number: string)
{
    menuFor.value = null;
    Bridge.requestOpenUrl(`smsto:${number}`);
}

function viewContact(c: BridgeContact)
{
    menuFor.value = null;
    contacts.openContact(c);
}
</script>

<template>
    <div class="fav-contacts-widget">
        <div class="bar">Favoritos</div>

        <div class="content">
            <div v-if="message" class="message">{{ message }}</div>

            <template v-else>
                <button v-for="c in favorites" :key="c.lookupKey" class="contact" @click="onTileClick(c)">
                    <img v-if="c.hasPhoto" :src="contacts.photoUrl(c)" alt="" draggable="false" />
                    <span v-else class="glyph"><ContactGlyph /></span>
                    <span class="name">{{ c.name }}</span>
                </button>
            </template>
        </div>

        <!-- Quick Contact style menu: the contact's numbers, a message and viewing the card -->
        <WidgetDialog :open="!!menuFor" :title="menuFor?.name ?? ''" @close="menuFor = null">
            <div class="quick-menu">
                <button v-for="p in menuFor?.phoneNumbers" :key="p.number" @click="callNumber(p.number)">
                    Llamar{{ p.label ? ` · ${p.label}` : '' }}: {{ p.number }}
                </button>
                <button @click="messageNumber(primaryNumber(menuFor!).number)">Enviar mensaje</button>
                <button @click="viewContact(menuFor!)">Ver contacto</button>
            </div>
        </WidgetDialog>
    </div>
</template>

<style scoped lang="scss">
// Songbird's look: a gray frame, "Favoritos" on a dark bar, the contacts recessed below
.fav-contacts-widget {
    @include gb-widget-frame;
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    height: 100%;
    padding: 5px;
    text-shadow: 0 1px 1px #000;

    > .bar {
        @include gb-widget-bar;
        padding: 3px 8px;
        border: 1px solid #111;
        border-radius: 4px;
        font-size: 13px;
        font-weight: bold;
    }

    > .content {
        @include gb-widget-inset;
        flex: 1;
        display: flex;
        align-items: center;
        min-height: 0;

        > .message {
            flex: 1;
            padding: 4px 10px;
            font-size: 13px;
            color: #ccc;
            text-align: center;
        }

        > .contact {
            appearance: none;
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            min-width: 0;
            height: 100%;
            padding: 4px 2px;
            border: none;
            background: none;
            color: #fff;
            font: inherit;
            cursor: pointer;

            &:active {
                @include gb-pressed;
            }

            > img,
            > .glyph {
                @include gb-contact-photo;
                flex-shrink: 0;
                width: 36px;
                height: 36px;
            }

            > .glyph {
                display: grid;
                place-items: end center;
                overflow: hidden;

                > :deep(svg) {
                    width: 30px;
                    height: 30px;
                }
            }

            > .name {
                max-width: 100%;
                overflow: hidden;
                font-size: 11px;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }
}

// teleported into the dialog, outside .fav-contacts-widget
.quick-menu {
    display: flex;
    flex-direction: column;

    > button {
        appearance: none;
        min-height: 52px;
        padding: 8px 16px;
        border: none;
        border-bottom: 1px solid rgba(#000, 0.15);
        background: none;
        color: inherit;
        font: inherit;
        font-size: 17px;
        text-align: left;
        cursor: pointer;

        &:last-child {
            border-bottom: none;
        }

        &:active {
            background: linear-gradient(to bottom, #ffc64d, #ff8a00);
        }
    }
}
</style>
