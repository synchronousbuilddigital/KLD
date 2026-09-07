export const setLargeData = (key, data) => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('dieline_db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('dielines')) {
        db.createObjectStore('dielines');
      }
    };
    req.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('dielines', 'readwrite');
      const store = tx.objectStore('dielines');
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
};
