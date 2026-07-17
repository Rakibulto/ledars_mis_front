import { WorkspaceDetail } from '../../_components/workspaces/detail';

export default function Page({ params }) {
  return <WorkspaceDetail id={params.id} />;
}
