/**
 * Bridge module to break circular dependency between store.ts and auth-store.ts.
 * Uses a callback-based init pattern to avoid require() in browser bundle.
 */

type AuthStoreRef = {
  getUserId: () => string;
  saveProgressSnapshot: (moduleId: string, score: number, completed: boolean) => Promise<void>;
};

let _ref: AuthStoreRef | null = null;

/**
 * Initialize the bridge with auth store references.
 * Called once during app startup from a place where both stores are available.
 */
export function initAuthBridge(getUserId: () => string, saveProgressSnapshot: (moduleId: string, score: number, completed: boolean) => Promise<void>) {
  _ref = { getUserId, saveProgressSnapshot };
}

function getRef(): AuthStoreRef {
  if (!_ref) {
    return {
      getUserId: () => 'anonymous',
      saveProgressSnapshot: () => Promise.resolve(),
    };
  }
  return _ref;
}

export function getCurrentUserId(): string {
  return getRef().getUserId();
}

export function saveProgressSnapshotProxy(moduleId: string, score: number, completed: boolean): Promise<void> {
  return getRef().saveProgressSnapshot(moduleId, score, completed);
}
