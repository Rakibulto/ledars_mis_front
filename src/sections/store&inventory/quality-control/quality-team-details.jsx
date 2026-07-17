'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Divider,
  Skeleton,
  Typography,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import QualityTeamFormDialog from './quality-team-form-dialog';
import {
  getTeamAction,
  formatMemberNames,
  getActivityChipProps,
  getCoverageChipProps,
} from './quality-team-shared';

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
    </Box>
  );
}

export default function QualityTeamDetails() {
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamId;
  const detailUrl = teamId ? endpoints.storeInventory.quality_team_by_id(teamId) : null;

  const { data: team, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activityChip = useMemo(() => getActivityChipProps(team?.is_active), [team?.is_active]);
  const coverageChip = useMemo(
    () => getCoverageChipProps(team?.member_count || 0),
    [team?.member_count]
  );

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!teamId) {
      return;
    }

    try {
      await deleteRequest(endpoints.storeInventory.quality_team_by_id(teamId));
      toast.success('Quality team deleted successfully.');
      await mutate(endpoints.storeInventory.quality_teams);
      router.push(paths.dashboard.storeInventory.qualityTeams);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(endpoints.storeInventory.quality_teams),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
      record?.id
        ? mutate(endpoints.storeInventory.quality_team_by_id(record.id))
        : Promise.resolve(),
    ]);

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qualityTeam_detail(record.id));
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
          >
            <Button
              component={Link}
              href={paths.dashboard.storeInventory.qualityTeams}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to Quality Teams
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {team?.name || 'Quality Team Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review team ownership, member coverage, and routing readiness before assigning live
                inspections or escalation work.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Team
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !team}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !team}
            >
              Delete
            </Button>
            {!loading && !error && team && (
              <>
                <Chip
                  size="medium"
                  color={activityChip.color}
                  label={activityChip.label}
                  variant="soft"
                />
                <Chip
                  size="medium"
                  color={coverageChip.color}
                  label={coverageChip.label}
                  variant="soft"
                />
              </>
            )}
          </Stack>
        </Stack>

        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="35%" height={42} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the selected quality team. Please try again.
          </Alert>
        )}

        {!loading && !error && team && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {team.category_name || 'No category linked'}
                    {team.leader_name ? ` • Lead: ${team.leader_name}` : ''}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip color={activityChip.color} label={activityChip.label} variant="soft" />
                  <Chip color={coverageChip.color} label={coverageChip.label} variant="soft" />
                </Stack>
              </Stack>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Leader
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {team.leader_name || 'Unassigned'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Main reviewer for inspections and escalation.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {team.category_name || 'Not linked'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Product or stock area this team typically covers.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Members
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {team.member_count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Users available to own quality work in this team.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Activity
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {activityChip.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Determines whether the team should receive new assignments.
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Team Context
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Team Name" value={team.name} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Leader" value={team.leader_name || 'Unassigned'} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Category" value={team.category_name || 'Not linked'} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Members" value={String(team.member_count || 0)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Status" value={activityChip.label} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Coverage" value={coverageChip.label} />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                    Description
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-wrap' }}
                  >
                    {team.description || 'No team description recorded for this quality team.'}
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Stack spacing={3} sx={{ height: '100%' }}>
                  <Alert
                    severity={
                      coverageChip.color === 'error'
                        ? 'error'
                        : coverageChip.color === 'warning'
                          ? 'warning'
                          : 'info'
                    }
                    sx={{ borderRadius: 3, alignItems: 'flex-start' }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Recommended Next Action
                    </Typography>
                    <Typography variant="body2">
                      {getTeamAction(Boolean(team.is_active), Number(team.member_count || 0))}
                    </Typography>
                  </Alert>

                  <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                    <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                      Member Roster
                    </Typography>

                    <Stack spacing={2}>
                      <Typography variant="body2" color="text.secondary">
                        {formatMemberNames(team.member_names)}
                      </Typography>

                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {Array.isArray(team.member_names) && team.member_names.length ? (
                          team.member_names.map((memberName) => (
                            <Chip
                              key={memberName}
                              label={memberName}
                              variant="soft"
                              color="primary"
                            />
                          ))
                        ) : (
                          <Chip label="No members assigned" variant="soft" color="default" />
                        )}
                      </Stack>
                    </Stack>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      <QualityTeamFormDialog
        open={formOpen}
        mode={formMode}
        teamId={formMode === 'edit' ? teamId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Quality Team"
        content={`Are you sure you want to delete ${team?.name || 'this quality team'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
