import BudgetPlanDetail from '../../../_components/budgets/plan-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <BudgetPlanDetail budgetId={id} />;
}
