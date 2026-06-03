'use client';

import { useState } from 'react';
import { UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackfillDisconnectionDialog } from './backfill-disconnection-dialog';
import type { Account } from '../services/accounts';

/**
 * Admin-only button shown on /customers/[id]/details that opens the
 * backfill-disconnection modal. The parent decides whether to render
 * this — typically only when account.contractStatus !== 'TERMINATED'.
 */
export function BackfillDisconnectionButton({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300"
      >
        <UserMinus className="w-3.5 h-3.5" />
        Backfill disconnection
      </Button>
      <BackfillDisconnectionDialog
        account={account}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
