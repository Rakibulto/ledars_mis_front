import InvoiceDetail from '../../../_components/transactions/invoice-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <InvoiceDetail id={id} />;
}
