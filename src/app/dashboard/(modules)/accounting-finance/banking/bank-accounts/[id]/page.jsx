import BankAccountDetail from '../../../_components/banking/bank-account-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <BankAccountDetail id={id} />;
}
