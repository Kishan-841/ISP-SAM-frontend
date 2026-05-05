import { getAccounts } from '../../services/accounts';
import {
  getDisconnectionReasons,
  type DisconnectionCategory,
} from '../../services/commercial-changes';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { CommercialChangeForm } from '../../components/commercial-change-form';

export default async function CommercialChangePage() {
  const cookieHeader = await getCookieHeader();
  const [{ accounts }, reasons] = await Promise.all([
    getAccounts({}, { cookieHeader }),
    // Best-effort — when the CRM bridge isn't configured, the endpoint
    // returns whatever the stub holds (likely empty). The form gracefully
    // disables the disconnection flow when categories list is empty.
    getDisconnectionReasons({ cookieHeader }).catch(
      () => ({ reasons: [] as DisconnectionCategory[] }),
    ),
  ]);
  return (
    <CommercialChangeForm
      accounts={accounts}
      disconnectionCategories={reasons.reasons}
    />
  );
}
