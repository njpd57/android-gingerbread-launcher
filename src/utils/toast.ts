import { useToastStore } from "@/stores/useToastStore";
import { bridgeHas } from "./bridge-utils";

const FALLBACK_ERROR = 'No se pudo completar la acción.';

/** Shows a Gingerbread-style toast (see `useToastStore`). */
export function showToast(text: string, long = false)
{
    useToastStore().show(text, long);
}

/**
 * Runs a Bridge `request…` call with Bridge's own error toast turned off (`showToastIfFailed`), and shows
 * the error in the launcher's toast instead when it fails. Returns what the call returned.
 *
 *     bridgeRequest(t => Bridge.requestOpenUrl(url, t))
 */
export function bridgeRequest(call: (showToastIfFailed: boolean) => boolean): boolean
{
    const ok = call(false);
    if (!ok)
        showToast(lastBridgeError() ?? FALLBACK_ERROR, true);
    return ok;
}

function lastBridgeError(): string | null
{
    if (!bridgeHas('getLastErrorMessage')) return null;
    try
    {
        return Bridge.getLastErrorMessage() || null;
    }
    catch
    {
        return null;
    }
}
