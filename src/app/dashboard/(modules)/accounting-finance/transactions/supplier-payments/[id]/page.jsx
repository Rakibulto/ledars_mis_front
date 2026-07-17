import SupplierPaymentDetail from '../../../_components/transactions/supplier-payment-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <SupplierPaymentDetail paymentId={id} />;
}
