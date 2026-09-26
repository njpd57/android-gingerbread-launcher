import { defineStore } from "pinia";
import { ref } from "vue";
import { useBridgeEventStore } from "./useBridgeEventStore";
import { bridgeHas } from "@/utils/bridge-utils";
import type { BridgeContact, BridgeGetContactsResponse } from "@/types/bridge-fork";

// The device's contacts, for the favorite contacts widget, direct dial and the search panel. Only
// our Bridge fork can read them (READ_CONTACTS) and place calls directly (CALL_PHONE); without the
// second permission, `call()` falls back to opening the dialer with the number typed in.
export const useContactsStore = defineStore('contacts', () =>
{
    const bridgeEvents = useBridgeEventStore();

    const isSupported = bridgeHas('getContactsURL') && bridgeHas('requestContactsPermission');
    const canRead = ref(isSupported && Bridge.getCanReadContacts());
    const canCall = ref(isSupported && bridgeHas('getCanCallPhone') && Bridge.getCanCallPhone());
    // bumped when the contact list itself changes, so open widgets/panels refetch
    const version = ref(0);

    if (isSupported)
    {
        bridgeEvents.addEventListener(ev =>
        {
            if (ev.name === 'contactsChanged')
                version.value++;
            else if (ev.name === 'canReadContactsChanged')
            {
                canRead.value = ev.newValue;
                version.value++;
            }
            else if (ev.name === 'canCallPhoneChanged')
                canCall.value = ev.newValue;
            // both permissions can also be granted from Android's app settings
            else if (ev.name === 'afterResume')
            {
                canRead.value = Bridge.getCanReadContacts();
                canCall.value = bridgeHas('getCanCallPhone') && Bridge.getCanCallPhone();
                version.value++;
            }
        });
    }

    async function fetchContacts(query = '', starredOnly = false, limit = 0): Promise<BridgeContact[]>
    {
        if (!canRead.value) return [];
        try
        {
            const res = await fetch(Bridge.getContactsURL(query, starredOnly, limit));
            if (!res.ok) return [];
            return (await res.json() as BridgeGetContactsResponse).contacts;
        }
        catch (ex)
        {
            console.error('Failed to load contacts', ex);
            return [];
        }
    }

    return {
        isSupported,
        canRead,
        canCall,
        version,
        fetchContacts,
        requestAccess: () => Bridge.requestContactsPermission(true),
        requestCallAccess: () => bridgeHas('requestCallPhonePermission') && Bridge.requestCallPhonePermission(true),
        /** Calls right away with CALL_PHONE; without it, opens the dialer with the number typed in. */
        call: (number: string) => Bridge.requestCallPhoneNumber(number, true),
        openContact: (c: BridgeContact) => Bridge.requestOpenContact(c.lookupKey, true),
        /** Takes anything with a `lookupKey`, so widgets that only kept that (not the full contact) can use it too. */
        photoUrl: (c: { lookupKey: string }) => Bridge.getContactPhotoURL(c.lookupKey),
    };
});
