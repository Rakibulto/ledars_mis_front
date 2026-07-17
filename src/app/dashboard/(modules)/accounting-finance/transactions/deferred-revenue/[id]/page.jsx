import DeferredRevenueDetail from '../../../_components/transactions/deferred-revenue-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <DeferredRevenueDetail recordId={id} />;
}
