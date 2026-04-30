import { getAccounts } from '../../services/accounts';
import { getCookieHeader } from '../../lib/get-cookie-header';
import { CommercialChangeForm } from '../../components/commercial-change-form';

export default async function CommercialChangePage() {
  const cookieHeader = await getCookieHeader();
  const { accounts } = await getAccounts({}, { cookieHeader });
  return <CommercialChangeForm accounts={accounts} />;
}
