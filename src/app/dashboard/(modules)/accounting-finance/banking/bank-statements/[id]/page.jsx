import BankStatementDetail from '../../../_components/banking/bank-statement-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <BankStatementDetail id={id} />;
}
