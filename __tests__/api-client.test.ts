import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/env', () => ({
  env: { apiBase: 'https://api.test' },
}));

import { apiGet } from '../services/api-client';

describe('apiGet', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs apiBase + path and returns parsed JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accounts: [] }),
    }) as unknown as typeof fetch;

    const res = await apiGet<{ accounts: unknown[] }>('/accounts');
    expect(res.accounts).toEqual([]);
    expect(global.fetch).toHaveBeenCalledWith('https://api.test/accounts', expect.any(Object));
  });

  it('forwards cookie header when provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await apiGet('/auth/me', { cookieHeader: 'sam_session=abc' });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).Cookie).toBe('sam_session=abc');
  });

  it('throws on non-2xx', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not found',
    }) as unknown as typeof fetch;
    await expect(apiGet('/missing')).rejects.toThrow(/404/);
  });
});
