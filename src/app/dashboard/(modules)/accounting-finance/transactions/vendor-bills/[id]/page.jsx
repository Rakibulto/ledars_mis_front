import BillDetail from '../../../_components/transactions/bill-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <BillDetail id={id} />;
}
