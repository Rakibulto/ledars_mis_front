import { CONFIG } from 'src/config-global';
import TodoListPage from 'src/sections/todo/todo-list-page';

export const metadata = { title: `Todo List | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <TodoListPage />;
}
