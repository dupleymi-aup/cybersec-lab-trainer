import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

vi.stubGlobal('fetch', mockFetch);

// Mock the jose module - must be at top level
vi.mock('jose', () => ({
  generateKeyPair: vi.fn().mockResolvedValue({
    publicKey: { type: 'public' },
    privateKey: { type: 'private' },
  }),
  exportJWK: vi.fn().mockResolvedValue({ kty: 'RSA', n: 'test', e: 'AQAB' }),
  importSPKI: vi.fn().mockResolvedValue({ type: 'key' }),
  importPKCS8: vi.fn().mockResolvedValue({ type: 'key' }),
  SignJWT: class MockSignJWT {
    private payload: Record<string, unknown>;
    constructor(payload: Record<string, unknown>) {
      this.payload = payload;
    }
    setProtectedHeader() {
      return { sign: async () => 'mock.jwt.token' };
    }
  },
  jwtVerify: vi.fn(),
}));

const mockPrisma = {
  ltiPlatform: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  ltiGradeSync: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  ltiLaunchLog: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/db', () => ({
  getPrisma: () => mockPrisma,
}));

describe('LTI Utilities', () => {
  describe('Module exports', () => {
    it('should export expected functions', async () => {
      const ltiUtils = await import('@/lib/lti-utils');
      expect(typeof ltiUtils.verifyLtiLaunch).toBe('function');
      expect(typeof ltiUtils.signAgsToken).toBe('function');
      expect(typeof ltiUtils.syncGradesToPlatform).toBe('function');
      expect(typeof ltiUtils.fetchNrpsMembers).toBe('function');
      expect(typeof ltiUtils.fetchPlatformJwks).toBe('function');
    });
  });

  describe('fetchPlatformJwks', () => {
    it('should fetch and cache JWKS', async () => {
      const mockJwks = { keys: [{ kty: 'RSA', kid: 'key1' }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJwks),
      });

      // Clear module cache to reset JWKS cache
      vi.resetModules();
      const { fetchPlatformJwks } = await import('@/lib/lti-utils');
      const result = await fetchPlatformJwks('https://example.com/certs.php');

      expect(result).toEqual(mockJwks.keys);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/certs.php');
    });

    it('should throw on fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      vi.resetModules();
      const { fetchPlatformJwks } = await import('@/lib/lti-utils');

      await expect(
        fetchPlatformJwks('https://example-fail.com/certs.php'),
      ).rejects.toThrow('Failed to fetch JWKS');
    });
  });

  describe('signAgsToken', () => {
    it('should generate a signed JWT', async () => {
      vi.resetModules();
      const { signAgsToken } = await import('@/lib/lti-utils');

      const token = await signAgsToken(
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
        'https://example.com/token.php',
        'client123',
      );

      expect(token).toBe('mock.jwt.token');
    });
  });

  describe('syncGradesToPlatform', () => {
    it('should return error when platform not found', async () => {
      mockPrisma.ltiPlatform.findUnique.mockResolvedValue(null);

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('nonexistent', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Platform not found');
    });

    it('should return error when private key not configured', async () => {
      mockPrisma.ltiPlatform.findUnique.mockResolvedValue({
        id: 'platform1',
        privateKey: null,
        publicKey: '',
        tokenUrl: 'https://example.com/token.php',
        authUrl: 'https://example.com/auth',
        keysetUrl: 'https://example.com/keys',
        clientId: 'client123',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        name: 'Test Platform',
        issuer: 'test-issuer',
        deploymentId: 'deploy1',
      });

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Platform private key not configured');
    });
  });
});
