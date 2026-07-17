import CustomerReceiptDetail from '../../../_components/transactions/customer-receipt-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <CustomerReceiptDetail receiptId={id} />;
}
