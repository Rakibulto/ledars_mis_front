import BankDepositDetail from '../../../_components/transactions/bank-deposit-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <BankDepositDetail depositId={id} />;
}
