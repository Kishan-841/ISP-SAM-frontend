import { describe, it, expect } from 'vitest';
import { dashboardHref } from '../lib/dashboard-filters';

/**
 * The Existing Base / New Base dashboards carry two independent filters in
 * the URL: ?quarter= and ?sam=. Each control rewrites its own param and must
 * leave the other one alone — changing the quarter can't silently drop the
 * selected SAM, and vice versa.
 */
describe('dashboardHref', () => {
  it('returns a bare path when nothing is filtered', () => {
    expect(dashboardHref('/existing-base', {})).toBe('/existing-base');
  });

  it('adds the quarter on its own', () => {
    expect(dashboardHref('/existing-base', { quarter: 'Q2' })).toBe('/existing-base?quarter=Q2');
  });

  it('adds the sam on its own', () => {
    expect(dashboardHref('/new-base', { sam: 'abc-123' })).toBe('/new-base?sam=abc-123');
  });

  it('keeps both filters together, quarter first', () => {
    expect(dashboardHref('/existing-base', { quarter: 'Q3', sam: 'abc-123' })).toBe(
      '/existing-base?quarter=Q3&sam=abc-123',
    );
  });

  it('drops the sam but keeps the quarter when the SAM is cleared', () => {
    expect(dashboardHref('/existing-base', { quarter: 'Q3', sam: undefined })).toBe(
      '/existing-base?quarter=Q3',
    );
  });

  it('drops the quarter but keeps the sam when the quarter is cleared', () => {
    expect(dashboardHref('/existing-base', { quarter: undefined, sam: 'abc-123' })).toBe(
      '/existing-base?sam=abc-123',
    );
  });

  it('works for bucket drill-down paths too', () => {
    expect(dashboardHref('/existing-base/disconnections', { quarter: 'Q1', sam: 'xyz' })).toBe(
      '/existing-base/disconnections?quarter=Q1&sam=xyz',
    );
  });
});
