'use client';

import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
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
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useBudgetsWorkspace } from './use-budgets-workspace';
import { BudgetsWorkspaceToolbar } from './budgets-workspace-toolbar';

const DEFAULT_NEW_LINE = {
  accountId: '',
  owner: 'Budget Controller',
  planned: 0,
  actual: 0,
  commitments: 0,
  encumbrance: 0,
  note: '',
};

function BudgetLines() {
  const workspace = useBudgetsWorkspace();
  const searchParams = useSearchParams();
  const [selectedBudgetId, setSelectedBudgetId] = useState(searchParams.get('budget') || null);
  const [drafts, setDrafts] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLine, setNewLine] = useState(DEFAULT_NEW_LINE);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    const budgetFromQuery = searchParams.get('budget');
    if (budgetFromQuery) {
      setSelectedBudgetId(budgetFromQuery);
    } else if (selectedBudgetId === null && workspace.budgets.length > 0) {
      setSelectedBudgetId(workspace.budgets[0].id);
    }
  }, [searchParams, selectedBudgetId, workspace.budgets.length]);

  // Reactively fill accountId when add-line dialog is open and accountOptions loads
  useEffect(() => {
    if (!dialogOpen) return;
    setNewLine((current) => ({
      ...current,
      accountId: current.accountId || workspace.accountOptions[0]?.id || '',
    }));
  }, [dialogOpen, workspace.accountOptions]);

  const highlightedAccount = searchParams.get('account');

  const selectedBudget =
    workspace.budgets.find((budget) => String(budget.id) === String(selectedBudgetId)) ||
    workspace.budgets[0] ||
    null;

  const summary = useMemo(() => {
    if (!selectedBudget) return null;
    return {
      planned: selectedBudget.lines.reduce((sum, line) => sum + line.planned, 0),
      actual: selectedBudget.lines.reduce((sum, line) => sum + line.actual, 0),
      commitments: selectedBudget.lines.reduce((sum, line) => sum + line.commitments, 0),
      encumbrance: selectedBudget.lines.reduce((sum, line) => sum + line.encumbrance, 0),
    };
  }, [selectedBudget]);

  const runAction = async (label, action, successMessage) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Owner</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Planned
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Actual
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Commitments
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Encumbrance
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Available
          </th>
        </tr>
      </thead>
      <tbody>
        {(selectedBudget?.lines || []).map((line) => (
          <tr key={line.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {line.accountCode} • {line.accountName}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.owner}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.planned}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.actual}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.commitments}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.encumbrance}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.available}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const updateDraft = (lineId, field, value) => {
    setDrafts((current) => ({
      ...current,
      [lineId]: {
        ...(current[lineId] || {}),
        [field]: value,
      },
    }));
  };

  const saveLine = (line) => {
    const draft = drafts[line.id];
    if (!draft || !selectedBudget) return;

    runAction(
      'Save Budget Line',
      async () => workspace.actions.updateBudgetLine(selectedBudget.id, line.id, draft),
      `${line.accountCode} line updated`
    ).then(() => {
      setDrafts((current) => {
        const next = { ...current };
        delete next[line.id];
        return next;
      });
    });
  };

  const addLine = () => {
    if (!selectedBudget) return;

    if (!newLine.accountId) {
      toast.error('Account is required');
      return;
    }

    if (Number(newLine.planned) <= 0) {
      toast.error('Planned amount must be greater than zero');
      return;
    }

    runAction(
      'Add Budget Line',
      async () => {
        await workspace.actions.addBudgetLine(selectedBudget.id, newLine);
      },
      'Budget line added'
    ).then(() => {
      setDialogOpen(false);
      setNewLine(DEFAULT_NEW_LINE);
    });
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Budget Lines
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Editable account-level planning grid with owner assignments, commitments, and
            encumbrance.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => {
            setNewLine({
              ...DEFAULT_NEW_LINE,
              accountId: workspace.accountOptions[0]?.id || '',
            });
            setDialogOpen(true);
          }}
        >
          Add Line
        </Button>
      </Stack>

      <BudgetsWorkspaceToolbar printTitle="Budget Lines" printContent={printContent} />

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <TextField
            select
            fullWidth
            label="Select Budget"
            value={selectedBudget?.id || ''}
            onChange={(event) => setSelectedBudgetId(event.target.value)}
          >
            {workspace.budgets.map((budget) => (
              <MenuItem key={budget.id} value={budget.id}>
                {budget.name} • {budget.department} • {budget.fiscalYear}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {selectedBudget && summary && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Planned
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatCurrency(summary.planned)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Actual
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatCurrency(summary.actual)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Commitments
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatCurrency(summary.commitments)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    Encumbrance
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatCurrency(summary.encumbrance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, xl: 8 }}>
              <Card sx={{ borderRadius: 3 }}>
                {workspace.isLoading && workspace.budgets.length === 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Account</TableCell>
                          <TableCell>Owner</TableCell>
                          <TableCell align="right">Planned</TableCell>
                          <TableCell align="right">Actual</TableCell>
                          <TableCell align="right">Commitments</TableCell>
                          <TableCell align="right">Encumbrance</TableCell>
                          <TableCell align="right">Available</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedBudget.lines.map((line) => {
                          const draft = drafts[line.id] || {};
                          const current = { ...line, ...draft };
                          return (
                            <TableRow
                              key={line.id}
                              hover
                              selected={String(line.accountCode) === String(highlightedAccount)}
                            >
                              <TableCell>
                                <Stack spacing={0.4}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {line.accountCode} • {line.accountName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {line.note}
                                    {String(line.accountCode) === String(highlightedAccount)
                                      ? ' • Focused from Budget vs Actual'
                                      : ''}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell sx={{ minWidth: 180 }}>
                                <TextField
                                  select
                                  size="small"
                                  fullWidth
                                  value={current.owner}
                                  onChange={(event) =>
                                    updateDraft(line.id, 'owner', event.target.value)
                                  }
                                >
                                  {workspace.ownerOptions.map((owner) => (
                                    <MenuItem key={owner} value={owner}>
                                      {owner}
                                    </MenuItem>
                                  ))}
                                </TextField>
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={current.planned}
                                  onChange={(event) =>
                                    updateDraft(line.id, 'planned', Number(event.target.value))
                                  }
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={current.actual}
                                  onChange={(event) =>
                                    updateDraft(line.id, 'actual', Number(event.target.value))
                                  }
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={current.commitments}
                                  onChange={(event) =>
                                    updateDraft(line.id, 'commitments', Number(event.target.value))
                                  }
                                />
                              </TableCell>
                              <TableCell align="right" sx={{ minWidth: 120 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={current.encumbrance}
                                  onChange={(event) =>
                                    updateDraft(line.id, 'encumbrance', Number(event.target.value))
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={formatCurrency(
                                    Number(current.planned || 0) -
                                      Number(current.actual || 0) -
                                      Number(current.commitments || 0) -
                                      Number(current.encumbrance || 0)
                                  )}
                                  size="small"
                                  color={
                                    Number(current.planned || 0) -
                                      Number(current.actual || 0) -
                                      Number(current.commitments || 0) -
                                      Number(current.encumbrance || 0) <
                                    0
                                      ? 'error'
                                      : 'success'
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => saveLine(line)}
                                  disabled={!drafts[line.id] || pendingAction !== null}
                                >
                                  Save
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Grid>

            <Grid size={{ xs: 12, xl: 4 }}>
              <Card sx={{ borderRadius: 3, mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Plan Period Spread
                  </Typography>
                  <Stack spacing={1.25}>
                    {selectedBudget.actualsByPeriod.map((period) => (
                      <Box key={period.label}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" fontWeight={700}>
                            {period.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(period.actual)} actual
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Planned {formatCurrency(period.planned)} • Commitments{' '}
                          {formatCurrency(period.commitments)} • Encumbrance{' '}
                          {formatCurrency(period.encumbrance)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Owner Coverage
                  </Typography>
                  <Stack spacing={1.25}>
                    {selectedBudget.lines.map((line) => (
                      <Stack key={line.id} direction="row" justifyContent="space-between">
                        <Typography variant="body2">{line.accountCode}</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {line.owner}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Budget Line</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              select
              label="Account"
              value={newLine.accountId}
              onChange={(event) =>
                setNewLine((current) => ({ ...current, accountId: Number(event.target.value) }))
              }
              fullWidth
            >
              {workspace.accountOptions.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.code} • {account.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Owner"
              value={newLine.owner}
              onChange={(event) =>
                setNewLine((current) => ({ ...current, owner: event.target.value }))
              }
              fullWidth
            >
              {workspace.ownerOptions.map((owner) => (
                <MenuItem key={owner} value={owner}>
                  {owner}
                </MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Planned"
                  type="number"
                  value={newLine.planned}
                  onChange={(event) =>
                    setNewLine((current) => ({ ...current, planned: Number(event.target.value) }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Actual"
                  type="number"
                  value={newLine.actual}
                  onChange={(event) =>
                    setNewLine((current) => ({ ...current, actual: Number(event.target.value) }))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Commitments"
                  type="number"
                  value={newLine.commitments}
                  onChange={(event) =>
                    setNewLine((current) => ({
                      ...current,
                      commitments: Number(event.target.value),
                    }))
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Encumbrance"
                  type="number"
                  value={newLine.encumbrance}
                  onChange={(event) =>
                    setNewLine((current) => ({
                      ...current,
                      encumbrance: Number(event.target.value),
                    }))
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Note"
              value={newLine.note}
              onChange={(event) =>
                setNewLine((current) => ({ ...current, note: event.target.value }))
              }
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={addLine}
            disabled={pendingAction !== null || Number(newLine.planned) <= 0}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default BudgetLines;
