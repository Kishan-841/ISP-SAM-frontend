'use client';

import { Fragment, useState } from 'react';
import { ChevronRight, MapPin, Building2 } from 'lucide-react';
import type { GeoZoneRow } from '../services/geography';
import { formatRupees, formatRupeesCompact } from '../lib/format-rupees';

/**
 * Zone table with the cities under each zone expandable in place.
 * Doubles as the chart's table view (accessibility: identity never rests on
 * colour alone, and every exact figure is readable here).
 */
export function GeographyTable({
  zones,
  unmapped,
}: {
  zones: GeoZoneRow[];
  unmapped: { customerCount: number; totalArc: number };
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(name: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  if (zones.length === 0 && unmapped.customerCount === 0) {
    return (
      <div className="bg-white rounded-xl ring-1 ring-gray-200 p-8 text-center">
        <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-700">No customers in scope</p>
        <p className="text-xs text-gray-500 mt-1">Nothing to break down by zone yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl ring-1 ring-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[780px]">
          <thead className="bg-gray-50/60 border-b border-gray-100">
            <tr>
              <Th>Zone / City</Th>
              <Th align="right">Customers</Th>
              <Th align="right">Base</Th>
              <Th align="right">New</Th>
              <Th align="right">ARC</Th>
              <Th align="right">Avg / customer</Th>
              <Th align="right">Share</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {zones.map((z) => {
              const expanded = open.has(z.name);
              const expandable = z.cities.length > 0;
              return (
                <Fragment key={z.name}>
                  <tr
                    className={`transition-colors ${expandable ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                    onClick={expandable ? () => toggle(z.name) : undefined}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {expandable ? (
                          <button
                            type="button"
                            aria-label={expanded ? `Collapse ${z.name}` : `Expand ${z.name}`}
                            aria-expanded={expanded}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(z.name);
                            }}
                            className="p-0.5 -ml-1 rounded hover:bg-gray-200 text-gray-400 transition-colors"
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                            />
                          </button>
                        ) : (
                          <span className="w-5" />
                        )}
                        <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span className="font-medium text-gray-900">{z.name}</span>
                        {expandable && (
                          <span className="text-[11px] text-gray-400">
                            {z.cities.length} cit{z.cities.length === 1 ? 'y' : 'ies'}
                          </span>
                        )}
                        {z.unknownCityCount > 0 && (
                          <span className="text-[11px] text-amber-600">
                            {z.unknownCityCount} without a city
                          </span>
                        )}
                      </div>
                    </td>
                    <Td>{z.customerCount}</Td>
                    <Td muted>{z.baseCount}</Td>
                    <Td muted>{z.newCount}</Td>
                    <Td title={formatRupees(z.totalArc)}>{formatRupeesCompact(z.totalArc)}</Td>
                    <Td muted title={formatRupees(z.avgArc)}>
                      {formatRupeesCompact(z.avgArc)}
                    </Td>
                    <Td muted>{z.arcSharePercent}%</Td>
                  </tr>
                  {expanded &&
                    z.cities.map((c) => (
                      <tr key={`${z.name}/${c.name}`} className="bg-gray-50/40">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2 pl-[30px]">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="text-gray-700">{c.name}</span>
                          </div>
                        </td>
                        <Td small>{c.customerCount}</Td>
                        <Td small muted>
                          {c.baseCount}
                        </Td>
                        <Td small muted>
                          {c.newCount}
                        </Td>
                        <Td small title={formatRupees(c.totalArc)}>
                          {formatRupeesCompact(c.totalArc)}
                        </Td>
                        <Td small muted title={formatRupees(c.avgArc)}>
                          {formatRupeesCompact(c.avgArc)}
                        </Td>
                        <Td small muted>
                          {c.arcSharePercent}%
                        </Td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}

            {/* Unmapped is a row, not an omission — it's the backfill's to-do list. */}
            {unmapped.customerCount > 0 && (
              <tr className="bg-amber-50/40">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5" />
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700">Not mapped yet</span>
                    <span className="text-[11px] text-gray-500">no zone from the CRM</span>
                  </div>
                </td>
                <Td>{unmapped.customerCount}</Td>
                <Td muted>—</Td>
                <Td muted>—</Td>
                <Td title={formatRupees(unmapped.totalArc)}>
                  {formatRupeesCompact(unmapped.totalArc)}
                </Td>
                <Td muted>—</Td>
                <Td muted>—</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-900 whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
  small,
  title,
}: {
  children: React.ReactNode;
  muted?: boolean;
  small?: boolean;
  title?: string;
}) {
  return (
    <td
      title={title}
      className={`px-5 text-right tabular-nums whitespace-nowrap ${small ? 'py-2.5' : 'py-3.5'} ${
        muted ? 'text-gray-600' : 'font-medium text-gray-900'
      }`}
    >
      {children}
    </td>
  );
}
