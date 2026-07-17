import DebitNoteDetail from '../../../_components/transactions/debit-note-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <DebitNoteDetail noteId={id} />;
}
