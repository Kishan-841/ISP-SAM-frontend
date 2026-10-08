import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted above the file body, so the spies have to be
// created with vi.hoisted to exist by the time they run.
const { getMeMock, getTeamMock } = vi.hoisted(() => ({
  getMeMock: vi.fn(),
  getTeamMock: vi.fn(),
}));
vi.mock('../services/auth', () => ({ getMe: getMeMock }));
vi.mock('../services/accounts', () => ({ getTeam: getTeamMock }));

import { getSamFilterOptions } from '../services/sam-options';

const TEAM = [{ id: 'sam-a', name: 'Asha Rao', email: 'asha@x.com' }];

describe('getSamFilterOptions', () => {
  beforeEach(() => {
    getMeMock.mockReset();
    getTeamMock.mockReset().mockResolvedValue(TEAM);
  });

  it('returns the team for an ADMIN', async () => {
    getMeMock.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });
    expect(await getSamFilterOptions()).toEqual(TEAM);
  });

  it('returns the team for a SAM_HEAD', async () => {
    getMeMock.mockResolvedValue({ user: { id: 'u1', role: 'SAM_HEAD' } });
    expect(await getSamFilterOptions()).toEqual(TEAM);
  });

  it('returns nothing for a SAM, who has only their own customers', async () => {
    getMeMock.mockResolvedValue({ user: { id: 'u1', role: 'SAM' } });
    expect(await getSamFilterOptions()).toEqual([]);
    expect(getTeamMock).not.toHaveBeenCalled();
  });

  it('returns nothing for roles the team endpoint rejects', async () => {
    getMeMock.mockResolvedValue({ user: { id: 'u1', role: 'ACCOUNTS' } });
    expect(await getSamFilterOptions()).toEqual([]);
    expect(getTeamMock).not.toHaveBeenCalled();
  });

  it('degrades to no dropdown rather than breaking the page when the fetch fails', async () => {
    getMeMock.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } });
    getTeamMock.mockRejectedValue(new Error('API 500'));
    expect(await getSamFilterOptions()).toEqual([]);
  });
});
