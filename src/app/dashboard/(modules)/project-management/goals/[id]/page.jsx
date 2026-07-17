import { GoalDetail } from '../../_components/goals/detail';

export default function Page({ params }) {
  return <GoalDetail id={params.id} />;
}
