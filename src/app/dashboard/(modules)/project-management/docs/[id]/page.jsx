import { DocDetail } from '../../_components/docs/detail';

export default function Page({ params }) {
  return <DocDetail id={params.id} />;
}
