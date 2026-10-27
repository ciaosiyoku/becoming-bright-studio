// The device's own storage (IndexedDB): the whole app state is saved under one key. Nothing is sent anywhere.
// If IndexedDB fails (some private-browsing modes), the state lives in memory until the page reloads.

const DB_NAME = 'becoming-bright-studio'
const STORE = 'kv'
const memory = new Map<string, unknown>()
let dbPromise: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1)
    open.onupgradeneeded = () => open.result.createObjectStore(STORE)
    open.onsuccess = () => resolve(open.result)
    open.onerror = () => reject(open.error)
  })
  return dbPromise
}

function request<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return db().then(
    (d) =>
      new Promise<T>((resolve, reject) => {
        const req = run(d.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      }),
  )
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  try {
    return await request<T | undefined>('readonly', (s) => s.get(key))
  } catch {
    return memory.get(key) as T | undefined
  }
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  memory.set(key, value)
  try {
    await request('readwrite', (s) => s.put(value, key))
  } catch {
    // Kept in memory only.
  }
}

export async function kvDelete(key: string): Promise<void> {
  memory.delete(key)
  try {
    await request('readwrite', (s) => s.delete(key))
  } catch {
    // Nothing stored on the device.
  }
}
