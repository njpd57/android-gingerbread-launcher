// Photos for the photo frame widgets, stored in IndexedDB (localStorage is too small for images),
// keyed by the widget's home item id.

const DB_NAME = 'gingerbread-launcher';
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb()
{
    dbPromise ??= new Promise((resolve, reject) =>
    {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>)
{
    const db = await openDb();
    return new Promise<T>((resolve, reject) =>
    {
        const req = action(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function loadPhoto(widgetId: string): Promise<Blob | null>
{
    return (await run<Blob | undefined>('readonly', s => s.get(widgetId))) ?? null;
}

export async function savePhoto(widgetId: string, photo: Blob)
{
    await run('readwrite', s => s.put(photo, widgetId));
}

/** Deletes the photos of widgets that are no longer on the home screen. */
export async function prunePhotos(keepWidgetIds: Iterable<string>)
{
    const keep = new Set(keepWidgetIds);
    const keys = await run<IDBValidKey[]>('readonly', s => s.getAllKeys());
    for (const key of keys)
    {
        if (!keep.has(String(key)))
            await run('readwrite', s => s.delete(key));
    }
}
