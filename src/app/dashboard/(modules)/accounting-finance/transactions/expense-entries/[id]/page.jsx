import ExpenseEntryDetail from '../../../_components/transactions/expense-entry-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <ExpenseEntryDetail entryId={id} />;
}
