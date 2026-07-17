import JournalEntryDetail from '../../../_components/transactions/journal-entry-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <JournalEntryDetail id={id} />;
}
