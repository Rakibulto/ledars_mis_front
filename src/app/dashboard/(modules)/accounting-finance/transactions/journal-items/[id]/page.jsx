import JournalItemDetail from '../../../_components/transactions/journal-item-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <JournalItemDetail itemId={id} />;
}
