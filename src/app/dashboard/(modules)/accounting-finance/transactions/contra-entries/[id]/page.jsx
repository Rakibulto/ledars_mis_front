import ContraEntryDetail from '../../../_components/transactions/contra-entry-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <ContraEntryDetail entryId={id} />;
}
