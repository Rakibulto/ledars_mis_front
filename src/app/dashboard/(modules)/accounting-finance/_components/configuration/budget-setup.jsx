'use client';

import { toast } from 'sonner';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CloudDoneIcon from '@mui/icons-material/CloudDone'; // Fiscal years loaded — green
import FormControlLabel from '@mui/material/FormControlLabel';
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert'; // Critical threshold — red
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant'; // Warning threshold  — amber

import { Iconify } from 'src/components/iconify';

import { useBudgetSetupApi } from './use-budget-setup-api';
import { PlanningConfigToolbar } from './planning-config-toolbar';

export default function BudgetSetup() {
  const api = useBudgetSetupApi();
  const [form, setForm] = useState(api.budgetSettings);
  // Sync form once when the API data first resolves
  const formSynced = useRef(false);

  useEffect(() => {
    if (!formSynced.current && !api.loading) {
      formSynced.current = true;
      setForm(api.budgetSettings);
    }
  }, [api.budgetSettings, api.loading]);

  const handleSave = async () => {
    try {
      await api.actions.updateBudgetSettings(form);
      toast.success('Budget settings saved');
    } catch {
      toast.error('Failed to save budget settings');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PlanningConfigToolbar />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Budget Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Thresholds, enforcement posture, and notification policy for budget control.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:diskette-bold" />}
          onClick={handleSave}
          disabled={api.loading}
        >
          Save Settings
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Warning threshold
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {form.warningThreshold}%
                </Typography>
                <NotificationImportantIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Critical threshold
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {form.criticalThreshold}%
                </Typography>
                <CrisisAlertIcon sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Fiscal years loaded
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 1,
                }}
              >
                <Typography variant="h5" fontWeight={800}>
                  {api.fiscalYears.length}
                </Typography>
                <CloudDoneIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700}>
            Budget governance
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Approval chain, transfer board, release mode, and reforecast cadence are part of policy
            configuration.
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <Chip label={api.budgetPolicy.approvalPolicy} variant="outlined" />
            <Chip label={api.budgetPolicy.transferWindow} variant="outlined" />
            <Chip label={api.budgetPolicy.reforecastCadence} variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                General Settings
              </Typography>
              <TextField
                select
                fullWidth
                label="Default Fiscal Year"
                value={form.defaultFiscalYear ?? ''}
                sx={{ mb: 2 }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, defaultFiscalYear: event.target.value }))
                }
              >
                {api.fiscalYears.map((year) => (
                  <MenuItem key={year.id} value={year.id}>
                    {year.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label="Budget Period"
                value={form.budgetPeriod}
                sx={{ mb: 2 }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, budgetPeriod: event.target.value }))
                }
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.enforceBudgetLimits)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        enforceBudgetLimits: event.target.checked,
                      }))
                    }
                  />
                }
                label="Enforce budget limits"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.allowBudgetTransfers)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        allowBudgetTransfers: event.target.checked,
                      }))
                    }
                  />
                }
                label="Allow budget transfers"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.autoCloseExceededBudgets)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        autoCloseExceededBudgets: event.target.checked,
                      }))
                    }
                  />
                }
                label="Auto-close exceeded budgets"
              />
              <TextField
                fullWidth
                label="Approval Policy"
                value={form.approvalPolicy ?? ''}
                sx={{ mt: 2 }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, approvalPolicy: event.target.value }))
                }
              />
              <TextField
                fullWidth
                label="Transfer Window"
                value={form.transferWindow ?? ''}
                sx={{ mt: 2 }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, transferWindow: event.target.value }))
                }
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Alert Thresholds
              </Typography>
              <TextField
                fullWidth
                label="Warning threshold (%)"
                type="number"
                value={form.warningThreshold}
                sx={{ mb: 2 }}
                helperText="Alert when budget utilization reaches this %"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    warningThreshold: Number(event.target.value),
                  }))
                }
              />
              <TextField
                fullWidth
                label="Critical threshold (%)"
                type="number"
                value={form.criticalThreshold}
                sx={{ mb: 2 }}
                helperText="Escalate when budget utilization reaches this %"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    criticalThreshold: Number(event.target.value),
                  }))
                }
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Notifications
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.emailAlerts)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, emailAlerts: event.target.checked }))
                    }
                  />
                }
                label="Email alerts for threshold breach"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.dashboardWarnings)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dashboardWarnings: event.target.checked,
                      }))
                    }
                  />
                }
                label="Dashboard warnings"
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(form.blockOverBudgetTransactions)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        blockOverBudgetTransactions: event.target.checked,
                      }))
                    }
                  />
                }
                label="Block transactions over budget"
              />
              <TextField
                fullWidth
                label="Reforecast Cadence"
                value={form.reforecastCadence ?? ''}
                sx={{ mt: 2 }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reforecastCadence: event.target.value }))
                }
              />
              <TextField
                fullWidth
                label="Budget Release Mode"
                value={form.budgetReleaseMode ?? ''}
                sx={{ mt: 2 }}
                onChange={(event) =>
                  setForm((current) => ({ ...current, budgetReleaseMode: event.target.value }))
                }
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
