import ProjectForm from '../../../_components/project-form';

export default async function Page({ params }) {
  const { id } = await params;

  return <ProjectForm mode="edit" projectId={id} />;
}
