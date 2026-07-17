'use client';

import React, { useMemo, useState } from 'react';

import { ProjectContext } from './project-context';

export default function ProjectProvider({ children }) {
  const [showModuleName, setShowModuleName] = useState(null);
  const [moduleHeader, setModuleHeader] = useState(null);
  const [navOpen, setNavOpen] = useState(false);

  const memorizedValue = useMemo(
    () => ({
      showModuleName,
      setShowModuleName,
      moduleHeader,
      setModuleHeader,
      navOpen,
      setNavOpen,
    }),
    [showModuleName, setShowModuleName, moduleHeader, setModuleHeader, navOpen, setNavOpen]
  );

  return <ProjectContext.Provider value={memorizedValue}>{children}</ProjectContext.Provider>;
}
