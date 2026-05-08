'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  UserPlus,
  UserX,
  Building2,
  Hash,
  Search,
  Check,
  Mail,
  ArrowRight,
  Users as UsersIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  assignAccount,
  getTeam,
  type Account,
  type TeamMember,
} from '../services/accounts';
import { formatRupeesCompact } from '../lib/format-rupees';

export function AssignCustomerModal({
  account,
  open,
  onOpenChange,
}: {
  account: Account | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [selectedSamId, setSelectedSamId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSearch('');
    setSelectedSamId(account?.samOwnerId ?? '');
    setLoadingTeam(true);
    getTeam()
      .then((t) => setTeam(t))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load team'))
      .finally(() => setLoadingTeam(false));
  }, [open, account?.samOwnerId]);

  const filteredTeam = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return team;
    return team.filter(
      (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
    );
  }, [team, search]);

  if (!account) return null;

  async function submit(target: string | null) {
    if (!account) return;
    setSubmitting(true);
    setError(null);
    try {
      await assignAccount(account.id, target);
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  }

  const isCurrentlyAssigned = !!account.samOwnerId;
  const customerLabel = account.companyName || account.clientName;
  const isUnchanged = selectedSamId === (account.samOwnerId ?? '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center ring-1 ring-orange-200/50 flex-shrink-0">
              <UserPlus className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isCurrentlyAssigned ? 'Reassign customer' : 'Assign customer'}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs">
                {isCurrentlyAssigned
                  ? 'Move this customer to a different SAM on your team.'
                  : 'Pick a SAM from your team to take ownership.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body — soft tinted background so the cards inside have something to sit on */}
        <div className="bg-gray-50/60 px-6 py-5 flex flex-col gap-4">
          {/* Customer summary card */}
          <div className="rounded-xl bg-white ring-1 ring-gray-200 p-3.5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 ring-1 ring-gray-200 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {customerLabel}
                  </span>
                  {account.customerCode && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-brand-600 bg-orange-50 px-1.5 py-0.5 rounded">
                      <Hash className="w-2.5 h-2.5" />
                      {account.customerCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  {account.bandwidthMbps != null && <span>{account.bandwidthMbps} Mbps</span>}
                  {account.bandwidthMbps != null && <span className="text-gray-300">·</span>}
                  <span className="font-medium text-gray-700">
                    {formatRupeesCompact(Number(account.currentArc))} ARC
                  </span>
                  {account.kittyType && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="uppercase tracking-wider font-semibold text-[10px] text-emerald-600">
                        {account.kittyType}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {account.samOwner && (
              <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex items-center gap-2 text-xs flex-wrap">
                <span className="text-gray-500">Currently with</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 ring-1 ring-gray-200 font-medium text-gray-700">
                  <Avatar name={account.samOwner.name} size="xs" />
                  {account.samOwner.name}
                </span>
                <ArrowRight className="w-3 h-3 text-gray-400" />
                <span className="text-gray-500 italic">selecting new owner…</span>
              </div>
            )}
          </div>

          {/* SAM picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Pick a SAM
              </label>
              {team.length > 0 && (
                <span className="text-[11px] text-gray-400">
                  {team.length} {team.length === 1 ? 'member' : 'members'}
                </span>
              )}
            </div>

            {team.length > 5 && (
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="pl-9 h-9 text-sm bg-white"
                />
              </div>
            )}

            <div className="rounded-xl bg-white ring-1 ring-gray-200 max-h-72 overflow-y-auto">
              {loadingTeam ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading team…
                </div>
              ) : filteredTeam.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  {team.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <UsersIcon className="w-6 h-6 text-gray-300" />
                      <div>
                        <div className="font-medium text-gray-700">No SAMs available</div>
                        <div className="text-xs mt-0.5">Add SAMs in Users first.</div>
                      </div>
                    </div>
                  ) : (
                    'No matches.'
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {filteredTeam.map((m) => {
                    const isSelected = selectedSamId === m.id;
                    const isCurrent = m.id === account?.samOwnerId;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedSamId(m.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected ? 'bg-orange-50/70' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Avatar name={m.name} size="md" tone={isSelected ? 'brand' : 'gray'} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {m.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 truncate mt-0.5">
                              <Mail className="w-3 h-3 flex-shrink-0" />
                              {m.email}
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-8 bg-white border-t border-gray-100 flex flex-row sm:flex-row sm:justify-between items-center gap-2">
          {isCurrentlyAssigned ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              disabled={submitting}
              onClick={() => submit(null)}
            >
              <UserX className="w-4 h-4 mr-1.5" />
              Unassign
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-b from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm ring-1 ring-brand-700/20 min-w-[140px]"
              disabled={!selectedSamId || submitting || isUnchanged}
              onClick={() => submit(selectedSamId)}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : isCurrentlyAssigned ? (
                'Reassign'
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const AVATAR_COLORS = [
  'from-rose-500 to-rose-600',
  'from-orange-500 to-orange-600',
  'from-amber-500 to-amber-600',
  'from-emerald-500 to-emerald-600',
  'from-cyan-500 to-cyan-600',
  'from-blue-500 to-blue-600',
  'from-indigo-500 to-indigo-600',
  'from-purple-500 to-purple-600',
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function Avatar({
  name,
  size = 'md',
  tone = 'brand',
}: {
  name: string;
  size?: 'xs' | 'md';
  tone?: 'brand' | 'gray';
}) {
  const sizing = size === 'xs' ? 'w-4 h-4 text-[8px]' : 'w-9 h-9 text-xs';
  const gradient = tone === 'brand' ? colorFor(name) : 'from-gray-400 to-gray-500';
  return (
    <div
      className={`${sizing} rounded-full bg-gradient-to-br ${gradient} text-white font-semibold flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm`}
    >
      {initials(name)}
    </div>
  );
}
