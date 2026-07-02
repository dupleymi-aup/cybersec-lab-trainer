import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

vi.stubGlobal('fetch', mockFetch);

const mockJwtVerify = vi.fn();

vi.mock('jose', () => ({
  generateKeyPair: vi.fn().mockResolvedValue({
    publicKey: { type: 'public' } as unknown as CryptoKey,
    privateKey: { type: 'private' } as unknown as CryptoKey,
  }),
  exportJWK: vi.fn().mockResolvedValue({ kty: 'RSA', n: 'test', e: 'AQAB' }),
  importSPKI: vi.fn().mockResolvedValue({ type: 'key' } as unknown as CryptoKey),
  importPKCS8: vi.fn().mockResolvedValue({ type: 'key' } as unknown as CryptoKey),
  SignJWT: class MockSignJWT {
    constructor(private payload: Record<string, unknown>) {}
    setProtectedHeader() {
      return {
        sign: async () => 'mock.jwt.token',
      };
    }
  },
  jwtVerify: mockJwtVerify,
}));

vi.mock('@/lib/db', () => ({
  prisma: {
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
  },
}));

const mockPlatform = {
  id: 'platform1',
  privateKey: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
  publicKey: '',
  tokenUrl: 'https://example.com/token.php',
  keysetUrl: 'https://example.com/keys',
  clientId: 'client123',
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  name: 'Test Platform',
  issuer: 'https://example.com',
  deploymentId: 'deploy1',
  authUrl: 'https://example.com/auth',
};

function makeValidLtiPayload(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'user123',
    iss: 'https://example.com',
    name: 'Test User',
    email: 'test@example.com',
    roles: ['learner'],
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'deploy1',
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiResourceLinkRequest',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti/claim/resource_link': { id: 'res1' },
    'https://purl.imsglobal.org/spec/lti/claim/target_link_uri': 'https://example.com/launch',
    ...overrides,
  };
}

