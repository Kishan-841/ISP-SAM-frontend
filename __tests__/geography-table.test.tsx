/**
 * The zone table. Two behaviours matter beyond rendering numbers:
 *  - cities are hidden until their zone is expanded (12 zones × 25 cities is
 *    unreadable flat), and
 *  - customers the CRM hasn't zoned yet get their own row instead of being
 *    dropped, because right now that's most of the book.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeographyTable } from '../components/geography-table';
import type { GeoZoneRow } from '../services/geography';

function zone(over: Partial<GeoZoneRow> = {}): GeoZoneRow {
  return {
    name: 'Pune',
    customerCount: 3,
    totalArc: 600000,
    baseCount: 3,
    newCount: 0,
    baseArc: 600000,
    newArc: 0,
    arcSharePercent: 92.3,
    avgArc: 200000,
    unknownCityCount: 0,
    cities: [
      {
        name: 'Pune- Chakan',
        zone: 'Pune',
        customerCount: 2,
        totalArc: 400000,
        baseCount: 2,
        newCount: 0,
        baseArc: 400000,
        newArc: 0,
        arcSharePercent: 61.5,
        avgArc: 200000,
      },
    ],
    ...over,
  };
}

const NO_UNMAPPED = { customerCount: 0, totalArc: 0 };

describe('GeographyTable', () => {
  it('hides cities until the zone is expanded', () => {
    render(<GeographyTable zones={[zone()]} unmapped={NO_UNMAPPED} />);

    expect(screen.getByText('Pune')).toBeInTheDocument();
    expect(screen.queryByText('Pune- Chakan')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /expand pune/i }));
    expect(screen.getByText('Pune- Chakan')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /collapse pune/i }));
    expect(screen.queryByText('Pune- Chakan')).not.toBeInTheDocument();
  });

  it('shows the zone ARC in compact rupees with the exact figure on hover', () => {
    render(<GeographyTable zones={[zone()]} unmapped={NO_UNMAPPED} />);
    const cell = screen.getByText('₹6L');
    expect(cell).toHaveAttribute('title', '₹6,00,000');
  });

  it('gives unzoned customers their own row rather than dropping them', () => {
    render(
      <GeographyTable zones={[zone()]} unmapped={{ customerCount: 698, totalArc: 15000000 }} />,
    );
    expect(screen.getByText('Not mapped yet')).toBeInTheDocument();
    expect(screen.getByText('698')).toBeInTheDocument();
    expect(screen.getByText('₹1.5Cr')).toBeInTheDocument();
  });

  it('flags a zone whose accounts carry no city', () => {
    render(
      <GeographyTable
        zones={[zone({ unknownCityCount: 4 })]}
        unmapped={NO_UNMAPPED}
      />,
    );
    expect(screen.getByText('4 without a city')).toBeInTheDocument();
  });

  it('is not expandable when a zone has no cities', () => {
    render(<GeographyTable zones={[zone({ cities: [] })]} unmapped={NO_UNMAPPED} />);
    expect(screen.queryByRole('button', { name: /expand/i })).not.toBeInTheDocument();
  });

  it('falls back to an empty state when there is nothing in scope', () => {
    render(<GeographyTable zones={[]} unmapped={NO_UNMAPPED} />);
    expect(screen.getByText('No customers in scope')).toBeInTheDocument();
  });
});
