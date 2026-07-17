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
  Divider,
  Skeleton,
  Typography,
  CardContent,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const statusConfig = {
  Planned: { color: 'default', icon: 'solar:file-text-bold' },
  'In Progress': { color: 'warning', icon: 'solar:clock-circle-bold' },
  Completed: { color: 'success', icon: 'solar:check-circle-bold' },
  Cancelled: { color: 'error', icon: 'solar:close-circle-bold' },
  Pending: { color: 'info', icon: 'solar:clock-circle-bold' },
  'On Hold': { color: 'secondary', icon: 'solar:pause-circle-bold' },
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

function getDaysToDelivery(deliveryDate) {
  if (!deliveryDate) return null;
  const diff = Math.ceil((new Date(deliveryDate) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

const formatCurrency = (value) => `৳${Number(value || 0).toLocaleString()}`;

export function ServiceDeliveryDetail() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState('details');

  const {
    data: liveService,
    loading,
    error,
  } = useGetRequest(
    params?.id ? `${endpoints.beneficiaries.service_delivery}${params.id}/` : null,
    { suppressErrorLog: true }
  );

  const service = liveService || {};

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

  if (!service || !service.id) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load service delivery details. The record may not exist or you may not have
          permission to view it.
        </Alert>
        <Button
          component={Link}
          href="/dashboard/beneficiaries/service-delivery"
          variant="outlined"
          startIcon={<Icon icon="solar:arrow-left-bold" />}
        >
          Back to List
        </Button>
      </Box>
    );
  }

  const daysToDelivery = getDaysToDelivery(service.delivery_date);

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
            <Icon icon="solar:delivery-bold" width={28} style={{ color: 'primary' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Service Delivery #{service.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {service.service_type || '—'} • {service.category_name || '—'}
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
            href="/dashboard/beneficiaries/service-delivery"
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
            service.status === 'Completed'
              ? 'success.main'
              : service.status === 'Cancelled'
                ? 'error.main'
                : service.status === 'In Progress'
                  ? 'warning.main'
                  : 'info.main',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getStatusBadge(service.status)}
              {service.created_by && (
                <Typography variant="body2">
                  <Typography component="span" variant="body2" color="text.secondary">
                    Created by:{' '}
                  </Typography>
                  <Typography component="span" variant="body2" sx={{ fontWeight: 500 }}>
                    {service.created_by}
                  </Typography>
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Total Cost
              </Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                {formatCurrency(service.cost)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Quantity
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {service.quantity} {service.unit || ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {daysToDelivery !== null && daysToDelivery >= 0
                  ? 'Days to Delivery'
                  : 'Delivery Date'}
              </Typography>
              <Typography
                variant="h5"
                color={
                  daysToDelivery !== null && daysToDelivery < 3 ? 'error.main' : 'warning.main'
                }
                sx={{ fontWeight: 700 }}
              >
                {daysToDelivery !== null ? (daysToDelivery >= 0 ? daysToDelivery : 'Overdue') : '—'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Location
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {service.location || '—'}
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
          <Tab label="Activity Log" value="activity" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Service Information</Typography>
                <Typography variant="body2" color="text.secondary">
                  Service delivery details
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Service ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {service.id}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>{getStatusBadge(service.status)}</Box>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Service Type
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {service.service_type || '—'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {service.category_name || '—'}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDate(service.created_at)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatDateTime(service.updated_at)}
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
                <Typography variant="h6">Delivery Information</Typography>
                <Typography variant="body2" color="text.secondary">
                  Delivery details and schedule
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Delivery Location
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {service.location || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Delivery Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(service.delivery_date)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Service Provider
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {service.provider || '—'}
                    </Typography>
                  </Box>
                  {daysToDelivery !== null && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Days Remaining
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            daysToDelivery < 3
                              ? '#ef4444'
                              : daysToDelivery < 7
                                ? '#f59e0b'
                                : '#10b981',
                        }}
                      >
                        {daysToDelivery >= 0 ? `${daysToDelivery} days` : 'Overdue'}
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
                <Typography variant="h6">Cost & Quantity</Typography>
                <Typography variant="body2" color="text.secondary">
                  Service allocation details
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Cost
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      {formatCurrency(service.cost)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {service.quantity} {service.unit || ''}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Cost per Unit
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(Number(service.cost || 0) / Number(service.quantity || 1))}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Additional Information</Typography>
                <Typography variant="body2" color="text.secondary">
                  Extra remarks and notes
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Remarks
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {service.remarks || 'No remarks recorded.'}
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
              Recipient of this service
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
                {(service.beneficiary_info?.name || 'B').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Beneficiary Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {service.beneficiary_info?.name || '—'}
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
                      {service.beneficiary_info?.ben_code || '—'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">
                      Beneficiary ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {service.beneficiary || '—'}
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
                      {service.created_by || 'System'} • {formatDateTime(service.created_at)}
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
                      System • {formatDateTime(service.updated_at)}
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
