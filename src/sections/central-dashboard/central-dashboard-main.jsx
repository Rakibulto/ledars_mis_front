'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useCentralDashboard } from './hooks/use-central-dashboard';

import WelcomeHeader, { WelcomeHeaderSkeleton } from './components/welcome-header';
import KpiCards from './components/kpi-cards';
import ChartsSection from './components/charts-section';
import RecentActivities from './components/recent-activities';
import TodaySchedule from './components/today-schedule';
import ModuleOverviewWidgets from './components/module-overview-widgets';
import QuickActions from './components/quick-actions';
import NotificationsPanel from './components/notifications-panel';
import RecentLists from './components/recent-lists';
import DashboardSkeleton from './components/dashboard-skeleton';
import DashboardError from './components/dashboard-error';

/**
 * Tabs group the original 9 sections into 4 logical views so the page
 * stays compact and scannable instead of one long vertical scroll.
 * No section/feature was removed — everything still renders, just grouped.
 */
const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'activity', label: 'Activity & Schedule' },
  { value: 'modules', label: 'Modules & Actions' },
  { value: 'records', label: 'Recent Records' },
];

function TabPanel({ value, current, children }) {
  const isActive = value === current;
  return (
    <Box role="tabpanel" hidden={!isActive} sx={{ mt: 3 }}>
      {isActive && children}
    </Box>
  );
}

export default function CentralDashboardMain() {
  const { data, isLoading, error } = useCentralDashboard();
  const [tab, setTab] = useState('overview');

  const kpis = useMemo(() => data?.kpis || null, [data]);
  const charts = useMemo(() => data?.charts || null, [data]);
  const activities = useMemo(() => data?.recent_activities || [], [data]);
  const schedule = useMemo(() => data?.today_schedule || [], [data]);
  const notifications = useMemo(() => data?.notifications || [], [data]);
  const recent = useMemo(() => data?.recent || {}, [data]);

  if (isLoading && !data) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <DashboardSkeleton />
      </Container>
    );
  }

  if (error && !data) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <WelcomeHeaderSkeleton />
          <DashboardError
            title="Failed to Load Dashboard"
            message={error?.message || 'Could not connect to the server. Please try again.'}
          />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <Stack spacing={3}>
        {/* Section 1: Welcome Header — always visible above the tabs */}
        <WelcomeHeader />

        {/* Tab navigation keeps related sections grouped and reduces scrolling */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tab}
            onChange={(_, next) => setTab(next)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            {TABS.map((t) => (
              <Tab key={t.value} value={t.value} label={t.label} sx={{ fontWeight: 600, minHeight: 48 }} />
            ))}
          </Tabs>
        </Box>

        {/* Overview: Section 2 (KPI Cards) + Section 3 (Charts) */}
        <TabPanel value="overview" current={tab}>
          <Stack spacing={3}>
            <KpiCards kpis={kpis} isLoading={isLoading} />
            <ChartsSection charts={charts} isLoading={isLoading} />
          </Stack>
        </TabPanel>

        {/* Activity & Schedule: Section 4 (Activities) + 5 (Schedule) + 8 (Notifications) */}
        <TabPanel value="activity" current={tab}>
          <Stack spacing={3}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <RecentActivities activities={activities} isLoading={isLoading} />
              </Grid>
              <Grid size={{ xs: 12, lg: 6 }}>
                <TodaySchedule schedule={schedule} isLoading={isLoading} />
              </Grid>
            </Grid>
            <NotificationsPanel notifications={notifications} isLoading={isLoading} />
          </Stack>
        </TabPanel>

        {/* Modules & Actions: Section 6 (Module widgets) + 7 (Quick actions) */}
        <TabPanel value="modules" current={tab}>
          <Stack spacing={3}>
            <ModuleOverviewWidgets kpis={kpis} isLoading={isLoading} />
            <QuickActions />
          </Stack>
        </TabPanel>

        {/* Recent Records: Section 9 (compact tables) */}
        <TabPanel value="records" current={tab}>
          <RecentLists recent={recent} isLoading={isLoading} />
        </TabPanel>
      </Stack>
    </Container>
  );
}
