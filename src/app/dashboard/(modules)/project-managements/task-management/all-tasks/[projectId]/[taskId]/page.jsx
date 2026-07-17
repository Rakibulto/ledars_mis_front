import TaskStepDetail from '../../../../_components/task-step-detail';

export default async function Page({ params }) {
  const { projectId, taskId } = await params;

  return <TaskStepDetail projectId={projectId} taskId={taskId} />;
}