describe('LTI Utilities', () => {
  describe('Module exports', () => {
    it('should export expected functions', async () => {
      const ltiUtils = await import('@/lib/lti-utils');
      expect(typeof ltiUtils.verifyLtiLaunch).toBe('function');
      expect(typeof ltiUtils.signAgsToken).toBe('function');
      expect(typeof ltiUtils.syncGradesToPlatform).toBe('function');
      expect(typeof ltiUtils.fetchNrpsMembers).toBe('function');
      expect(typeof ltiUtils.fetchPlatformJwks).toBe('function');
      expect(typeof ltiUtils.generateToolKeyPair).toBe('function');
    });
  });

  describe('generateToolKeyPair', () => {
    it('should generate key pair using jose', async () => {
      vi.resetModules();
      // Mock crypto.subtle.exportKey to return ArrayBuffer
      const origExportKey = crypto.subtle.exportKey;
      crypto.subtle.exportKey = vi.fn().mockResolvedValue(new ArrayBuffer(32));

      const { generateToolKeyPair } = await import('@/lib/lti-utils');
      const result = await generateToolKeyPair();

      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('privateKey');
      expect(typeof result.publicKey).toBe('string');
      expect(typeof result.privateKey).toBe('string');

      crypto.subtle.exportKey = origExportKey;
    });
  });

  describe('fetchPlatformJwks', () => {
    it('should fetch and return JWKS keys', async () => {
      const mockJwks = { keys: [{ kty: 'RSA', kid: 'key1' }] };
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockJwks),
      });

      vi.resetModules();
      const { fetchPlatformJwks } = await import('@/lib/lti-utils');
      const result = await fetchPlatformJwks('https://example.com/certs.php');

      expect(result).toEqual(mockJwks.keys);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/certs.php');
    });

    it('should return cached JWKS on second call within TTL', async () => {
      let callCount = 0;
      mockFetch.mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          json: vi.fn().mockResolvedValue({ keys: [{ kty: 'RSA', kid: `key${callCount}` }] }),
        };
      });

      vi.resetModules();
      const { fetchPlatformJwks } = await import('@/lib/lti-utils');

      const first = await fetchPlatformJwks('https://example.com/certs.php');
      expect(first[0].kid).toBe('key1');
      expect(callCount).toBe(1);

      const second = await fetchPlatformJwks('https://example.com/certs.php');
      expect(second[0].kid).toBe('key1');
      expect(callCount).toBe(1);
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

    it('should throw on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      vi.resetModules();
      const { fetchPlatformJwks } = await import('@/lib/lti-utils');

      await expect(
        fetchPlatformJwks('https://example.com/certs.php'),
      ).rejects.toThrow('Network error');
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

  describe('verifyLtiLaunch', () => {
    it('should verify a valid LTI launch token', async () => {
      const payload = makeValidLtiPayload();
      mockJwtVerify.mockResolvedValue({ payload });

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ keys: [{ kty: 'RSA', kid: 'key1' }] }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');
      const result = await verifyLtiLaunch('mock.id.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1');

      expect(result.sub).toBe('user123');
      expect(result.email).toBe('test@example.com');
      expect(result.iss).toBe('https://example.com');
    });

    it('should try multiple keys and succeed on the first valid one', async () => {
      mockJwtVerify.mockRejectedValueOnce(new Error('invalid key')).mockResolvedValueOnce({
        payload: makeValidLtiPayload(),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          keys: [{ kid: 'bad' }, { kid: 'good' }],
        }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');
      const result = await verifyLtiLaunch('mock.id.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1');

      expect(result.sub).toBe('user123');
      expect(mockJwtVerify).toHaveBeenCalledTimes(2);
    });

    it('should throw when no key can verify the token', async () => {
      mockJwtVerify.mockRejectedValue(new Error('invalid key'));

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ keys: [{ kid: 'bad' }] }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');

      await expect(
        verifyLtiLaunch('bad.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1'),
      ).rejects.toThrow('Invalid LTI launch token');
    });

    it('should throw on issuer mismatch', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: makeValidLtiPayload({ iss: 'https://evil.com' }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ keys: [{ kid: 'key1' }] }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');

      await expect(
        verifyLtiLaunch('mock.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1'),
      ).rejects.toThrow('Issuer mismatch');
    });

    it('should throw on deployment ID mismatch', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: makeValidLtiPayload({
          'https://purl.imsglobal.org/spec/lti/claim/deployment_id': 'wrong-deploy',
        }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ keys: [{ kid: 'key1' }] }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');

      await expect(
        verifyLtiLaunch('mock.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1'),
      ).rejects.toThrow('Deployment ID mismatch');
    });

    it('should throw on invalid message type', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: makeValidLtiPayload({
          'https://purl.imsglobal.org/spec/lti/claim/message_type': 'UnknownType',
        }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ keys: [{ kid: 'key1' }] }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');

      await expect(
        verifyLtiLaunch('mock.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1'),
      ).rejects.toThrow('Invalid LTI message type');
    });

    it('should throw when sub claim is missing', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: makeValidLtiPayload({ sub: undefined }),
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ keys: [{ kid: 'key1' }] }),
      });

      vi.resetModules();
      const { verifyLtiLaunch } = await import('@/lib/lti-utils');

      await expect(
        verifyLtiLaunch('mock.token', 'https://example.com', 'https://example.com/keys', 'client123', 'deploy1'),
      ).rejects.toThrow('Missing sub claim');
    });
  });

  describe('syncGradesToPlatform', () => {
    it('should return error when platform not found', async () => {
      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockResolvedValue(null);

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('nonexistent', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Platform not found');
    });

    it('should return error when private key not configured', async () => {
      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockResolvedValue({ ...mockPlatform, privateKey: null });

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Platform private key not configured');
    });

    it('should return error when user not found', async () => {
      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockResolvedValue(mockPlatform);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should sync grade successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'lineitem-123' }),
      });

      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockResolvedValue(mockPlatform);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', email: 'test@test.com' } as any);

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(prisma.ltiGradeSync.create).toHaveBeenCalled();
    });

    it('should return error when lineitem creation fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValue('Bad request'),
      });

      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockResolvedValue(mockPlatform);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', email: 'test@test.com' } as any);

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create lineitem');
    });

    it('should return error when score submission fails', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ id: 'lineitem-123' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: vi.fn().mockResolvedValue('Unauthorized'),
        });

      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockResolvedValue(mockPlatform);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'user1', email: 'test@test.com' } as any);

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to send score');
    });

    it('should handle generic errors gracefully', async () => {
      const { prisma } = await import('@/lib/db');
      vi.mocked(prisma.ltiPlatform.findUnique).mockRejectedValue(new Error('DB connection error'));

      const { syncGradesToPlatform } = await import('@/lib/lti-utils');
      const result = await syncGradesToPlatform('platform1', 'user1', 'module1', 80, 100, 'Test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB connection error');
    });
  });

  describe('fetchNrpsMembers', () => {
    it('should fetch and return members', async () => {
      const mockResponse = {
        members: [
          { user_id: 'u1', email: 'a@test.com', name: 'Alice', status: 'Active' },
          { user_id: 'u2', email: 'b@test.com', name: 'Bob', status: 'Active' },
        ],
      };
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      vi.resetModules();
      const { fetchNrpsMembers } = await import('@/lib/lti-utils');
      const members = await fetchNrpsMembers(
        'https://example.com/memberships',
        'https://example.com/token',
        'client123',
        'private-key-pem',
      );

      expect(members).toHaveLength(2);
      expect(members[0]).toEqual({ userId: 'u1', email: 'a@test.com', name: 'Alice', status: 'Active' });
    });

    it('should handle empty members list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ members: [] }),
      });

      vi.resetModules();
      const { fetchNrpsMembers } = await import('@/lib/lti-utils');
      const members = await fetchNrpsMembers('https://example.com/memberships', 'https://example.com/token', 'client123', 'private-key');

      expect(members).toEqual([]);
    });

    it('should handle missing members field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      vi.resetModules();
      const { fetchNrpsMembers } = await import('@/lib/lti-utils');
      const members = await fetchNrpsMembers('https://example.com/memberships', 'https://example.com/token', 'client123', 'private-key');

      expect(members).toEqual([]);
    });

    it('should throw on fetch failure', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 403 });

      vi.resetModules();
      const { fetchNrpsMembers } = await import('@/lib/lti-utils');

      await expect(
        fetchNrpsMembers('https://example.com/memberships', 'https://example.com/token', 'client123', 'private-key'),
      ).rejects.toThrow('NRPS fetch failed');
    });

    it('should throw on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      vi.resetModules();
      const { fetchNrpsMembers } = await import('@/lib/lti-utils');

      await expect(
        fetchNrpsMembers('https://example.com/memberships', 'https://example.com/token', 'client123', 'private-key'),
      ).rejects.toThrow('NRPS sync failed');
    });
  });
});
