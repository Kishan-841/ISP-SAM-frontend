import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type WaterfallDetailInput = {
  startArcRupees: number;
  upgradesArcRupees: number;       // positive magnitude
  downgradesArcRupees: number;     // positive magnitude
  rateRevisionsArcRupees: number;  // positive magnitude
  terminationsArcRupees: number;   // positive magnitude
  endArcRupees: number;
};

export function WaterfallDetail({ input }: { input: WaterfallDetailInput }) {
  const rows: { label: string; arc: number; mrr: number; tone: 'neutral' | 'positive' | 'negative' | 'final'; sign?: '+' | '−' | '='; }[] = [
    { label: 'Start of Period', arc: input.startArcRupees, mrr: input.startArcRupees / 12, tone: 'neutral' },
    { label: 'Upgrades', arc: input.upgradesArcRupees, mrr: input.upgradesArcRupees / 12, tone: 'positive', sign: '+' },
    { label: 'Downgrades', arc: input.downgradesArcRupees, mrr: input.downgradesArcRupees / 12, tone: 'negative', sign: '−' },
    { label: 'Rate Revisions (↓)', arc: input.rateRevisionsArcRupees, mrr: input.rateRevisionsArcRupees / 12, tone: 'negative', sign: '−' },
    { label: 'Terminations', arc: input.terminationsArcRupees, mrr: input.terminationsArcRupees / 12, tone: 'negative', sign: '−' },
    { label: 'End of Period', arc: input.endArcRupees, mrr: input.endArcRupees / 12, tone: 'final', sign: '=' },
  ];

  const toneClass = {
    neutral: 'text-brand-600 underline-offset-2 hover:underline',
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    final: 'text-gray-900 font-semibold',
  } as const;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="text-xs uppercase tracking-wide text-gray-500">Component</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-gray-500">ARC (annualized)</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-gray-500">MRR (monthly)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label} className={row.tone === 'final' ? 'bg-gray-50' : ''}>
              <TableCell className={toneClass[row.tone]}>
                {row.sign && <span className="mr-1">{row.sign}</span>}
                {row.label}
              </TableCell>
              <TableCell className={row.tone === 'final' ? 'text-gray-900 font-semibold' : (row.tone === 'positive' ? 'text-emerald-600' : (row.tone === 'negative' ? 'text-red-600' : 'text-gray-900'))}>
                {formatRupees(row.arc)}
              </TableCell>
              <TableCell className={row.tone === 'final' ? 'text-gray-900 font-semibold' : 'text-gray-600'}>
                {formatRupees(row.mrr)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatRupees(v: number): string {
  if (v === 0) return '₹0';
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
