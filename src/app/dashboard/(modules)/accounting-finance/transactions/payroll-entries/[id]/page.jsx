import PayrollEntryDetail from '../../../_components/transactions/payroll-entry-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <PayrollEntryDetail entryId={id} />;
}
