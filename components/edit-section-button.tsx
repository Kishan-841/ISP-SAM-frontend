'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import {
  EditCustomerSectionDialog,
  type EditSection,
} from './edit-customer-section-dialog';
import type { Account } from '../services/accounts';

/**
 * Small admin-only "Edit" pill that lives in the header of each section
 * card on /customers/[id]/details. Server components render this; only
 * the dialog's open-state is client-side.
 */
export function EditSectionButton({
  account,
  section,
}: {
  account: Account;
  section: EditSection;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md text-brand-600 hover:bg-orange-50 hover:text-brand-700 transition-colors"
        aria-label={`Edit ${section}`}
      >
        <Pencil className="w-3 h-3" />
        Edit
      </button>
      <EditCustomerSectionDialog
        account={account}
        section={section}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
