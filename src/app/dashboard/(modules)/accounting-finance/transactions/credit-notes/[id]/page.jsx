import CreditNoteDetail from '../../../_components/transactions/credit-note-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <CreditNoteDetail noteId={id} />;
}
