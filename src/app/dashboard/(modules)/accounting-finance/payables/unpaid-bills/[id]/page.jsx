import PayableDetail from '../../../_components/payables/payable-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <PayableDetail mode="bill" id={id} />;
}
