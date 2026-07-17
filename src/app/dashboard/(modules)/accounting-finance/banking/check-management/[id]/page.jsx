import CheckDetail from '../../../_components/banking/check-detail';

export default async function Page({ params }) {
  const { id } = await params;
  return <CheckDetail id={id} />;
}
