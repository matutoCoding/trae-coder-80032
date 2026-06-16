const locks = new Map<string, boolean>();
const lockVersions = new Map<string, number>();

export const acquireLock = (key: string, timeout: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const tryLock = () => {
      if (!locks.get(key)) {
        locks.set(key, true);
        console.log(`[Lock] Acquired lock: ${key}`);
        resolve(true);
        return;
      }
      if (Date.now() - startTime > timeout) {
        console.log(`[Lock] Timeout waiting for lock: ${key}`);
        resolve(false);
        return;
      }
      setTimeout(tryLock, 50);
    };
    tryLock();
  });
};

export const releaseLock = (key: string): void => {
  locks.set(key, false);
  console.log(`[Lock] Released lock: ${key}`);
};

export const checkAndIncrementVersion = (key: string, expectedVersion: number): { success: boolean; newVersion: number } => {
  const currentVersion = lockVersions.get(key) || 0;
  if (currentVersion !== expectedVersion) {
    console.log(`[Lock] Version mismatch for ${key}: expected ${expectedVersion}, current ${currentVersion}`);
    return { success: false, newVersion: currentVersion };
  }
  const newVersion = currentVersion + 1;
  lockVersions.set(key, newVersion);
  console.log(`[Lock] Version updated for ${key}: ${currentVersion} -> ${newVersion}`);
  return { success: true, newVersion };
};

export const getCurrentVersion = (key: string): number => {
  return lockVersions.get(key) || 0;
};

export const withLock = async <T>(key: string, fn: () => Promise<T>, timeout?: number): Promise<T> => {
  const locked = await acquireLock(key, timeout);
  if (!locked) {
    throw new Error(`Failed to acquire lock for ${key}`);
  }
  try {
    return await fn();
  } finally {
    releaseLock(key);
  }
};
