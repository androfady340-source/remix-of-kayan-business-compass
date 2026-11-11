import { describe, expect, it } from 'vitest';
import { PLANS, INSTAPAY_NUMBER, hasActiveAccess } from '@/lib/subscriptions';

describe('manual subscription rules', () => {
  it('monthly is 499 EGP for one month', () => { expect(PLANS.find(p => p.key === 'monthly')).toMatchObject({ amount:499, months:1 }); });
  it('quarterly is 1299 EGP for three months', () => { expect(PLANS.find(p => p.key === 'quarterly')).toMatchObject({ amount:1299, months:3 }); });
  it('semi annual is 2399 EGP for six months', () => { expect(PLANS.find(p => p.key === 'semi_annual')).toMatchObject({ amount:2399, months:6 }); });
  it('annual is 4499 EGP for twelve months', () => { expect(PLANS.find(p => p.key === 'annual')).toMatchObject({ amount:4499, months:12 }); });
  it('uses the specified InstaPay destination', () => { expect(INSTAPAY_NUMBER).toBe('01208744830'); });
  it('pending and rejected accounts cannot enter even with a paid term', () => { expect(hasActiveAccess('pending','2027-01-01',Date.parse('2026-11-08'))).toBe(false); expect(hasActiveAccess('rejected','2027-01-01',Date.parse('2026-11-08'))).toBe(false); });
  it('approval alone does not grant access without a confirmed term', () => { expect(hasActiveAccess('approved',null,Date.parse('2026-11-08'))).toBe(false); });
  it('approved accounts need an unexpired term', () => { expect(hasActiveAccess('approved','2027-01-01',Date.parse('2026-11-08'))).toBe(true); expect(hasActiveAccess('approved','2026-11-08',Date.parse('2026-11-08'))).toBe(false); });
});