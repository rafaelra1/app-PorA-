import { Task, PendingAction } from '../types/checklist';

const DB_NAME = 'PoraChecklistDB';
const DB_VERSION = 1;
const STORE_TASKS = 'tasks';
const STORE_PENDING_ACTIONS = 'pending_actions';

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_TASKS)) {
                // Key path is composite: trip_id and id, or just use id and index trip_id
                // We'll use 'id' as keyPath (task UUID) and index 'trip_id' for querying
                const taskStore = db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
                taskStore.createIndex('trip_id', 'trip_id', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORE_PENDING_ACTIONS)) {
                db.createObjectStore(STORE_PENDING_ACTIONS, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onerror = (event) => {
            reject((event.target as IDBOpenDBRequest).error);
        };
    });

    return dbPromise;
};

// --- Task Operations ---

export const saveTasks = async (tasks: Task[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_TASKS, 'readwrite');
        const store = transaction.objectStore(STORE_TASKS);

        tasks.forEach(task => {
            store.put(task);
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const saveTask = async (task: Task): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_TASKS, 'readwrite');
        const store = transaction.objectStore(STORE_TASKS);
        store.put(task);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const deleteTaskFromCache = async (taskId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_TASKS, 'readwrite');
        const store = transaction.objectStore(STORE_TASKS);
        store.delete(taskId);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getTasksByTripId = async (tripId: string): Promise<Task[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_TASKS, 'readonly');
        const store = transaction.objectStore(STORE_TASKS);
        const index = store.index('trip_id');
        const request = index.getAll(tripId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

// --- Pending Action Operations ---

export const addPendingAction = async (action: PendingAction): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
        const store = transaction.objectStore(STORE_PENDING_ACTIONS);
        store.put(action);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const getPendingActions = async (): Promise<PendingAction[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PENDING_ACTIONS, 'readonly');
        const store = transaction.objectStore(STORE_PENDING_ACTIONS);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by timestamp to process in order
            const actions = request.result as PendingAction[];
            resolve(actions.sort((a, b) => a.timestamp - b.timestamp));
        };
        request.onerror = () => reject(request.error);
    });
};

export const removePendingAction = async (actionId: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
        const store = transaction.objectStore(STORE_PENDING_ACTIONS);
        store.delete(actionId);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

export const clearPendingActions = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_PENDING_ACTIONS, 'readwrite');
        const store = transaction.objectStore(STORE_PENDING_ACTIONS);
        store.clear();
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};
