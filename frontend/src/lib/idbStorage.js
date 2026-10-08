export const setLargeData = (key, data) => {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open('dieline_db', 2);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('dielines')) {
          db.createObjectStore('dielines');
        }
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('dielines')) {
          resolve();
          return;
        }
        const tx = db.transaction('dielines', 'readwrite');
        const store = tx.objectStore('dielines');
        store.put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve(); // Non-blocking
      };
      req.onerror = () => resolve(); // Non-blocking fallback
    } catch {
      resolve();
    }
  });
};

export const getLargeData = (key) => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('dieline_db', 2);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('dielines')) {
          db.createObjectStore('dielines');
        }
      };
      req.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('dielines')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('dielines', 'readonly');
        const store = tx.objectStore('dielines');
        const getReq = store.get(key);
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => resolve(null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
};
