import ReconciliationDetail from '../../../_components/banking/reconciliation-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <ReconciliationDetail id={id} />;
}
