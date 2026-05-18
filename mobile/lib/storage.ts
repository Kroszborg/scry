// Web-safe storage abstraction
// On web: uses localStorage (AsyncStorage throws "operation insecure" on some browsers)
// On native: uses AsyncStorage

const isWeb = typeof document !== "undefined";

let _AsyncStorage: any = null;

async function getStorage() {
  if (isWeb) return null;
  if (!_AsyncStorage) {
    _AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  }
  return _AsyncStorage;
}

export async function storageGet(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  const s = await getStorage();
  return s ? s.getItem(key) : null;
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  const s = await getStorage();
  if (s) await s.setItem(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  const s = await getStorage();
  if (s) await s.removeItem(key);
}
