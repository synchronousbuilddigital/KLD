export const setLargeData = (key, data) => {
  return new Promise((resolve, reject) => {
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
    req.onerror = () => reject(req.error);
  });
};
