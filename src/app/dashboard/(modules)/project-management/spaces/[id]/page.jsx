import { SpaceDetail } from '../../_components/spaces/detail';

export default function Page({ params }) {
  return <SpaceDetail id={params.id} />;
}
