import { redirect } from 'next/navigation';
import { CreateLeadForm } from '../../components/create-lead-form';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { listBdms, type BdmAssignable } from '../../services/leads';
import { env } from '../../lib/env';

export const dynamic = 'force-dynamic';

export default async function CreateLeadPage() {
  // Either destination being on is enough to reach the page; the form offers
  // whichever are enabled.
  if (!env.leadDispatchEnabled && !env.mspLeadsEnabled) {
    redirect('/');
  }
  const cookieHeader = await getCookieHeader();

  // The BDM list is an ILL concern — an MSP lead is assigned by their team
  // lead, so don't call the CRM for it when only MSP is on.
  let bdms: BdmAssignable[] = [];
  let bdmFetchError: string | null = null;
  if (env.leadDispatchEnabled) {
    // Best-effort fetch — if CRM is down we still render the form with a
    // "couldn't load BDMs, try again" state so the operator isn't blocked
    // at the door.
    try {
      const data = await listBdms({ cookieHeader });
      bdms = data.bdms;
    } catch (err) {
      bdmFetchError =
        err instanceof Error ? err.message : 'Could not reach CRM to load BDM list';
    }
  }
  return (
    <CreateLeadForm
      bdms={bdms}
      bdmFetchError={bdmFetchError}
      illEnabled={env.leadDispatchEnabled}
      mspEnabled={env.mspLeadsEnabled}
    />
  );
}
