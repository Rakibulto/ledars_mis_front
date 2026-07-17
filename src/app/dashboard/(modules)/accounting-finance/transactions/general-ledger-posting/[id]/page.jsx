import GeneralLedgerAccountDetail from '../../../_components/transactions/general-ledger-account-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <GeneralLedgerAccountDetail accountId={id} />;
}
