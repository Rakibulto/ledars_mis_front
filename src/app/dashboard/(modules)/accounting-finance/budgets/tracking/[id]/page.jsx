import BudgetTrackingDetail from '../../../_components/budgets/tracking-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <BudgetTrackingDetail budgetId={id} />;
}
