'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { IconButton } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { ReferenceConfigToolbar } from './reference-config-toolbar';
import { useReconciliationModelsApi } from './use-reconciliation-models-api';

const EMPTY_FORM = {
  name: '',
  type: 'suggestion',
  match_label: '',
  match_journal: '',
  account: '',
  tax: '',
  amount_rule: '',
  text_rule: '',
  change_version: '',
  auto_validate: false,
};

const BASE_PATH = '/dashboard/accounting-finance/configuration/reconciliation-models';

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

export default function ReconciliationModels() {
  const [editTarget, setEditTarget] = useState(null);

  const handleOpenEditDIalog = (modle) => {
    setEditTarget(modle);
    setForm({
      name: modle.name || '',
      type: modle.type || 'suggestion',
      match_label: modle.match_label || '',
      match_journal: modle.match_journal || '',
      account: modle.account || '',
      tax: modle.tax || '',
      amount_rule: modle.amount_rule || '',
      text_rule: modle.text_rule || '',
      change_version: modle.change_version || '',
      auto_validate: modle.auto_validate || false,
    });
    setOpen(true);
  };
  const workspace = useReconciliationModelsApi();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'suggestion',
    match_label: '',
    match_journal: '',
    account: '',
    tax: '',
    amount_rule: '',
    text_rule: '',
    change_version: '',
    auto_validate: false,
  });
  const [selectedModelId, setSelectedModelId] = useState(null);

  const selectedModel =
    workspace.reconciliationModels.find((model) => String(model.id) === String(selectedModelId)) ||
    workspace.reconciliationModels[0] ||
    null;

  const saveModel = async () => {
    if (!form.name.trim()) {
      toast.error('Model name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editTarget) {
        await workspace.actions.updateReconciliationModel(editTarget.id, form);
        toast.success('Reconciliation model updated');
      } else {
        await workspace.actions.createReconciliationModel(form);
        toast.success('Reconciliation model created');
      }
      setOpen(false);
      setEditTarget(null);
      setForm({
        name: '',
        type: 'suggestion',
        match_label: '',
        match_journal: '',
        account: '',
        tax: '',
        amount_rule: '',
        text_rule: '',
        change_version: '',
        auto_validate: false,
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to create reconciliation model');
    } finally {
      setSubmitting(false);
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Type</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Match Strategy
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Amount Rule
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Auto Validate
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.reconciliationModels.map((model) => (
          <tr key={model.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{model.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{model.type}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{model.matchStrategy}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{model.amountRule}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {model.auto_validate ? 'Yes' : 'No'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {model.active ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box sx={{ p: 3 }}>
      <ReferenceConfigToolbar printTitle="Reconciliation Models" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Reconciliation Models
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rule-driven matching, counterpart defaults, and auto-validation control for bank
            reconciliation.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => setOpen(true)}
        >
          New Model
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Models"
            value={workspace.reconciliationModels.length}
            helper="Configured matching rule templates"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Active"
            value={workspace.overview.activeReconciliationModels}
            helper="Enabled for reconciliation flow"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Auto validate"
            value={workspace.reconciliationModels.filter((model) => model.auto_validate).length}
            helper="Models capable of auto clearing"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Write-off rules"
            value={
              workspace.reconciliationModels.filter((model) => model.type === 'writeoff').length
            }
            helper="Small difference and bank fee automation"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Rule Coverage</TableCell>
                <TableCell>Match Strategy</TableCell>
                <TableCell>Rule Builder</TableCell>
                <TableCell>Auto Validate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspace.reconciliationModels.map((model) => (
                <TableRow
                  key={model.id}
                  hover
                  selected={String(model.id) === String(selectedModel?.id)}
                  onClick={() => setSelectedModelId(model.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Stack spacing={0.35}>
                      <Typography variant="body2" fontWeight={700}>
                        {model.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {model.match_journal} • Label contains {model.match_label || '—'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={model.type}
                      size="small"
                      color={
                        model.type === 'writeoff'
                          ? 'error'
                          : model.type === 'suggestion'
                            ? 'info'
                            : 'default'
                      }
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{model.ruleCoverage}</TableCell>
                  <TableCell>{model.matchStrategy}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{model.amountRule}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {model.textRule} • {model.changeVersion}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={model.auto_validate ? 'Yes' : 'No'}
                      size="small"
                      color={model.auto_validate ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={model.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={model.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View details">
                      <Button
                        component={Link}
                        href={`${BASE_PATH}/${model.id}`}
                        size="small"
                        variant="text"
                      >
                        View Details
                      </Button>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDIalog(model);
                        }}
                      >
                        <Iconify icon="solar:pen-bold" width={16} />
                      </IconButton>
                    </Tooltip>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => workspace.actions.toggleReconciliationModelStatus(model.id)}
                    >
                      {model.active ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* {selectedModel ? (
        <Card sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Rule Preview
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">Model: {selectedModel.name}</Typography>
              <Typography variant="body2">Journal target: {selectedModel.match_journal}</Typography>
              <Typography variant="body2">
                Counterpart default: {selectedModel.counterpartDefault}
              </Typography>
              <Typography variant="body2">Amount matching: {selectedModel.amountRule}</Typography>
              <Typography variant="body2">Text matching: {selectedModel.textRule}</Typography>
              <Typography variant="body2">Rule coverage: {selectedModel.ruleCoverage}</Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : null} */}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditTarget(null);
          setForm(EMPTY_FORM);
        }}
      >
        <DialogTitle>
          {editTarget ? 'Edit Reconciliation Model' : 'New Reconciliation Model'}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                label="Type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                <MenuItem value="writeoff">Write-off</MenuItem>
                <MenuItem value="suggestion">Suggestion</MenuItem>
                <MenuItem value="manual">Manual</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Match Label Contains"
                value={form.match_label}
                onChange={(event) =>
                  setForm((current) => ({ ...current, match_label: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Match Journal"
                value={form.match_journal}
                onChange={(event) =>
                  setForm((current) => ({ ...current, match_journal: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Counterpart Account"
                value={form.account}
                onChange={(event) =>
                  setForm((current) => ({ ...current, account: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tax"
                value={form.tax}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tax: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Amount Rule"
                value={form.amount_rule}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount_rule: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Text Rule"
                value={form.text_rule}
                onChange={(event) =>
                  setForm((current) => ({ ...current, text_rule: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Version"
                value={form.change_version}
                onChange={(event) =>
                  setForm((current) => ({ ...current, change_version: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant={form.auto_validate ? 'contained' : 'outlined'}
                onClick={() =>
                  setForm((current) => ({ ...current, auto_validate: !current.auto_validate }))
                }
              >
                {form.auto_validate ? 'Auto validate enabled' : 'Enable auto validate'}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpen(false);
              setEditTarget(null);
              setForm(EMPTY_FORM);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={saveModel} disabled={submitting}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
