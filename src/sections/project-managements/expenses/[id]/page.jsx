import ExpenseDetail from '../../_components/expense-detail';

export default async function Page({ params }) {
  const { id } = await params;

  return <ExpenseDetail expenseId={id} />;
}
