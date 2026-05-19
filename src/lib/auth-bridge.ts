/**
 * Bridge module to break circular dependency between store.ts and auth-store.ts.
 * Provides a lazy getter for the auth store to avoid initialization issues.
 */

let _authStore: any = null;

function getAuthStoreModule() {
  if (!_authStore) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _authStore = require('./auth-store');
  }
  return _authStore;
}

export function getCurrentUserId(): string {
  try {
    const { useAuthStore } = getAuthStoreModule();
    const { user } = useAuthStore.getState();
    return user?.id || 'anonymous';
  } catch {
    return 'anonymous';
  }
}

export function saveProgressSnapshotProxy(moduleId: string, score: number, completed: boolean) {
  try {
    const { saveProgressSnapshot } = getAuthStoreModule();
    return saveProgressSnapshot(moduleId, score, completed);
  } catch {
    return Promise.resolve();
  }
}
