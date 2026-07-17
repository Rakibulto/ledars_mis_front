'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useTabs } from 'src/hooks/use-tabs';

import { DashboardContent } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { MySpaceView } from '../my-space-view';
import { OverviewAppView } from '../overview-app-view';

export function WorkspaceTabs() {
  const { user } = useAuthContext();

  const tabs = useTabs('workspace');

  if (user?.role === 'Employee' || user?.role === 'Supervisor')
    return (
      <DashboardContent>
        <MySpaceView />
      </DashboardContent>
    );

  return (
    <DashboardContent>
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabs.value} onChange={tabs.onChange}>
          <Tab value="myspace" label="My Space" />
          <Tab value="workspace" label="Subordinate Space" />
        </Tabs>
      </Box>

      {tabs.value === 'workspace' && <OverviewAppView />}
      {tabs.value === 'myspace' && <MySpaceView />}
    </DashboardContent>
  );
}
