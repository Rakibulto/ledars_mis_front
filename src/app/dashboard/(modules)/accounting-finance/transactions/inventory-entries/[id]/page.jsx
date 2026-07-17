import InventoryEntryDetail from '../../../_components/transactions/inventory-entry-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <InventoryEntryDetail entryId={id} />;
}
