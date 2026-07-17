'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useAnalyticWorkspace } from './use-analytic-workspace';
import { AnalyticWorkspaceToolbar } from './analytic-workspace-toolbar';

// Extracts a readable message from Django REST Framework error responses.
const extractApiError = (error) => {
  if (!error) return 'An unexpected error occurred';
  if (typeof error === 'string') return error;
  const { detail } = error;
  if (!detail) return error?.message || 'Request failed. Please try again.';
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') {
    const messages = Object.entries(detail)
      .flatMap(([field, errs]) =>
        (Array.isArray(errs) ? errs : [String(errs)]).map((e) => `${field}: ${e}`)
      )
      .join('\n');
    return messages || 'Validation failed. Please check your input.';
  }
  return 'Validation failed. Please check your input.';
};

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AnalyticAccounts() {
  const workspace = useAnalyticWorkspace();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    planId: '',
    partner: '',
    projectName: '',
    openingDebit: '',
    openingCredit: '',
    distributionMethod: 'fixed_ratio',
    requiresPartner: false,
    requiresProject: true,
    mandatoryDimensions: 'Project',
    costCenterName: '',
  });

  const selectedPlan = useMemo(
    () => workspace.plans.find((plan) => String(plan.id) === String(form.planId)) || null,
    [form.planId, workspace.plans]
  );

  const filteredAccounts = useMemo(
    () =>
      workspace.accounts.filter((account) => {
        if (planFilter !== 'all' && String(account.plan_id) !== String(planFilter)) return false;
        if (statusFilter !== 'all' && account.entryStatus !== statusFilter) return false;
        if (!search) return true;

        return [account.code, account.name, account.planName, account.partner, account.projectName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [planFilter, search, statusFilter, workspace.accounts]
  );

  return (
    <Box>
      <AnalyticWorkspaceToolbar
        printTitle="Analytic Accounts"
        printContent={
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Code
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Name
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Plan
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Balance
                </th>
                <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{account.code}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{account.name}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {account.planName}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {formatCurrency(account.balance)}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {account.entryStatus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Analytic Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Odoo-style analytic distribution workspace with mandatory dimensions, partner
            allocation, and project governance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Analytic Account
        </Button>
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {workspace.rules.slice(0, 2).map((rule) => (
          <Alert
            key={rule.id}
            severity={rule.exceptionCount ? 'warning' : 'success'}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              {rule.planName}
            </Typography>
            {rule.exceptionCount
              ? `${rule.exceptionCount} allocation exceptions require enforcement review across ${rule.accountCount} analytic accounts.`
              : 'Mandatory-dimension governance is clean across current postings.'}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Analytic accounts"
            value={workspace.overview.accountCount}
            helper={`${workspace.overview.activeAccountCount} active dimensions available for posting`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Total balance"
            value={formatCurrency(workspace.overview.totalBalance)}
            helper="Combined analytic net balance across all dimensions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Mandatory rules"
            value={workspace.overview.mandatoryRuleCount}
            helper="Plans enforcing mandatory partner, project, or funding dimensions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Exceptions"
            value={workspace.overview.exceptionCount}
            helper="Items still waiting for validated analytic distribution"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4.5 }}>
              <TextField
                fullWidth
                label="Search analytic accounts"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Code, account, partner, project"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3.75 }}>
              <TextField
                select
                fullWidth
                label="Plan"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              >
                <MenuItem value="all">All plans</MenuItem>
                {workspace.plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3.75 }}>
              <TextField
                select
                fullWidth
                label="Posting status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="validated">Validated</MenuItem>
                <MenuItem value="review">Needs review</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Account</th>
                      <th align="left">Plan</th>
                      <th align="left">Partner / Project split</th>
                      <th align="right">Balance</th>
                      <th align="left">Mandatory dimensions</th>
                      <th align="left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr key={account.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.35}>
                            <Typography variant="body2" fontWeight={700}>
                              {account.code} • {account.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Owner: {account.governanceOwner} • {account.lineCount} journal-linked
                              items
                            </Typography>
                          </Stack>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={account.planName}
                            size="small"
                            sx={{ bgcolor: `${account.planColor}20`, color: account.planColor }}
                          />
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.4}>
                            <Typography variant="body2">
                              Partner:{' '}
                              {account.partnerDistribution
                                .map((item) => `${item.name} ${item.percent}%`)
                                .join(' | ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Project:{' '}
                              {account.projectDistribution
                                .map((item) => `${item.name} ${item.percent}%`)
                                .join(' | ')}
                            </Typography>
                          </Stack>
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(account.balance)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            {account.mandatoryDimensions.map((dimension) => (
                              <Chip
                                key={`${account.id}-${dimension}`}
                                label={dimension}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Stack>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={workspace.formatAnalyticStatus(account.entryStatus)}
                            size="small"
                            color={account.entryStatus === 'validated' ? 'success' : 'warning'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Mandatory-Dimension Rules
                </Typography>
                <Stack spacing={1.25}>
                  {workspace.rules.map((rule) => (
                    <Box
                      key={rule.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {rule.planName}
                        </Typography>
                        <Chip
                          label={workspace.formatAnalyticStatus(rule.enforcementStatus)}
                          size="small"
                          color={rule.exceptionCount ? 'warning' : 'success'}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {rule.mandatoryDimensions.join(', ') || 'No mandatory dimensions'} • Applies
                        to {rule.appliesTo.join(', ')}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Recent Activity
                </Typography>
                <Stack spacing={1.25}>
                  {workspace.recentActivity.slice(0, 4).map((event) => (
                    <Box
                      key={event.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        {event.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.date} • {event.actor}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Analytic Account</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Plan"
                value={form.planId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, planId: event.target.value }))
                }
                helperText={
                  workspace.isLoading
                    ? 'Loading plans…'
                    : workspace.plans.length === 0
                      ? 'No plans found — create an analytic plan first'
                      : undefined
                }
              >
                {workspace.isLoading ? (
                  <MenuItem value="" disabled>
                    Loading plans…
                  </MenuItem>
                ) : workspace.plans.length === 0 ? (
                  <MenuItem value="" disabled>
                    No plans available
                  </MenuItem>
                ) : (
                  workspace.plans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Partner"
                value={form.partner}
                onChange={(event) =>
                  setForm((current) => ({ ...current, partner: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Project"
                value={form.projectName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, projectName: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Cost center"
                value={form.costCenterName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, costCenterName: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Mandatory dimensions"
                value={form.mandatoryDimensions}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mandatoryDimensions: event.target.value }))
                }
                placeholder="Project, Partner"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                fullWidth
                label="Opening debit"
                value={form.openingDebit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, openingDebit: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                fullWidth
                label="Opening credit"
                value={form.openingCredit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, openingCredit: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Distribution method"
                value={form.distributionMethod}
                onChange={(event) =>
                  setForm((current) => ({ ...current, distributionMethod: event.target.value }))
                }
              >
                <MenuItem value="fixed_ratio">Fixed ratio</MenuItem>
                <MenuItem value="manual_split">Manual split</MenuItem>
              </TextField>
            </Grid>
            {selectedPlan && (
              <Grid size={{ xs: 12 }}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {selectedPlan.name} governance
                  </Typography>
                  {selectedPlan.defaultPolicy} • Applies to {selectedPlan.applicability.join(', ')}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || !form.code || !form.name || !form.planId}
            onClick={async () => {
              setSubmitting(true);
              try {
                await workspace.actions.createAnalyticAccount(form);
                toast.success('Analytic account created');
                setOpen(false);
                setForm({
                  code: '',
                  name: '',
                  planId: '',
                  partner: '',
                  projectName: '',
                  openingDebit: '',
                  openingCredit: '',
                  distributionMethod: 'fixed_ratio',
                  requiresPartner: false,
                  requiresProject: true,
                  mandatoryDimensions: 'Project',
                  costCenterName: '',
                });
              } catch (error) {
                toast.error(extractApiError(error));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
