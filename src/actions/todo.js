import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

export const fetchTodos = async (params = {}) => {
  const { data } = await axiosInstance.get(endpoints.todo.list, { params });
  return data;
};

export const fetchTodo = async (id) => {
  const { data } = await axiosInstance.get(endpoints.todo.byId(id));
  return data;
};

export const createTodo = async (payload) => {
  const { data } = await axiosInstance.post(endpoints.todo.root, payload);
  return data;
};

export const updateTodo = async (id, payload) => {
  const { data } = await axiosInstance.put(endpoints.todo.byId(id), payload);
  return data;
};

export const patchTodoStatus = async (id, payload) => {
  const { data } = await axiosInstance.patch(endpoints.todo.byId(id), payload);
  return data;
};

export const deleteTodo = async (id) => {
  const { data } = await axiosInstance.delete(endpoints.todo.byId(id));
  return data;
};

export const fetchTodoSummary = async () => {
  const { data } = await axiosInstance.get(endpoints.todo.summary);
  return data;
};

export const fetchTodoUsers = async (search = '') => {
  const { data } = await axiosInstance.get(endpoints.todo.users, {
    params: { search },
  });
  return data;
};

// ── Attachment API ───────────────────────────────────────────────────

export const fetchTodoAttachments = async (todoId, params = {}) => {
  const { data } = await axiosInstance.get(endpoints.todo.attachments(todoId), { params });
  return data;
};

export const createTodoAttachment = async (todoId, formData) => {
  const { data } = await axiosInstance.post(endpoints.todo.attachments(todoId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const updateTodoAttachment = async (todoId, attachmentId, formData) => {
  const { data } = await axiosInstance.put(
    endpoints.todo.attachmentById(todoId, attachmentId),
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data;
};

export const deleteTodoAttachment = async (todoId, attachmentId) => {
  const { data } = await axiosInstance.delete(endpoints.todo.attachmentById(todoId, attachmentId));
  return data;
};
