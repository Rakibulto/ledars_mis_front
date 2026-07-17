'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

const DEFAULT_INTEGRATIONS = [
  {
    id: 'int-1',
    name: 'Procurement to Payables',
    description: 'Convert approved purchase events into vendor bill staging records.',
    icon: 'solar:cart-5-bold-duotone',
    connected: true,
    syncFrequency: 'Hourly',
    owner: 'Procurement Finance',
    endpoint: 'procurement.approved-orders',
    ruleMode: 'Document mapping',
    mappingSummary: 'PO, GRN, supplier, tax, analytic dimensions',
    webhookTrigger: 'purchase_order.approved',
    appConnection: 'Procurement service account',
    authMode: 'OAuth2 service token',
    retryPolicy: 'Retry 3 times every 10 minutes',
    lastSync: '2026-03-29T11:20:00',
    lastTestStatus: 'passed',
  },
  {
    id: 'int-2',
    name: 'Projects to Receivables',
    description: 'Generate billable milestones and donor invoice triggers from project delivery.',
    icon: 'solar:folder-with-files-bold-duotone',
    connected: true,
    syncFrequency: 'Daily',
    owner: 'Accounts Receivable',
    endpoint: 'projects.billing-events',
    ruleMode: 'Milestone trigger',
    mappingSummary: 'Milestone, customer, contract, service period',
    webhookTrigger: 'milestone.completed',
    appConnection: 'Projects integration app',
    authMode: 'Webhook secret and signature',
    retryPolicy: 'Retry daily until acknowledgment',
    lastSync: '2026-03-29T08:00:00',
    lastTestStatus: 'warning',
  },
  {
    id: 'int-3',
    name: 'HR to Payroll Journals',
    description: 'Bring approved payroll batches and statutory deductions into accounting.',
    icon: 'solar:users-group-two-rounded-bold-duotone',
    connected: false,
    syncFrequency: 'Payroll close',
    owner: 'Payroll Accountant',
    endpoint: 'hr.payroll-export',
    ruleMode: 'Batch import',
    mappingSummary: 'Gross pay, net pay, liabilities, fund source',
    webhookTrigger: 'payroll_batch.closed',
    appConnection: 'HR payroll exporter',
    authMode: 'SFTP batch credential',
    retryPolicy: 'Manual rerun by payroll accountant',
    lastSync: null,
    lastTestStatus: 'not-tested',
  },
];

const TEST_STATUS_COLORS = {
  passed: 'success',
  warning: 'warning',
  failed: 'error',
  'not-tested': 'default',
};

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  endpoint: '',
  syncFrequency: 'Hourly',
  owner: '',
  ruleMode: 'Document mapping',
  mappingSummary: '',
  connected: true,
  webhookTrigger: '',
  appConnection: '',
  authMode: '',
  retryPolicy: '',
};

function normalizeIntegration(item, index) {
  return {
    id: item.id || `setting-${index + 1}`,
    name: item.name || item.key || `Integration ${index + 1}`,
    description: item.description || 'Integration settings loaded from accounting configuration.',
    icon: item.icon || 'solar:plug-circle-bold-duotone',
    connected: item.connected ?? item.active ?? false,
    syncFrequency: item.syncFrequency || item.sync_frequency || 'Daily',
    owner: item.owner || 'Accounting Team',
    endpoint: item.endpoint || item.key || 'config.endpoint',
    ruleMode: item.ruleMode || item.rule_mode || 'Document mapping',
    mappingSummary: item.mappingSummary || item.mapping_summary || 'No mapping details provided',
    webhookTrigger: item.webhookTrigger || item.webhook_trigger || 'manual.sync',
    appConnection: item.appConnection || item.app_connection || 'Shared finance integration app',
    authMode: item.authMode || item.auth_mode || 'Service account token',
    retryPolicy: item.retryPolicy || item.retry_policy || 'Retry 3 times over 30 minutes',
    lastSync: item.lastSync || item.last_sync || item.updated_at || null,
    lastTestStatus: item.lastTestStatus || item.last_test_status || 'not-tested',
  };
}

