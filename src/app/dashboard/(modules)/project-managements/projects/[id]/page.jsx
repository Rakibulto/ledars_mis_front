import ProjectDetail from '../../_components/project-detail';

export default async function Page({ params }) {
  const { id } = await params;

  return <ProjectDetail projectId={id} />;
}
