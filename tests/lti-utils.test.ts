import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('jose', () => {
  const signJwtInstance = {
    setProtectedHeader: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue('mock.jwt.signature'),
  };
  return {
    generateKeyPair: vi.fn().mockResolvedValue({
      publicKey: { type: 'public' },
      privateKey: { type: 'private' },
    }),
    importPKCS8: vi.fn().mockResolvedValue('imported-key'),
    SignJWT: vi.fn().mockImplementation(function () {
      return signJwtInstance;
    }),
    jwtVerify: vi.fn(),
  };
});

vi.mock('@/lib/db', () => ({
  getPrisma: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock crypto.subtle.exportKey before importing the module
const mockExportKey = vi.fn();
vi.stubGlobal('crypto', {
  subtle: {
    exportKey: mockExportKey,
  },
  randomUUID: vi.fn().mockReturnValue('test-uuid'),
});

import {
  generateToolKeyPair,
  fetchPlatformJwks,
  signAgsToken,
  syncGradesToPlatform,
  fetchNrpsMembers,
} from '@/lib/lti-utils';
import { getPrisma } from '@/lib/db';
import { jwtVerify } from 'jose';

describe('generateToolKeyPair', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportKey.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
  });

  it('generates RSA key pair with base64-encoded keys', async () => {
    const keyPair = await generateToolKeyPair();
    expect(keyPair).toHaveProperty('publicKey');
    expect(keyPair).toHaveProperty('privateKey');
    expect(typeof keyPair.publicKey).toBe('string');
    expect(typeof keyPair.privateKey).toBe('string');
    expect(() => Buffer.from(keyPair.publicKey, 'base64')).not.toThrow();
    expect(() => Buffer.from(keyPair.privateKey, 'base64')).not.toThrow();
  });

  it('calls exportKey for both public and private keys', async () => {
    await generateToolKeyPair();
    expect(mockExportKey).toHaveBeenCalledTimes(2);
  });
});

describe('fetchPlatformJwks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches JWKS from platform URL', async () => {
    const mockKeys = [{ kty: 'RSA', kid: 'key1' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ keys: mockKeys }),
    });

    const keys = await fetchPlatformJwks('https://platform-fetch.example.com/jwks');
    expect(keys).toEqual(mockKeys);
  });

  it('throws on non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchPlatformJwks('https://platform-error.example.com/jwks'))
      .rejects.toThrow('Failed to fetch JWKS');
  });

  it('returns cached keys within TTL', async () => {
    const mockKeys = [{ kty: 'RSA', kid: 'cached' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ keys: mockKeys }),
    });

    // First call - should fetch
    const keys1 = await fetchPlatformJwks('https://platform-cache.example.com/jwks');
    expect(keys1).toEqual(mockKeys);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const keys2 = await fetchPlatformJwks('https://platform-cache.example.com/jwks');
    expect(keys2).toEqual(mockKeys);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('signAgsToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a valid JWT string', async () => {
    const token = await signAgsToken(
      'base64privatekey',
      'https://lms.example.com/token',
      'client-123',
    );
    expect(token).toBe('mock.jwt.signature');
  });
});

describe('syncGradesToPlatform', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns error when platform not found', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      ltiPlatform: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any);

    const result = await syncGradesToPlatform('nonexistent', 'user1', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Platform not found');
  });

  it('returns error when private key not configured', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      ltiPlatform: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1', privateKey: null, tokenUrl: 'https://lms/token', clientId: 'c1',
        }),
      },
    } as any);

    const result = await syncGradesToPlatform('p1', 'user1', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Platform private key not configured');
  });

  it('returns error when user not found', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      ltiPlatform: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1', privateKey: 'pk123', tokenUrl: 'https://lms/token', clientId: 'c1',
        }),
      },
      user: { findUnique: vi.fn().mockResolvedValue(null) },
    } as any);

    const result = await syncGradesToPlatform('p1', 'nonexistent', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns success on successful sync', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      ltiPlatform: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1', privateKey: 'pk123', tokenUrl: 'https://lms/token', clientId: 'c1',
        }),
      },
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com' }) },
      ltiGradeSync: { create: vi.fn().mockResolvedValue({}) },
    } as any);

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'https://lms/lineitems/1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    const result = await syncGradesToPlatform('p1', 'u1', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(true);
  });

  it('returns error when lineitem creation fails', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      ltiPlatform: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1', privateKey: 'pk123', tokenUrl: 'https://lms/token', clientId: 'c1',
        }),
      },
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com' }) },
    } as any);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue('Forbidden'),
    });

    const result = await syncGradesToPlatform('p1', 'u1', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to create lineitem');
  });

  it('returns error when score submission fails', async () => {
    vi.mocked(getPrisma).mockReturnValue({
      ltiPlatform: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'p1', privateKey: 'pk123', tokenUrl: 'https://lms/token', clientId: 'c1',
        }),
      },
      user: { findUnique: vi.fn().mockResolvedValue({ id: 'u1', email: 'test@test.com' }) },
    } as any);

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'https://lms/lineitems/1' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        text: vi.fn().mockResolvedValue('Score error'),
      });

    const result = await syncGradesToPlatform('p1', 'u1', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to send score');
  });

  it('catches and returns generic errors', async () => {
    vi.mocked(getPrisma).mockImplementation(() => {
      throw new Error('DB connection failed');
    });

    const result = await syncGradesToPlatform('p1', 'u1', 'module1', 85, 100, 'Quiz 1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('DB connection failed');
  });
});

describe('fetchNrpsMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and maps NRPS members', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        members: [
          { user_id: 'u1', email: 'a@test.com', name: 'Alice', status: 'Active' },
          { user_id: 'u2', email: 'b@test.com', name: 'Bob', status: 'Inactive' },
        ],
      }),
    });

    const members = await fetchNrpsMembers(
      'https://lms/memberships',
      'https://lms/token',
      'client-123',
      'privateKeyPem',
    );

    expect(members).toHaveLength(2);
    expect(members[0]).toEqual({
      userId: 'u1', email: 'a@test.com', name: 'Alice', status: 'Active',
    });
    expect(members[1]).toEqual({
      userId: 'u2', email: 'b@test.com', name: 'Bob', status: 'Inactive',
    });
  });

  it('returns empty array when no members', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ members: [] }),
    });

    const members = await fetchNrpsMembers(
      'https://lms/memberships',
      'https://lms/token',
      'client-123',
      'privateKeyPem',
    );

    expect(members).toHaveLength(0);
  });

  it('handles missing members field', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const members = await fetchNrpsMembers(
      'https://lms/memberships',
      'https://lms/token',
      'client-123',
      'privateKeyPem',
    );

    expect(members).toHaveLength(0);
  });

  it('throws on non-OK response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    await expect(fetchNrpsMembers(
      'https://lms/memberships',
      'https://lms/token',
      'client-123',
      'privateKeyPem',
    )).rejects.toThrow('NRPS sync failed');
  });

  it('handles members with missing fields', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        members: [{ user_id: 'u1' }],
      }),
    });

    const members = await fetchNrpsMembers(
      'https://lms/memberships',
      'https://lms/token',
      'client-123',
      'privateKeyPem',
    );

    expect(members[0]).toEqual({
      userId: 'u1', email: '', name: '', status: 'Active',
    });
  });
});
