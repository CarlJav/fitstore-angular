export interface ConfiguracionStore {
  name: string;
  keyPath: string;
  indexes?: {
    name: string;
    keyPath: string;
    unique?: boolean;
  }[];
}

export class IndexedDbHelper {
  constructor(
    private readonly dbName: string,
    private readonly dbVersion: number,
    private readonly stores: ConfiguracionStore[]
  ) {}

  abrirBD(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB no está disponible en este entorno.'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const tx = (event.target as IDBOpenDBRequest).transaction;
        this.configurarStores(db, tx);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Error al abrir IndexedDB.'));
    });
  }

  async leerTodos<T>(storeName: string): Promise<T[]> {
    const db = await this.abrirBD();

    return new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as T[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error(`Error leyendo ${storeName}.`));
      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error(`Error en transacción de lectura en ${storeName}.`));
      };
    });
  }

  async ejecutarTransaccion(
    storeNames: string | string[],
    modo: IDBTransactionMode,
    operacion: (tx: IDBTransaction) => void,
    mensajeError: string
  ): Promise<void> {
    const db = await this.abrirBD();

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeNames, modo);
      operacion(tx);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error(mensajeError));
      };
    });
  }

  private configurarStores(db: IDBDatabase, tx: IDBTransaction | null): void {
    for (const cfg of this.stores) {
      const store = !db.objectStoreNames.contains(cfg.name)
        ? db.createObjectStore(cfg.name, { keyPath: cfg.keyPath })
        : tx!.objectStore(cfg.name);

      for (const idx of cfg.indexes ?? []) {
        if (!store.indexNames.contains(idx.name)) {
          store.createIndex(idx.name, idx.keyPath, { unique: idx.unique ?? false });
        }
      }
    }
  }
}