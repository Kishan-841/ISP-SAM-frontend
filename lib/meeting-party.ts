import type { MeetingRow } from '../services/meetings';

/**
 * Who a meeting was with, in the one shape the meeting UI needs.
 *
 * A meeting is either with a customer (account) or with a prospect — a
 * company typed in by the SAM that is not in SAM yet. A prospect has nothing
 * to link to and no customer code / circuit / kitty, so those come back null
 * and the UI shows a "Prospect" chip in their place.
 */
export type MeetingParty = {
  name: string;
  /** Customer page link, or null for a prospect. */
  href: string | null;
  /** Contact person — only prospects carry one on the meeting itself. */
  contact: string | null;
  isProspect: boolean;
  customerCode: string | null;
  circuitId: string | null;
  kittyType: 'BASE' | 'NEW' | null;
  samOwnerName: string | null;
  /** Everything worth matching when the list is filtered by a search box. */
  searchText: string;
};

export function meetingParty(meeting: MeetingRow): MeetingParty {
  const account = meeting.account;
  if (account) {
    return {
      name: account.companyName || account.clientName,
      href: `/customers/${account.id}`,
      contact: null,
      isProspect: false,
      customerCode: account.customerCode,
      circuitId: account.circuitId,
      kittyType: account.kittyType,
      samOwnerName: account.samOwner?.name ?? null,
      searchText: [
        account.companyName,
        account.clientName,
        account.customerCode,
        account.circuitId,
        account.samOwner?.name,
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  const company = meeting.prospectCompany ?? 'Prospect';
  const contact = meeting.prospectContactName ?? null;
  return {
    name: company,
    href: null,
    contact,
    isProspect: true,
    customerCode: null,
    circuitId: null,
    kittyType: null,
    samOwnerName: meeting.createdByUser?.name ?? null,
    searchText: [company, contact, meeting.prospectEmail, meeting.createdByUser?.name]
      .filter(Boolean)
      .join(' '),
  };
}
