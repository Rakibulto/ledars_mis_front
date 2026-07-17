import TaskDetail from '../../_components/tasks/detail';

export default function Page({ params }) {
  return <TaskDetail id={params.id} />;
}
