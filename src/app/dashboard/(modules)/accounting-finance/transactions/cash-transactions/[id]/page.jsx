import CashTransactionDetail from '../../../_components/transactions/cash-transaction-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <CashTransactionDetail transactionId={id} />;
}
