import { CONFIG } from 'src/config-global';
import TodoCreatePage from 'src/sections/todo/todo-create-page';

export const metadata = { title: `Create Todo | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <TodoCreatePage />;
}
