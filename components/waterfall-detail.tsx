import { DataGrid, type Column } from './data-grid';

export type WaterfallDetailInput = {
  startArcRupees: number;
  upgradesArcRupees: number;       // positive magnitude
  downgradesArcRupees: number;     // positive magnitude
  rateRevisionsArcRupees: number;  // positive magnitude
  terminationsArcRupees: number;   // positive magnitude
  endArcRupees: number;
};

type WaterfallRow = {
  label: string;
  arc: number;
  mrr: number;
  tone: 'neutral' | 'positive' | 'negative' | 'final';
  sign?: '+' | '−' | '=';
};

export function WaterfallDetail({ input }: { input: WaterfallDetailInput }) {
  const rows: WaterfallRow[] = [
    { label: 'Start of Period', arc: input.startArcRupees, mrr: input.startArcRupees / 12, tone: 'neutral' },
    { label: 'Upgrades', arc: input.upgradesArcRupees, mrr: input.upgradesArcRupees / 12, tone: 'positive', sign: '+' },
    { label: 'Downgrades', arc: input.downgradesArcRupees, mrr: input.downgradesArcRupees / 12, tone: 'negative', sign: '−' },
    { label: 'Rate Revisions (↓)', arc: input.rateRevisionsArcRupees, mrr: input.rateRevisionsArcRupees / 12, tone: 'negative', sign: '−' },
    { label: 'Terminations', arc: input.terminationsArcRupees, mrr: input.terminationsArcRupees / 12, tone: 'negative', sign: '−' },
    { label: 'End of Period', arc: input.endArcRupees, mrr: input.endArcRupees / 12, tone: 'final', sign: '=' },
  ];

  const toneClass: Record<WaterfallRow['tone'], string> = {
    neutral: 'text-brand-600',
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    final: 'text-gray-900 font-semibold',
  };

  const columns: Column<WaterfallRow>[] = [
    {
      key: 'component',
      header: 'Component',
      cell: (row) => (
        <span className={toneClass[row.tone]}>
          {row.sign && <span className="mr-1">{row.sign}</span>}
          {row.label}
        </span>
      ),
    },
    {
      key: 'arc',
      header: 'ARC (annualized)',
      align: 'right',
      cell: (row) => (
        <span className={row.tone === 'final' ? 'text-gray-900 font-semibold' : toneClass[row.tone]}>
          {formatRupees(row.arc)}
        </span>
      ),
    },
    {
      key: 'mrr',
      header: 'MRR (monthly)',
      align: 'right',
      cell: (row) => (
        <span className={row.tone === 'final' ? 'text-gray-900 font-semibold' : 'text-gray-600'}>
          {formatRupees(row.mrr)}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <DataGrid columns={columns} rows={rows} rowKey={(r) => r.label} />
    </div>
  );
}

function formatRupees(v: number): string {
  if (v === 0) return '₹0';
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
