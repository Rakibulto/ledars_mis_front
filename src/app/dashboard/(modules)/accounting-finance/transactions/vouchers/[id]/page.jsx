import VoucherDetail from '../../../_components/transactions/voucher-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <VoucherDetail voucherId={id} />;
}
