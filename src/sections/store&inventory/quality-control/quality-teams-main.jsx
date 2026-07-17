'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Table,
  Button,
  Switch,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  IconButton,
  Pagination,
  Typography,
  InputAdornment,
  TableContainer,
  FormControlLabel,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import TableRowSkeleton from 'src/components/table/tableRowSkeleton';

import QualityTeamFormDialog from './quality-team-form-dialog';
import {
  formatMemberNames,
  normalizeCollection,
  getActivityChipProps,
  getCoverageChipProps,
} from './quality-team-shared';

const EP = endpoints.storeInventory;

const ACTIVITY_FILTER_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const SUMMARY_TONES = {
  slate: { bg: '#e2e8f0', fg: '#0f172a' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  error: { bg: '#fee2e2', fg: '#991b1b' },
};

function buildQualityTeamQuery({ search, isActive, leader, category, page, pagination }) {
  const params = new URLSearchParams();

  params.set('ordering', 'name');

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (isActive) {
    params.set('is_active', isActive);
  }

  if (leader) {
    params.set('leader', String(leader));
  }

  if (category) {
    params.set('category', String(category));
  }

  if (pagination) {
    params.set('pagination', 'true');
    params.set('page', String(page + 1));
  }

  return `${EP.quality_teams}?${params.toString()}`;
}

function buildSummaryMetrics(records) {
  return records.reduce(
    (summary, record) => {
      const memberCount = Number(record.member_count || 0);

      summary.total += 1;
      summary.members += memberCount;

      if (record.is_active) {
        summary.active += 1;
      } else {
        summary.inactive += 1;
      }

      if (memberCount <= 1) {
        summary.singlePoint += 1;
      }

      return summary;
    },
    { total: 0, active: 0, inactive: 0, members: 0, singlePoint: 0 }
  );
}

function QualityMetricCard({ icon, title, value, description, tone = 'slate' }) {
  const colors = SUMMARY_TONES[tone] || SUMMARY_TONES.slate;

  return (
    <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            bgcolor: colors.bg,
            color: colors.fg,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Iconify icon={icon} width={28} />
        </Box>

        <Box>
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="#0f172a">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function TeamRow({ team, serialNumber, onOpenDetails, onEdit, onDelete }) {
  const activityChip = getActivityChipProps(team.is_active);
  const coverageChip = getCoverageChipProps(team.member_count || 0);

  return (
    <TableRow
      hover
      onClick={() => onOpenDetails(team.id)}
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: '#f8fafc',
        },
      }}
    >
      <TableCell align="center" sx={{ width: 56 }}>
        <Typography variant="body2" fontWeight={700} color="#64748b">
          {serialNumber}
        </Typography>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={700} color="#0f172a">
            {team.name || 'Unnamed quality team'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {team.description || 'No team description'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {team.leader_name || 'Unassigned'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {team.category_name || 'No category linked'}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Stack spacing={0.5}>
          <Typography variant="body2" fontWeight={600} color="#0f172a">
            {team.member_count || 0} members
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatMemberNames(team.member_names)}
          </Typography>
        </Stack>
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={coverageChip.color} label={coverageChip.label} variant="soft" />
      </TableCell>
      <TableCell align="center">
        <Chip size="small" color={activityChip.color} label={activityChip.label} variant="soft" />
      </TableCell>
      <TableCell align="center">
        <Stack direction="row" spacing={0.5} justifyContent="center">
          <IconButton
            size="small"
            color="primary"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetails(team.id);
            }}
          >
            <Iconify icon="solar:eye-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="inherit"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(team.id);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(team);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  );
}

export default function QualityTeamsMain() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [leaderFilter, setLeaderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(0);
  const [dense, setDense] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [activeId, setActiveId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 400);

  const listUrl = useMemo(
    () =>
      buildQualityTeamQuery({
        search: debouncedSearch,
        isActive: activityFilter,
        leader: leaderFilter,
        category: categoryFilter,
        page,
        pagination: true,
      }),
    [debouncedSearch, activityFilter, leaderFilter, categoryFilter, page]
  );

  const summaryUrl = useMemo(
    () =>
      buildQualityTeamQuery({
        search: debouncedSearch,
        isActive: activityFilter,
        leader: leaderFilter,
        category: categoryFilter,
        page,
        pagination: false,
      }),
    [debouncedSearch, activityFilter, leaderFilter, categoryFilter, page]
  );

  const {
    data: rawTeamList,
    loading: teamListLoading,
    error: teamListError,
  } = useGetRequest(listUrl);
  const { data: rawTeamSummary } = useGetRequest(summaryUrl);
  const { data: rawUsers } = useGetRequest(endpoints.auth.simpleUsers);
  const { data: rawCategories } = useGetRequest(`${EP.item_category}?pagination=false`);

  const rows = useMemo(() => normalizeCollection(rawTeamList), [rawTeamList]);
  const summaryRows = useMemo(() => normalizeCollection(rawTeamSummary), [rawTeamSummary]);

  const userOptions = useMemo(
    () =>
      [...normalizeCollection(rawUsers)].sort((left, right) =>
        String(left?.username || '').localeCompare(String(right?.username || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawUsers]
  );

  const categoryOptions = useMemo(
    () =>
      [...normalizeCollection(rawCategories)].sort((left, right) =>
        String(left?.name || '').localeCompare(String(right?.name || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [rawCategories]
  );

  const summaryMetrics = useMemo(() => buildSummaryMetrics(summaryRows), [summaryRows]);

  const totalPages = Math.max(rawTeamList?.total_pages || 1, 1);
  const rowsPerPage = rawTeamList?.page_size || 10;
  const totalMatches = rawTeamList?.count ?? rows.length;
  const filtersApplied = Boolean(
    searchInput.trim() || activityFilter || leaderFilter || categoryFilter
  );

  const openDetails = (teamId) => {
    router.push(paths.dashboard.storeInventory.qualityTeam_detail(teamId));
  };

  const openCreateDialog = () => {
    setFormMode('create');
    setActiveId(null);
    setFormOpen(true);
  };

  const openEditDialog = (teamId) => {
    setFormMode('edit');
    setActiveId(teamId);
    setFormOpen(true);
  };

  const refreshListData = async () => {
    await Promise.all([mutate(listUrl), mutate(summaryUrl), mutate(EP.quality_teams)]);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    try {
      await deleteRequest(EP.quality_team_by_id(deleteTarget.id));
      toast.success('Quality team deleted successfully.');
      await refreshListData();
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleFormSuccess = async (record) => {
    await refreshListData();

    if (record?.id) {
      await mutate(EP.quality_team_by_id(record.id));
    }

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qualityTeam_detail(record.id));
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setActivityFilter('');
    setLeaderFilter('');
    setCategoryFilter('');
    setPage(0);
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            color: '#fff',
            background: 'linear-gradient(135deg, #14532d 0%, #0f766e 100%)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={3}
            alignItems={{ md: 'center' }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
              <Chip
                label="Store & Inventory"
                sx={{
                  alignSelf: 'flex-start',
                  bgcolor: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" fontWeight={800}>
                Quality Teams Desk
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.84)' }}>
                Manage team ownership for inspections and escalation with live backend search,
                filters, pagination, and routed team drilldown.
              </Typography>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
                onClick={openCreateDialog}
                sx={{
                  color: 'common.white',
                  fontWeight: 700,
                  '&:hover': { color: 'common.white' },
                  '&.Mui-disabled': { color: 'common.white' },
                }}
              >
                Add Quality Team
              </Button>
            </Stack>
          </Stack>
        </Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:users-group-two-rounded-bold-duotone"
              title="Total Teams"
              value={summaryMetrics.total}
              description="Matched on the backend under the current search and filters."
              tone="slate"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:user-check-bold-duotone"
              title="Active Teams"
              value={summaryMetrics.active}
              description="Teams that can own live inspection and escalation work."
              tone="success"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:user-cross-bold-duotone"
              title="Inactive Teams"
              value={summaryMetrics.inactive}
              description="Teams that should not receive new inspection assignments."
              tone="error"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <QualityMetricCard
              icon="solar:user-id-bold-duotone"
              title="Single-Point Teams"
              value={summaryMetrics.singlePoint}
              description="Teams with one or zero members that may create review bottlenecks."
              tone="warning"
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Search, activity, leader, category, and pagination now run against the live backend
          quality-team API. Open any row to review the team in detail.
        </Alert>

        <Card sx={{ borderRadius: 4, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search team, leader, category, or description"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setPage(0);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:magnifer-bold-duotone" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Status"
                  value={activityFilter}
                  onChange={(event) => {
                    setActivityFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  {ACTIVITY_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value || 'all-status'} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Leader"
                  value={leaderFilter}
                  onChange={(event) => {
                    setLeaderFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Leaders</MenuItem>
                  {userOptions.map((user) => (
                    <MenuItem key={user.id} value={String(user.id)}>
                      {user.username || 'Unnamed user'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  fullWidth
                  select
                  size="small"
                  label="Category"
                  value={categoryFilter}
                  onChange={(event) => {
                    setCategoryFilter(event.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categoryOptions.map((category) => (
                    <MenuItem key={category.id} value={String(category.id)}>
                      {category.name || 'Unnamed category'}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="body2" color="text.secondary">
                {totalMatches} quality teams matched on the server.
              </Typography>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {filtersApplied && (
                  <Button variant="text" color="inherit" onClick={handleResetFilters}>
                    Reset filters
                  </Button>
                )}
              </Stack>
            </Stack>

            {teamListError && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                Failed to load quality teams. Please refresh the page and try again.
              </Alert>
            )}
          </Stack>

          <TableContainer>
            <Table size={dense ? 'small' : 'medium'}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#ecfdf5' }}>
                  <TableCell align="center" sx={{ width: 56, fontWeight: 700 }}>
                    SL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Team</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Leader / Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Coverage
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamListLoading
                  ? Array.from({ length: 5 }, (_, index) => (
                      <TableRowSkeleton
                        key={index}
                        columns={[
                          { type: 'text', width: 20, align: 'center' },
                          { type: 'text', width: 180, lines: 2 },
                          { type: 'text', width: 160, lines: 2 },
                          { type: 'text', width: 220, lines: 2 },
                          { type: 'rect', width: 110, height: 24, align: 'center' },
                          { type: 'rect', width: 90, height: 24, align: 'center' },
                          { type: 'circle', count: 3, size: 30, align: 'center' },
                        ]}
                      />
                    ))
                  : rows.map((team, index) => (
                      <TeamRow
                        key={team.id}
                        team={team}
                        serialNumber={page * rowsPerPage + index + 1}
                        onOpenDetails={openDetails}
                        onEdit={openEditDialog}
                        onDelete={(target) => setDeleteTarget(target)}
                      />
                    ))}

                {!teamListLoading && !rows.length && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Stack alignItems="center" spacing={2}>
                        <Iconify
                          icon="solar:users-group-two-rounded-bold-duotone"
                          width={56}
                          sx={{ color: 'text.disabled' }}
                        />
                        <Typography variant="h6" color="text.secondary">
                          No quality teams found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Adjust the filters or add a new quality team.
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems={{ sm: 'center' }}
            >
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch checked={dense} onChange={(event) => setDense(event.target.checked)} />
                }
                label="Dense"
              />

              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {totalPages}
              </Typography>
            </Stack>

            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, nextPage) => setPage(nextPage - 1)}
              variant="outlined"
              shape="rounded"
            />
          </Box>
        </Card>
      </Stack>

      <QualityTeamFormDialog
        open={formOpen}
        mode={formMode}
        teamId={formMode === 'edit' ? activeId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Quality Team"
        content={`Are you sure you want to delete ${deleteTarget?.name || 'this quality team'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
