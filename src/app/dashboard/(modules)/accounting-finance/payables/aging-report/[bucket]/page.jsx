import PayableDetail from '../../../_components/payables/payable-detail';

export default async function Page({ params }) {
  const { bucket } = await params;
  return <PayableDetail mode="bucket" id={bucket} />;
}
