import TaskAssignmentDetail from '../../../../_components/task-assignment-detail';

export default async function Page({ params }) {
  const { projectId, taskId } = await params;

  return <TaskAssignmentDetail projectId={projectId} taskId={taskId} />;
}
