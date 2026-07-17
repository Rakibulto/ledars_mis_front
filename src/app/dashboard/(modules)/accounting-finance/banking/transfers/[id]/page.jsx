import TransferDetail from '../../../_components/banking/transfer-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <TransferDetail id={id} />;
}
