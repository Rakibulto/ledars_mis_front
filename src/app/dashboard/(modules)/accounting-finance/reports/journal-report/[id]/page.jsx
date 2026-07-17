import JournalReportEntryDetail from '../../../_components/reports/journal-report-entry-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <JournalReportEntryDetail entryId={id} />;
}
