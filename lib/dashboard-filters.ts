export type FyQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type DashboardFilters = {
  quarter?: FyQuarter;
  /** User id of the selected SAM; undefined means "All SAMs". */
  sam?: string;
};

/**
 * Compose a dashboard URL from the two filters the Existing Base / New Base
 * views share. Both the quarter chips and the SAM dropdown route through
 * this, so neither control can drop the other's selection — the bug you get
 * when each one builds its own `?param=` string from the pathname alone.
 */
export function dashboardHref(pathname: string, filters: DashboardFilters): string {
  const qs = new URLSearchParams();
  if (filters.quarter) qs.set('quarter', filters.quarter);
  if (filters.sam) qs.set('sam', filters.sam);
  const query = qs.toString();
  return query ? `${pathname}?${query}` : pathname;
}
