import ReceivableDetail from '../../../_components/receivables/receivable-detail';

export default async function Page({ params }) {
  const { bucket } = await params;
  return <ReceivableDetail mode="bucket" id={bucket} />;
}
