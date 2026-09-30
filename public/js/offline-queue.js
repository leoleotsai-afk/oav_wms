// 離線重傳佇列：手機操作若斷線，寫入動作先存 IndexedDB，
// 待恢復連線後自動依序重送。未來的交易畫面(訂單/收貨/領用...)呼叫
// window.OfflineQueue.submit(url, options) 取代直接 fetch()。
(function () {
  const DB_NAME = "oav-offline-queue";
  const STORE = "pending-requests";
  const DB_VERSION = 1;

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function addToQueue(entry) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).add(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getAll() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function remove(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function count() {
    const rows = await getAll();
    return rows.length;
  }

  const listeners = new Set();
  function notify(status) {
    listeners.forEach((fn) => {
      try { fn(status); } catch (e) { /* ignore listener errors */ }
    });
  }

  // 嘗試送出一筆請求；成功則回傳 true，失敗(網路問題)回傳 false
  async function trySend(entry) {
    try {
      const res = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  let flushing = false;
  async function flushQueue() {
    if (flushing || !navigator.onLine) return;
    flushing = true;
    try {
      const rows = await getAll();
      for (const row of rows) {
        const ok = await trySend(row);
        if (ok) {
          await remove(row.id);
          notify({ type: "sent", id: row.id, remaining: await count() });
        } else {
          // 一遇到失敗就停止，保留原始送出順序，下次再全部重試
          break;
        }
      }
    } finally {
      flushing = false;
    }
  }

  // 主要對外方法：以佇列方式送出寫入請求，離線時先暫存
  async function submit(url, options) {
    const entry = {
      url,
      method: (options && options.method) || "POST",
      headers: (options && options.headers) || { "Content-Type": "application/json" },
      body: options && options.body,
      createdAt: Date.now(),
    };

    if (navigator.onLine) {
      const ok = await trySend(entry);
      if (ok) return { queued: false, sent: true };
    }

    await addToQueue(entry);
    notify({ type: "queued", remaining: await count() });
    return { queued: true, sent: false };
  }

  window.addEventListener("online", flushQueue);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushQueue();
  });
  setInterval(flushQueue, 15000);

  window.OfflineQueue = {
    submit,
    flushQueue,
    count,
    onChange: (fn) => listeners.add(fn),
  };
})();
