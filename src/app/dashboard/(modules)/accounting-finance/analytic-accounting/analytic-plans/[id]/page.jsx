import AnalyticPlanDetail from '../../../_components/analytic-accounting/analytic-plan-detail';

export const metadata = { title: 'Analytic Plan Detail' };

export default async function Page({ params }) {
  const { id } = await params;
  return <AnalyticPlanDetail planId={id} />;
}
