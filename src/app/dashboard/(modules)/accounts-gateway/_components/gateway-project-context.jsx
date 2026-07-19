'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import useSWR from 'swr';

import { fetcher, endpoints } from 'src/utils/axios';

import {
  GATEWAY_PROJECT_STORAGE_KEY,
  notifyGatewayProjectChange,
  readGatewayProjectId,
} from './gateway-project-storage';

export {
  GATEWAY_PROJECT_STORAGE_KEY,
  GATEWAY_PROJECT_CHANGE_EVENT,
  readGatewayProjectId,
  notifyGatewayProjectChange,
} from './gateway-project-storage';

const ProjectContext = createContext({
  projectId: null,
  setProjectId: () => {},
  project: null,
  projects: [],
  loading: false,
});

export function GatewayProjectProvider({ children }) {
  const [projectId, setProjectIdState] = useState(() => readGatewayProjectId());

  const { data, isLoading } = useSWR(
    `${endpoints.projectManagements.projects}?page_size=200&ordering=title`,
    fetcher
  );

  const projects = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  }, [data]);

  const setProjectId = useCallback((id) => {
    const next = id == null || id === '' ? null : Number(id);
    setProjectIdState(next);
    if (typeof window !== 'undefined') {
      if (next) window.localStorage.setItem(GATEWAY_PROJECT_STORAGE_KEY, String(next));
      else window.localStorage.removeItem(GATEWAY_PROJECT_STORAGE_KEY);
      notifyGatewayProjectChange(next);
    }
  }, []);

  useEffect(() => {
    if (!projectId || projects.length === 0) return;
    if (!projects.some((p) => p.id === projectId)) {
      setProjectId(null);
    }
  }, [projectId, projects, setProjectId]);

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) || null,
    [projects, projectId]
  );

  const value = useMemo(
    () => ({
      projectId,
      setProjectId,
      project,
      projects,
      loading: isLoading,
    }),
    [projectId, setProjectId, project, projects, isLoading]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useGatewayProject() {
  return useContext(ProjectContext);
}
