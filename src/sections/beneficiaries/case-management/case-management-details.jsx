'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useParams } from 'next/navigation';

import {
  Box,
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Alert,
  Button,
  Avatar,
  Skeleton,
  Typography,
  CardContent,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const statusConfig = {
  Open: { color: 'info', icon: 'solar:file-text-bold' },
  'In Progress': { color: 'warning', icon: 'solar:clock-circle-bold' },
  'On Hold': { color: 'secondary', icon: 'solar:pause-circle-bold' },
  Resolved: { color: 'success', icon: 'solar:check-circle-bold' },
  Closed: { color: 'success', icon: 'solar:check-circle-bold' },
  Cancelled: { color: 'error', icon: 'solar:close-circle-bold' },
};

const priorityConfig = {
  Low: 'info',
  Medium: 'warning',
  High: 'error',
  Urgent: 'error',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDaysToFollowup(followupDate) {
  if (!followupDate) return null;
  const diff = Math.ceil((new Date(followupDate) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function CaseManagementDetail() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('details');

  const {
    data: liveCase,
    loading,
    error,
  } = useGetRequest(params?.id ? `${endpoints.beneficiaries.case_management}${params.id}/` : null, {
    suppressErrorLog: true,
  });

  const caseData = liveCase || {};

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || { color: 'default', icon: 'solar:clock-circle-bold' };
    return (
      <Chip
        icon={<Icon icon={config.icon} width={14} />}
        label={status}
        color={config.color}
        size="small"
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 3, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!caseData || !caseData.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load case management details. The record may not exist or you may not have
          permission to view it.
        </Alert>
        <Button
          component={Link}
          href="/dashboard/beneficiaries/case-management"
          variant="outlined"
          startIcon={<Icon icon="solar:arrow-left-bold" />}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  const daysToFollowup = getDaysToFollowup(caseData.next_follow_up);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 1.5,
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon icon="solar:folder-open-bold" width={28} style={{ color: 'primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Case #{caseData.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {caseData.case_type || '—'} • {caseData.beneficiary_info?.name || '—'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<Icon icon="solar:printer-bold" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
          <Button
            component={Link}
            href="/dashboard/beneficiaries/case-management"
            variant="outlined"
            size="small"
            color="inherit"
            startIcon={<Icon icon="solar:arrow-left-bold" />}
          >
            Back
          </Button>
        </Box>
      </Box>

      {/* Status Banner */}
      <Card
        sx={{
          mb: 3,
          borderLeft: 4,
          borderColor:
            caseData.status === 'Closed' || caseData.status === 'Resolved'
              ? 'success.main'
              : caseData.status === 'Cancelled'
                ? 'error.main'
                : caseData.status === 'In Progress'
                  ? 'warning.main'
                  : 'info.main',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStatusBadge(caseData.status)}
              {caseData.created_by && (
                <Typography variant="body2">
                  <Typography component="span" variant="body2" color="text.secondary">
                    Created by:{' '}
                  </Typography>
                  <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
                    {caseData.created_by}
                  </Typography>
                </Typography>
              )}
            </Box>
            {caseData.priority && (
              <Chip
                label={`${caseData.priority} Priority`}
                color={priorityConfig[caseData.priority] || 'default'}
                size="small"
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Interventions
              </Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                {caseData.interventions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Priority Level
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {caseData.priority || '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'info.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {daysToFollowup !== null && daysToFollowup >= 0
                  ? 'Days to Follow-up'
                  : 'Follow-up Date'}
              </Typography>
              <Typography
                variant="h5"
                color={daysToFollowup !== null && daysToFollowup < 3 ? 'error.main' : 'info.main'}
                sx={{ fontWeight: 700 }}
              >
                {daysToFollowup !== null ? (daysToFollowup >= 0 ? daysToFollowup : 'Overdue') : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Case Status
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {caseData.status || '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Details" value="details" />
          <Tab label="Beneficiary" value="beneficiary" />
          <Tab label="Case Worker" value="worker" />
          <Tab label="Activity Log" value="activity" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Case Information</Typography>
                <Typography variant="body2" color="text.secondary">
                  Core case details
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Case ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {caseData.id}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>{getStatusBadge(caseData.status)}</Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Case Type
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {caseData.case_type || '—'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Priority
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={caseData.priority}
                          color={priorityConfig[caseData.priority] || 'default'}
                          size="small"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(caseData.created_at)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDateTime(caseData.last_update)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Follow-up Schedule</Typography>
                <Typography variant="body2" color="text.secondary">
                  Case follow-up details
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Opened Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(caseData.opened_date)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Next Follow-up Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(caseData.next_follow_up)}
                    </Typography>
                  </Box>
                  {daysToFollowup !== null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Days Remaining
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            daysToFollowup < 3
                              ? '#ef4444'
                              : daysToFollowup < 7
                                ? '#f59e0b'
                                : '#10b981',
                        }}
                      >
                        {daysToFollowup >= 0 ? `${daysToFollowup} days` : 'Overdue'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Case Interventions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Intervention statistics
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Interventions
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      {caseData.interventions || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Case Description</Typography>
                <Typography variant="body2" color="text.secondary">
                  Details and remarks
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {caseData.description || 'No description recorded.'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'beneficiary' && (
        <Card>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Beneficiary Information</Typography>
            <Typography variant="body2" color="text.secondary">
              Case beneficiary details
            </Typography>
          </Box>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  fontSize: '2rem',
                  fontWeight: 700,
                }}
              >
                {(caseData.beneficiary_info?.name || 'B').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Beneficiary Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {caseData.beneficiary_info?.name || '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Beneficiary Code
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', fontWeight: 600, mt: 0.5 }}
                    >
                      {caseData.beneficiary_info?.ben_code || '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Beneficiary ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {caseData.beneficiary || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 'worker' && (
        <Card>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Assigned Case Worker</Typography>
            <Typography variant="body2" color="text.secondary">
              Case worker information
            </Typography>
          </Box>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: 'success.lighter',
                  color: 'success.main',
                  fontSize: '2rem',
                  fontWeight: 700,
                }}
              >
                {(caseData.case_worke_name || 'W').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Worker Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {caseData.case_worke_name || '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Worker ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {caseData.case_worker || '—'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">Activity Log</Typography>
            <Typography variant="body2" color="text.secondary">
              Record of changes and updates
            </Typography>
          </Box>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Record Created
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {caseData.created_by || 'System'} • {formatDateTime(caseData.created_at)}
                    </Typography>
                  </Box>
                  <Chip size="small" label="CREATE" color="success" variant="outlined" />
                </Box>
              </Box>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 1,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Last Updated
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      System • {formatDateTime(caseData.last_update)}
                    </Typography>
                  </Box>
                  <Chip size="small" label="UPDATE" color="info" variant="outlined" />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
