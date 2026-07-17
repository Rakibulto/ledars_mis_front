import { ListDetail } from '../../_components/lists/detail';

export default function Page({ params }) {
  return <ListDetail id={params.id} />;
}
