import ReceivableDetail from '../../../_components/receivables/receivable-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <ReceivableDetail mode="follow-up" id={id} />;
}
