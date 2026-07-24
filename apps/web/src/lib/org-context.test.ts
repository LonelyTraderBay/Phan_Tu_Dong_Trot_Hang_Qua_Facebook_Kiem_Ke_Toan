import { describe, expect, it } from 'vitest';
import { buildApiHeaders } from './org-context';

describe('buildApiHeaders', () => {
  it('injects Authorization and X-Org-Id', () => {
    const h = buildApiHeaders({
      accessToken: 'tok',
      orgId: '11111111-1111-1111-1111-111111111111',
    });

    expect(h.Authorization).toBe('Bearer tok');
    expect(h['X-Org-Id']).toBe('11111111-1111-1111-1111-111111111111');
  });
});
