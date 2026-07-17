'use client';

import { useContext } from 'react';

import { ProjectContext } from '../context/project-context';

export default function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useAuthContext: Context must be used inside AuthProvider');
  }
  return context;
}
