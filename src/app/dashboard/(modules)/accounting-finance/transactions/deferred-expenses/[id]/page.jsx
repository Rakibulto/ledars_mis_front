import DeferredExpenseDetail from '../../../_components/transactions/deferred-expense-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <DeferredExpenseDetail recordId={id} />;
}
