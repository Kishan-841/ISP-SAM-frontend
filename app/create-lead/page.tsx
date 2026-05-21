import { redirect } from 'next/navigation';
import { CreateLeadForm } from '../../components/create-lead-form';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { listBdms, type BdmAssignable } from '../../services/leads';
import { env } from '../../lib/env';

export const dynamic = 'force-dynamic';

export default async function CreateLeadPage() {
  if (!env.leadDispatchEnabled) {
    redirect('/');
  }
  const cookieHeader = await getCookieHeader();
  // Best-effort fetch — if CRM is down we still render the form with a
  // "couldn't load BDMs, try again" state so the operator isn't blocked
  // at the door.
  let bdms: BdmAssignable[];
  let bdmFetchError: string | null = null;
  try {
    const data = await listBdms({ cookieHeader });
    bdms = data.bdms;
  } catch (err) {
    bdms = [];
    bdmFetchError =
      err instanceof Error ? err.message : 'Could not reach CRM to load BDM list';
  }
  return <CreateLeadForm bdms={bdms} bdmFetchError={bdmFetchError} />;
}
