'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import SummaryCard from '../../_components/summary-card';

const EP = endpoints.pm;

export default function StakeholderManagementPage() {
  const { data, loading, error } = useGetRequest(EP.projects);
  const { data: actData } = useGetRequest(EP.project_activities);

  const projects = useMemo(() => data?.results || data || [], [data]);
  const activities = useMemo(() => actData?.results || actData || [], [actData]);

  const stakeholders = useMemo(() => {
    const map = {};
    projects.forEach((p) => {
      if (p.manager) {
        if (!map[p.manager])
          map[p.manager] = { role: 'Project Manager', projects: [], activities: 0 };
        map[p.manager].projects.push(p.name);
      }
      if (p.donor) {
        if (!map[p.donor]) map[p.donor] = { role: 'Donor', projects: [], activities: 0 };
        if (!map[p.donor].projects.includes(p.name)) map[p.donor].projects.push(p.name);
      }
    });
    activities.forEach((a) => {
      if (a.responsible_person) {
        if (!map[a.responsible_person])
          map[a.responsible_person] = { role: 'Activity Lead', projects: [], activities: 0 };
        map[a.responsible_person].activities += 1;
        const proj = projects.find((p) => p.id === a.project);
        if (proj && !map[a.responsible_person].projects.includes(proj.name)) {
          map[a.responsible_person].projects.push(proj.name);
        }
      }
    });
    return Object.entries(map).map(([name, info]) => ({ name, ...info }));
  }, [projects, activities]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Stakeholder Management
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Key stakeholders across projects — managers, donors, and leads
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Stakeholders"
            value={stakeholders.length}
            icon="solar:users-group-rounded-bold-duotone"
            color="#2563eb"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Donors"
            value={stakeholders.filter((s) => s.role === 'Donor').length}
            icon="solar:hand-money-bold-duotone"
            color="#8b5cf6"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Managers"
            value={stakeholders.filter((s) => s.role === 'Project Manager').length}
            icon="solar:user-bold-duotone"
            color="#10b981"
            loading={loading}
            error={error}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Activity Leads"
            value={stakeholders.filter((s) => s.role === 'Activity Lead').length}
            icon="solar:user-check-bold-duotone"
            color="#f97316"
            loading={loading}
            error={error}
          />
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Projects</TableCell>
                <TableCell>Activities</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stakeholders.map((s) => (
                <TableRow key={s.name}>
                  <TableCell>
                    <Typography variant="subtitle2">{s.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.role} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {s.projects.slice(0, 3).map((pn) => (
                        <Chip key={pn} label={pn} size="small" sx={{ fontSize: 11 }} />
                      ))}
                      {s.projects.length > 3 && (
                        <Chip label={`+${s.projects.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{s.activities || '-'}</TableCell>
                </TableRow>
              ))}
              {stakeholders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No stakeholders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
