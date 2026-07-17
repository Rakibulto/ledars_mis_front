'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useAnalyticWorkspace } from './use-analytic-workspace';
import { AnalyticWorkspaceToolbar } from './analytic-workspace-toolbar';

// Extracts a readable message from Django REST Framework error responses.
// DRF errors arrive as { status_code, detail } where detail can be a string
// or an object of field-level arrays (e.g. { level: ["A valid integer is required."] }).
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

export default function AnalyticPlans() {
  const workspace = useAnalyticWorkspace();
  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Description
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Hierarchy
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Level</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Owner</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Active
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Accounts
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.plans.map((plan) => (
          <tr key={plan.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{plan.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{plan.description}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{plan.hierarchyLabel}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{plan.level}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{plan.governanceOwner}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {plan.active ? 'Yes' : 'No'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{plan.accountCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    level: 1,
    parentPlanId: '',
    hierarchyLabel: '',
    governanceOwner: '',
    approvalMode: 'Review on exceptions',
    defaultPolicy: '',
    mandatoryDimensions: 'Project',
    applicability: 'Journal items',
  });

  return (
    <Box>
      <AnalyticWorkspaceToolbar printTitle="Analytic Plans" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Analytic Plans
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-dimensional analytic plan governance with hierarchy, applicability rules, and
            mandatory-dimension enforcement controls.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Plan
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Plans"
            value={workspace.overview.planCount}
            helper="Dimensions currently active in analytic governance"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Hierarchy branches"
            value={workspace.plans.filter((plan) => plan.childPlans.length > 0).length}
            helper="Parent plans with governed sub-dimensions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Mandatory plans"
            value={workspace.plans.filter((plan) => plan.mandatoryDimensions.length > 0).length}
            helper="Plans enforcing dimension capture before posting"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Applicability rules"
            value={workspace.plans.reduce((sum, plan) => sum + plan.applicability.length, 0)}
            helper="Posting-scope rules covering journals, invoices, bills, and field operations"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Stack spacing={3}>
            {workspace.plans.map((plan) => (
              <Card key={plan.id} sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={700}>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {plan.hierarchyLabel} • Level {plan.level} • Owner: {plan.governanceOwner}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Chip
                        label={plan.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={plan.active ? 'success' : 'error'}
                      />
                      <Button
                        component={RouterLink}
                        href={paths.dashboard.accountingFinance.analyticAccounting.analyticPlanDetail(
                          plan.id
                        )}
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={(event) => event.stopPropagation()}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        onClick={() => workspace.actions.togglePlanMandatoryEnforcement(plan.id)}
                      >
                        Toggle Mandatory
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Mandatory dimensions
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={0.75}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ mt: 1 }}
                      >
                        {plan.mandatoryDimensions.length ? (
                          plan.mandatoryDimensions.map((dimension) => (
                            <Chip
                              key={`${plan.id}-${dimension}`}
                              label={dimension}
                              size="small"
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Chip label="Optional" size="small" />
                        )}
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Applicability
                      </Typography>
                      <Stack spacing={0.35} sx={{ mt: 1 }}>
                        {plan.applicability.map((entry) => (
                          <Typography key={`${plan.id}-${entry}`} variant="body2">
                            {entry}
                          </Typography>
                        ))}
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Hierarchy
                      </Typography>
                      <Stack spacing={0.35} sx={{ mt: 1 }}>
                        <Typography variant="body2">Accounts: {plan.accountCount}</Typography>
                        <Typography variant="body2">
                          Child plans: {plan.childPlans.length}
                        </Typography>
                        <Typography variant="body2">Approval: {plan.approvalMode}</Typography>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Default policy
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.75 }}>
                        {plan.defaultPolicy}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Governance Rules
              </Typography>
              <Stack spacing={1.5}>
                {workspace.rules.map((rule) => (
                  <Box
                    key={rule.id}
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" fontWeight={700}>
                        {rule.planName}
                      </Typography>
                      <Chip
                        label={`${rule.exceptionCount} exceptions`}
                        size="small"
                        color={rule.exceptionCount ? 'warning' : 'success'}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {rule.appliesTo.join(', ')}
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
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Analytic Plan</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Plan name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </Grid>
            {/* <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="color"
                fullWidth
                label="Color"
                value={form.color}
                onChange={(event) =>
                  setForm((current) => ({ ...current, color: event.target.value }))
                }
                helperText="Pick a colour for this plan"
              />
            </Grid> */}
            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField
                type="number"
                fullWidth
                label="Level"
                value={form.level}
                inputProps={{ step: 1, min: 1 }}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    level: parseInt(event.target.value, 10) || 1,
                  }))
                }
                helperText="Positive integer (1 = top-level)"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                select
                fullWidth
                label="Parent plan"
                value={form.parentPlanId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, parentPlanId: event.target.value }))
                }
              >
                <MenuItem value="">No parent</MenuItem>
                {workspace.plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Hierarchy label"
                value={form.hierarchyLabel}
                onChange={(event) =>
                  setForm((current) => ({ ...current, hierarchyLabel: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Governance owner"
                value={form.governanceOwner}
                onChange={(event) =>
                  setForm((current) => ({ ...current, governanceOwner: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Approval mode"
                value={form.approvalMode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, approvalMode: event.target.value }))
                }
                placeholder="Mandatory before posting"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Default policy"
                value={form.defaultPolicy}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultPolicy: event.target.value }))
                }
                placeholder="Allocation policy narrative"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Mandatory dimensions"
                value={form.mandatoryDimensions}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mandatoryDimensions: event.target.value }))
                }
                placeholder="Project, Partner, Cost center"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Applicability"
                value={form.applicability}
                onChange={(event) =>
                  setForm((current) => ({ ...current, applicability: event.target.value }))
                }
                placeholder="Journal items, Vendor bills"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || !form.name}
            onClick={async () => {
              setSubmitting(true);
              try {
                await workspace.actions.createAnalyticPlan(form);
                toast.success('Analytic plan created');
                setOpen(false);
                setForm({
                  name: '',
                  description: '',
                  level: 1,
                  parentPlanId: '',
                  hierarchyLabel: '',
                  governanceOwner: '',
                  approvalMode: 'Review on exceptions',
                  defaultPolicy: '',
                  mandatoryDimensions: 'Project',
                  applicability: 'Journal items',
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