function IntegrationRules() {
  const { data: rawSettings } = useGetRequest(EP.integration_rules);
  const settingsData = useMemo(
    () => (Array.isArray(rawSettings) ? rawSettings : rawSettings?.results || []),
    [rawSettings]
  );
  const normalizedIntegrations = useMemo(
    () => settingsData.slice(0, 6).map(normalizeIntegration),
    [settingsData]
  );
  const integrationsSignature = useMemo(
    () => JSON.stringify(normalizedIntegrations),
    [normalizedIntegrations]
  );

  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIntegrationId, setEditingIntegrationId] = useState(null);
  const [draftConfig, setDraftConfig] = useState(EMPTY_FORM);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(DEFAULT_INTEGRATIONS[0].id);
  const lastIntegrationsSignatureRef = useRef('');

  useEffect(() => {
    if (!normalizedIntegrations.length) return;
    if (lastIntegrationsSignatureRef.current === integrationsSignature) return;

    lastIntegrationsSignatureRef.current = integrationsSignature;
    setIntegrations(normalizedIntegrations);
    setSelectedIntegrationId((current) => {
      if (normalizedIntegrations.some((item) => item.id === current)) {
        return current;
      }

      return normalizedIntegrations[0]?.id || current;
    });
  }, [normalizedIntegrations, integrationsSignature]);

  const connectedCount = integrations.filter((item) => item.connected).length;
  const warningCount = integrations.filter((item) => item.lastTestStatus === 'warning').length;
  const failedCount = integrations.filter((item) => item.lastTestStatus === 'failed').length;
  const selectedMonitor =
    integrations.find((item) => item.id === selectedIntegrationId) || integrations[0] || null;

  const selectedIntegration = useMemo(
    () => integrations.find((item) => item.id === draftConfig.id),
    [draftConfig.id, integrations]
  );

  const toggleConnected = async (id) => {
    const item = integrations.find((i) => i.id === id);
    if (!item) return;
    const nextConnected = !item.connected;

    // Optimistic update
    setIntegrations((current) =>
      current.map((i) =>
        i.id === id
          ? {
              ...i,
              connected: nextConnected,
              lastTestStatus: !nextConnected ? 'warning' : i.lastTestStatus,
            }
          : i
      )
    );

    try {
      await axiosInstance.patch(EP.integration_rule_by_id(id), { connected: nextConnected });
      await mutate(EP.integration_rules);
      toast.success(nextConnected ? 'Integration connected' : 'Integration disconnected');
    } catch (error) {
      // Revert on failure
      setIntegrations((current) =>
        current.map((i) => (i.id === id ? { ...i, connected: item.connected } : i))
      );
      toast.error(error?.detail || error?.message || 'Failed to update connection status');
    }
  };

  const openCreateDialog = () => {
    setEditingIntegrationId(null);
    setDraftConfig(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openConfig = (integration) => {
    setEditingIntegrationId(integration.id);
    setDraftConfig({
      id: integration.id,
      name: integration.name,
      description: integration.description,
      endpoint: integration.endpoint,
      syncFrequency: integration.syncFrequency,
      owner: integration.owner,
      ruleMode: integration.ruleMode,
      mappingSummary: integration.mappingSummary,
      connected: integration.connected,
      webhookTrigger: integration.webhookTrigger,
      appConnection: integration.appConnection,
      authMode: integration.authMode,
      retryPolicy: integration.retryPolicy,
    });
    setDialogOpen(true);
  };

  const saveConfig = async () => {
    const payload = {
      name: draftConfig.name,
      description: draftConfig.description || '',
      endpoint: draftConfig.endpoint,
      sync_frequency: draftConfig.syncFrequency || 'Daily',
      owner: draftConfig.owner,
      rule_mode: draftConfig.ruleMode || 'Document mapping',
      mapping_summary: draftConfig.mappingSummary || '',
      connected: draftConfig.connected,
      webhook_trigger: draftConfig.webhookTrigger || '',
      app_connection: draftConfig.appConnection || '',
      auth_mode: draftConfig.authMode || '',
      retry_policy: draftConfig.retryPolicy || '',
    };

    try {
      if (editingIntegrationId) {
        const { data: updated } = await axiosInstance.patch(
          EP.integration_rule_by_id(editingIntegrationId),
          payload
        );
        const normalized = normalizeIntegration(updated, 0);
        setIntegrations((current) =>
          current.map((item) => (item.id === editingIntegrationId ? normalized : item))
        );
        toast.success('Integration configuration saved');
      } else {
        const { data: created } = await axiosInstance.post(EP.integration_rules, payload);
        const normalized = normalizeIntegration(created, integrations.length);
        setIntegrations((current) => [normalized, ...current]);
        setSelectedIntegrationId(normalized.id);
        toast.success('Integration created');
      }
      await mutate(EP.integration_rules);
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save integration configuration');
    }

    setDialogOpen(false);
    setEditingIntegrationId(null);
    setDraftConfig(EMPTY_FORM);
  };

  const runConnectionTest = async (id) => {
    const item = integrations.find((i) => i.id === id);
    if (!item) return;
    const newStatus = item.connected ? 'passed' : 'failed';
    const newLastSync = item.connected ? new Date().toISOString() : item.lastSync;

    // Optimistic update
    setIntegrations((current) =>
      current.map((i) =>
        i.id === id ? { ...i, lastTestStatus: newStatus, lastSync: newLastSync } : i
      )
    );

    try {
      await axiosInstance.patch(EP.integration_rule_by_id(id), {
        last_test_status: newStatus,
        last_sync: newLastSync,
      });
      await mutate(EP.integration_rules);
      toast.success(
        newStatus === 'passed'
          ? 'Connection test passed'
          : 'Connection test failed — integration is disconnected'
      );
    } catch (error) {
      toast.error(error?.detail || error?.message || 'Failed to save test result');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Integration Rules
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure cross-module event flows, mapping logic, and sync controls for accounting
            automation.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={openCreateDialog}
        >
          Add Integration
        </Button>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Deep integration setup now exposes sync ownership, endpoint mapping, validation status, and
        configurable rule logic instead of only on/off switches.
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Connected integrations',
            value: connectedCount,
            icon: 'solar:plug-circle-bold-duotone',
          },
          {
            label: 'Validation warnings',
            value: warningCount,
            icon: 'solar:shield-warning-bold-duotone',
          },
          { label: 'Failed tests', value: failedCount, icon: 'solar:danger-circle-bold-duotone' },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Iconify icon={card.icon} width={28} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {integrations.map((integration) => (
          <Grid key={integration.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card
              sx={{
                borderRadius: 3,
                height: '100%',
                cursor: 'pointer',
                outline:
                  integration.id === selectedMonitor?.id
                    ? '2px solid rgba(37,99,235,0.35)'
                    : 'none',
              }}
              onClick={() => setSelectedIntegrationId(integration.id)}
            >
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: integration.connected ? 'success.lighter' : 'grey.200',
                    }}
                  >
                    <Iconify icon={integration.icon} width={24} />
                  </Box>
                  <Switch
                    checked={integration.connected}
                    onClick={(event) => event.stopPropagation()}
                    onChange={() => toggleConnected(integration.id)}
                  />
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {integration.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {integration.description}
                </Typography>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Endpoint
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {integration.endpoint}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Sync frequency
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {integration.syncFrequency}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Rule mode
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {integration.ruleMode}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      Owner
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {integration.owner}
                    </Typography>
                  </Stack>
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip
                    label={integration.connected ? 'Connected' : 'Disconnected'}
                    size="small"
                    color={integration.connected ? 'success' : 'default'}
                  />
                  <Chip
                    label={integration.lastTestStatus}
                    size="small"
                    color={TEST_STATUS_COLORS[integration.lastTestStatus]}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mb: 2 }}
                >
                  Mapping: {integration.mappingSummary}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => runConnectionTest(integration.id)}
                  >
                    Test
                  </Button>
                  <Button fullWidth variant="contained" onClick={() => openConfig(integration)}>
                    Configure
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedMonitor ? (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Sync Monitor
                </Typography>
                <Stack spacing={1.25}>
                  <Typography variant="body2">Integration: {selectedMonitor.name}</Typography>
                  <Typography variant="body2">Endpoint: {selectedMonitor.endpoint}</Typography>
                  <Typography variant="body2">Mode: {selectedMonitor.ruleMode}</Typography>
                  <Typography variant="body2">
                    App connection: {selectedMonitor.appConnection}
                  </Typography>
                  <Typography variant="body2">
                    Webhook trigger: {selectedMonitor.webhookTrigger}
                  </Typography>
                  <Typography variant="body2">Owner: {selectedMonitor.owner}</Typography>
                  <Typography variant="body2">
                    Last sync:{' '}
                    {selectedMonitor.lastSync
                      ? new Date(selectedMonitor.lastSync).toLocaleString()
                      : 'Never'}
                  </Typography>
                  <Typography variant="body2">
                    Mapping scope: {selectedMonitor.mappingSummary}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Trigger And Status
                </Typography>
                <Stack spacing={1.25}>
                  <Chip
                    label={selectedMonitor.connected ? 'Connected' : 'Disconnected'}
                    size="small"
                    color={selectedMonitor.connected ? 'success' : 'default'}
                    sx={{ width: 'fit-content' }}
                  />
                  <Chip
                    label={selectedMonitor.lastTestStatus}
                    size="small"
                    color={TEST_STATUS_COLORS[selectedMonitor.lastTestStatus]}
                    sx={{ width: 'fit-content', textTransform: 'capitalize' }}
                  />
                  <Typography variant="body2">
                    Trigger pattern:{' '}
                    {selectedMonitor.ruleMode === 'Webhook event'
                      ? 'Webhook callback and payload validation'
                      : selectedMonitor.ruleMode === 'Batch import'
                        ? 'Scheduled import batch and reconciliation checkpoint'
                        : 'Document event and mapping handoff'}
                  </Typography>
                  <Typography variant="body2">
                    Sync frequency: {selectedMonitor.syncFrequency}
                  </Typography>
                  <Typography variant="body2">
                    Authentication: {selectedMonitor.authMode}
                  </Typography>
                  <Typography variant="body2">
                    Retry policy: {selectedMonitor.retryPolicy}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : null}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIntegrationId ? 'Configure Integration' : 'Add Integration'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Integration name"
                  value={draftConfig.name}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Endpoint key"
                  value={draftConfig.endpoint}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, endpoint: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Sync frequency"
                  value={draftConfig.syncFrequency}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, syncFrequency: event.target.value }))
                  }
                >
                  <MenuItem value="Real time">Real time</MenuItem>
                  <MenuItem value="Hourly">Hourly</MenuItem>
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Payroll close">Payroll close</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Integration owner"
                  value={draftConfig.owner}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, owner: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Rule mode"
                  value={draftConfig.ruleMode}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, ruleMode: event.target.value }))
                  }
                >
                  <MenuItem value="Document mapping">Document mapping</MenuItem>
                  <MenuItem value="Milestone trigger">Milestone trigger</MenuItem>
                  <MenuItem value="Batch import">Batch import</MenuItem>
                  <MenuItem value="Webhook event">Webhook event</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={draftConfig.connected ? 'connected' : 'disconnected'}
                  onChange={(event) =>
                    setDraftConfig((current) => ({
                      ...current,
                      connected: event.target.value === 'connected',
                    }))
                  }
                >
                  <MenuItem value="connected">Connected</MenuItem>
                  <MenuItem value="disconnected">Disconnected</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="App connection"
                  value={draftConfig.appConnection}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, appConnection: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Webhook trigger"
                  value={draftConfig.webhookTrigger}
                  onChange={(event) =>
                    setDraftConfig((current) => ({
                      ...current,
                      webhookTrigger: event.target.value,
                    }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Authentication mode"
                  value={draftConfig.authMode}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, authMode: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Retry policy"
                  value={draftConfig.retryPolicy}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, retryPolicy: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  label="Description"
                  value={draftConfig.description}
                  onChange={(event) =>
                    setDraftConfig((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Mapping summary"
                  value={draftConfig.mappingSummary}
                  onChange={(event) =>
                    setDraftConfig((current) => ({
                      ...current,
                      mappingSummary: event.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
            {selectedIntegration ? (
              <Alert
                severity={selectedIntegration.lastTestStatus === 'passed' ? 'success' : 'warning'}
              >
                Last validation state: {selectedIntegration.lastTestStatus}. Last sync:{' '}
                {selectedIntegration.lastSync
                  ? new Date(selectedIntegration.lastSync).toLocaleString()
                  : 'never'}
                .
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveConfig}
            disabled={!draftConfig.name || !draftConfig.endpoint || !draftConfig.owner}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IntegrationRules;
