import GeneralLedgerItemDetail from '../../../../_components/transactions/general-ledger-item-detail';

export default async function Page({ params }) {
  const { itemId } = await params;
  return <GeneralLedgerItemDetail itemId={itemId} />;
}
