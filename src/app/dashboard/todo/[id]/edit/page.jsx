import { CONFIG } from 'src/config-global';
import TodoEditPage from 'src/sections/todo/todo-edit-page';

export const metadata = { title: `Edit Todo | Dashboard - ${CONFIG.appName}` };

export default async function Page({ params }) {
  const { id } = await params;
  return <TodoEditPage id={id} />;
}
