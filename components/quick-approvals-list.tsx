'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Inbox,
  UserCircle2,
  Wifi,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusPill } from './status-pill';
import { toast } from 'sonner';
import {
  samQuickDecision,
  type PendingQuickApproval,
} from '../services/commercial-changes';
import { formatRupees } from '../lib/format-rupees';

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d).toLowerCase();
}

export function QuickApprovalsList({ items }: { items: PendingQuickApproval[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-700">All clear</p>
          <p className="text-xs text-gray-500 mt-1">
            No pending quick-disconnect requests on existing-base customers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <ApprovalRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ApprovalRow({ item }: { item: PendingQuickApproval }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const customerName = item.account.companyName || item.account.clientName;
  const samName = item.account.samOwner?.name ?? 'Unassigned';
  const days = item.quickRequestedDays ?? 1;
  const daysLabel =
    days === 0 ? 'immediately' : `in ${days} day${days === 1 ? '' : 's'}`;

  async function decide(decision: 'APPROVE' | 'REJECT') {
    setPending(decision);
    setError(null);
    try {
      await samQuickDecision(item.id, decision, note.trim() || undefined);
      toast.success(
        decision === 'APPROVE'
          ? `Approved — ${customerName} will terminate ${daysLabel}.`
          : `Rejected — ${customerName} stays active.`,
        { duration: 6000 },
      );
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Decision failed';
      setError(msg);
      toast.error('Decision failed', { description: msg, duration: 8000 });
      setPending(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[1fr_auto] gap-0">
          {/* Left: context */}
          <div className="p-5 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-100">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/customers/${item.account.id}/details`}
                  className="text-base font-semibold text-gray-900 hover:text-brand-600"
                >
                  {customerName}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                  {item.account.customerCode && (
                    <span className="font-mono text-brand-600">{item.account.customerCode}</span>
                  )}
                  {item.account.circuitId && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Wifi className="w-3 h-3 text-gray-400" />
                      {item.account.circuitId}
                    </span>
                  )}
                  <StatusPill tone="orange">{item.account.kittyType}</StatusPill>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">
                  Current ARC
                </div>
                <div className="text-base font-bold text-brand-600 tabular-nums">
                  {formatRupees(item.oldArc)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <Meta icon={UserCircle2} label="Requested by">
                {samName}
              </Meta>
              <Meta icon={Calendar} label="Requested at">
                {fmtTime(item.requestedAt)}
              </Meta>
              <Meta icon={AlertTriangle} label="Time to terminate">
                <span className="font-semibold text-red-600">
                  {days === 0 ? 'Immediate' : `${days} day${days === 1 ? '' : 's'}`}
                </span>
              </Meta>
            </div>

            {item.quickApprovalReason && (
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1">
                  Justification from SAM
                </div>
                <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {item.quickApprovalReason}
                </p>
              </div>
            )}
            {item.disconnectionReason && (
              <div className="text-xs text-gray-500">
                <span className="font-semibold uppercase tracking-wider">Category:</span>{' '}
                {item.disconnectionReason}
              </div>
            )}
          </div>

          {/* Right: decision controls */}
          <div className="p-5 bg-gray-50/60 flex flex-col gap-3 md:w-80">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] uppercase tracking-wider font-semibold text-gray-500">
                Note (optional)
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Visible in the audit log + on the customer journey"
                disabled={pending !== null}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => decide('APPROVE')}
                disabled={pending !== null}
                className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                {pending === 'APPROVE'
                  ? 'Approving…'
                  : days === 0
                    ? 'Approve — terminate immediately'
                    : `Approve — terminate in ${days}d`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => decide('REJECT')}
                disabled={pending !== null}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300 gap-1.5"
              >
                <X className="w-4 h-4" />
                {pending === 'REJECT' ? 'Rejecting…' : 'Reject — keep active'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-0.5">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-gray-900">{children}</div>
    </div>
  );
}
