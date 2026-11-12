import { describe, expect, it } from 'vitest';
import { loginDestination } from '@/lib/login-destination';

describe('login destination', () => {
  it('sends the site administrator directly to account administration', () => {
    expect(loginDestination(true)).toBe('/admin');
  });
  it('sends company members to their workspace rather than plan selection', () => {
    expect(loginDestination(false)).toBe('/app');
  });
});