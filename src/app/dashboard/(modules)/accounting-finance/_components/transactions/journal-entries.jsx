'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import AlertTitle from '@mui/material/AlertTitle';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { sumLines, TRANSACTION_LOCK_DATE } from './mock-data';
import { useJournalEntriesApi } from './use-journal-entries-api';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
  cancelled: 'error',
};

const APPROVAL_COLORS = {
  approved: 'success',
  pending_review: 'warning',
  pending_approval: 'info',
  needs_changes: 'error',
};

const EMPTY_LINE = {
  description: '',
  account_id: null,
  account_code: '',
  account_name: '',
  analytic: '',
  analytic_account: '',
  cost_center: '',
  taxCode: 'N/A',
  debit: '',
  credit: '',
};

const EMPTY_ENTRY = {
  number: 'AUTO',
  date: '2026-03-29',
  journal_id: 'general',
  reference: '',
  narration: '',
  recurring: false,
  fiscal_period: '',
  lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE }],
};

function formatApprovalLabel(value) {
  return value.replace(/_/g, ' ');
}

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [journalId, setJournalId] = useState('all');
  const [approvalState, setApprovalState] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardState, setWizardState] = useState(EMPTY_ENTRY);
  const [wizardMode, setWizardMode] = useState('create');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Accounts for the line picker ──────────────────────────
  const { data: rawAccounts } = useSWR(endpoints.accounting.accounts, fetcher);
  const accounts = useMemo(() => {
    if (Array.isArray(rawAccounts)) return rawAccounts;
    if (Array.isArray(rawAccounts?.results)) return rawAccounts.results;
    return [];
  }, [rawAccounts]);

  // ── Fiscal periods, analytic accounts, cost centers ──────
  const { data: rawFiscalPeriods } = useSWR(endpoints.accounting.fiscal_periods, fetcher);
  const { data: rawAnalyticAccounts } = useSWR(endpoints.accounting.analytic_accounts, fetcher);
  const { data: rawCostCenters } = useSWR(endpoints.accounting.cost_centers, fetcher);

  const fiscalPeriods = useMemo(() => {
    const list = Array.isArray(rawFiscalPeriods)
      ? rawFiscalPeriods
      : Array.isArray(rawFiscalPeriods?.results)
        ? rawFiscalPeriods.results
        : [];
    return list;
  }, [rawFiscalPeriods]);

  const analyticAccounts = useMemo(() => {
    const list = Array.isArray(rawAnalyticAccounts)
      ? rawAnalyticAccounts
      : Array.isArray(rawAnalyticAccounts?.results)
        ? rawAnalyticAccounts.results
        : [];
    return list;
  }, [rawAnalyticAccounts]);

  const costCenters = useMemo(() => {
    const list = Array.isArray(rawCostCenters)
      ? rawCostCenters
      : Array.isArray(rawCostCenters?.results)
        ? rawCostCenters.results
        : [];
    return list;
  }, [rawCostCenters]);

  // ── API data ────────────────────────────────────────────────
  const api = useJournalEntriesApi();
  const { journals } = api;

  const hasSelectedDefault = useRef(false);
  useEffect(() => {
    if (!api.loading) {
      setEntries((current) => {
        const localOnly = current.filter((e) => String(e.id).startsWith('je-mock-'));
        if (api.isValidating && api.entries.length === 0) return current;
        const apiIds = new Set(api.entries.map((e) => String(e.id)));
        const pendingMocks = localOnly.filter((e) => !apiIds.has(String(e.id)));
        return [...api.entries, ...pendingMocks];
      });
      if (!hasSelectedDefault.current && api.entries.length > 0) {
        hasSelectedDefault.current = true;
        setSelectedEntryId(api.entries[0].id);
      }
    }
  }, [api.entries, api.loading, api.isValidating]);

  const getJournalById = (id) => journals.find((j) => String(j.id) === String(id)) || null;

  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const haystack = `${entry.number} ${entry.narration} ${entry.reference}`.toLowerCase();
        if (search && !haystack.includes(search.toLowerCase())) return false;
        if (status !== 'all' && entry.status !== status) return false;
        if (journalId !== 'all' && String(entry.journal_id) !== String(journalId)) return false;
        if (approvalState !== 'all' && entry.approvalState !== approvalState) return false;
        return true;
      }),
    [approvalState, entries, journalId, search, status]
  );

  const entryInsights = useMemo(
    () =>
      entries.map((entry) => {
        const totalDebit = entry.lines?.length
          ? sumLines(entry.lines, 'debit')
          : Number(entry.totalDebit || 0);
        const totalCredit = entry.lines?.length
          ? sumLines(entry.lines, 'credit')
          : Number(entry.totalCredit || 0);
        const isLockedByDate = new Date(entry.date) < new Date(TRANSACTION_LOCK_DATE);
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;
        const readyToPost =
          entry.status === 'draft' &&
          isBalanced &&
          !isLockedByDate &&
          entry.approvalState === 'approved';

        return {
          ...entry,
          totalDebit,
          totalCredit,
          isLockedByDate,
          isBalanced,
          readyToPost,
          progressScore: [isBalanced, !isLockedByDate, entry.approvalState === 'approved'].filter(
            Boolean
          ).length,
        };
      }),
    [entries]
  );

  const filteredInsights = filteredEntries.map(
    (entry) => entryInsights.find((item) => item.id === entry.id) || entry
  );

  const draftCount = entries.filter((entry) => entry.status === 'draft').length;
  const pendingApprovalCount = entries.filter((entry) => entry.approvalState !== 'approved').length;
  const recurringCount = entries.filter((entry) => entry.recurring).length;
  const selectedDrafts = entryInsights.filter(
    (entry) => selectedIds.includes(entry.id) && entry.status === 'draft'
  );
  const postableSelectedDrafts = selectedDrafts.filter((entry) => entry.readyToPost);
  const selectedDraftValue = selectedDrafts.reduce(
    (sum, entry) => sum + (entry.totalDebit || 0),
    0
  );
  const outOfBalanceDrafts = entryInsights.filter(
    (entry) => entry.status === 'draft' && !entry.isBalanced
  ).length;
  const readyDrafts = entryInsights.filter((entry) => entry.readyToPost).length;
  const selectedEntry =
    filteredInsights.find((entry) => entry.id === selectedEntryId) ||
    entryInsights.find((entry) => entry.id === selectedEntryId) ||
    filteredInsights[0] ||
    entryInsights[0] ||
    null;

  const toggleSelection = (entryId) => {
    setSelectedIds((current) =>
      current.includes(entryId) ? current.filter((item) => item !== entryId) : [...current, entryId]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredEntries.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(filteredEntries.map((entry) => entry.id));
  };

  const handleBatchPost = async () => {
    if (!postableSelectedDrafts.length) return;

    setEntries((current) =>
      current.map((entry) =>
        postableSelectedDrafts.some((item) => item.id === entry.id)
          ? { ...entry, status: 'posted', approvalState: 'approved', locked: true }
          : entry
      )
    );
    setSelectedIds((current) =>
      current.filter((id) => !postableSelectedDrafts.some((item) => item.id === id))
    );

    const apiEntries = postableSelectedDrafts.filter(
      (entry) => !String(entry.id).startsWith('je-mock-')
    );
    if (apiEntries.length) {
      await Promise.allSettled(
        apiEntries.map((entry) =>
          axiosInstance
            .post(endpoints.accounting.journal_entry_post(entry.id))
            .catch((err) => console.error('Post entry failed', entry.id, err))
        )
      );
      await api.actions.refetch();
    }
  };

  const openCreateWizard = () => {
    setWizardMode('create');
    setEditingEntryId(null);
    setWizardState({
      ...EMPTY_ENTRY,
      journal_id: journals[0]?.id ?? EMPTY_ENTRY.journal_id,
    });
    setWizardOpen(true);
  };

  const handleDeleteEntry = async () => {
    if (!deleteTarget) return;
    try {
      await api.actions.deleteEntry(deleteTarget.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditWizard = (entry) => {
    setWizardMode('edit');
    setEditingEntryId(entry.id);
    setWizardState({
      number: entry.number,
      date: entry.date,
      journal_id: entry.journal_id,
      fiscal_period: entry.fiscal_period || '',
      reference: entry.reference || '',
      narration: entry.narration || '',
      recurring: Boolean(entry.recurring),
      lines: (entry.lines || []).map((line) => ({
        description: line.description || '',
        account_id: line.account_id || null,
        account_code: line.account_code || '',
        account_name: line.account_name || '',
        analytic: line.analytic || '',
        analytic_account: line.analytic_account || '',
        cost_center: line.cost_center || '',
        taxCode: line.taxCode || 'N/A',
        debit: line.debit || '',
        credit: line.credit || '',
      })),
    });
    setWizardOpen(true);
  };

  const updateWizard = (field, value) => {
    setWizardState((current) => ({ ...current, [field]: value }));
  };

  const updateWizardLine = (index, field, value) => {
    setWizardState((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line
      ),
    }));
  };

  const addWizardLine = () => {
    setWizardState((current) => ({
      ...current,
      lines: [...current.lines, { ...EMPTY_LINE }],
    }));
  };

  const removeWizardLine = (index) => {
    setWizardState((current) => ({
      ...current,
      lines:
        current.lines.length <= 2
          ? current.lines
          : current.lines.filter((_, lineIndex) => lineIndex !== index),
    }));
  };

  const wizardTotals = useMemo(
    () => ({
      debit: wizardState.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0),
      credit: wizardState.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0),
    }),
    [wizardState.lines]
  );
  const wizardBalanced = wizardTotals.debit === wizardTotals.credit;

  const handleCreateJournal = async () => {
    const preparedEntry = {
      date: wizardState.date,
      journal_id: wizardState.journal_id,
      fiscal_period: wizardState.fiscal_period ? Number(wizardState.fiscal_period) : undefined,
      reference: wizardState.reference,
      narration: wizardState.narration,
      status: 'draft',
      approvalState: wizardBalanced ? 'pending_review' : 'needs_changes',
      recurring: wizardState.recurring,
      recurringLabel: wizardState.recurring ? 'Recurring draft template' : undefined,
      locked: false,
      preparedBy: 'User',
      reviewer: 'Finance Manager',
      tags: ['manual'],
      attachmentCount: 0,
      lines: wizardState.lines.map((line) => ({
        description: line.description || 'Line item',
        account_id: line.account_id,
        account_code: line.account_code || '',
        account_name: line.account_name || '',
        analytic: line.analytic || '',
        analytic_account: line.analytic_account ? Number(line.analytic_account) : undefined,
        cost_center: line.cost_center ? Number(line.cost_center) : undefined,
        taxCode: line.taxCode || 'N/A',
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
      })),
    };

    if (wizardMode === 'edit' && editingEntryId) {
      const isApiEntry = !String(editingEntryId).startsWith('je-mock-');
      if (isApiEntry) {
        try {
          await api.actions.updateEntry(editingEntryId, wizardState);
        } catch (err) {
          console.error('Failed to update journal entry on backend:', err);
        }
      }
      setEntries((current) =>
        current.map((entry) =>
          entry.id === editingEntryId
            ? {
                ...entry,
                ...preparedEntry,
                activity: [
                  {
                    id: `draft-edit-${Date.now()}`,
                    type: 'note',
                    author: 'User',
                    time: 'Now',
                    message: 'Draft journal updated.',
                  },
                  ...(entry.activity || []),
                ],
              }
            : entry
        )
      );
    } else {
      const isValidJournalId =
        wizardState.journal_id &&
        !Number.isNaN(Number(wizardState.journal_id)) &&
        journals.length > 0;

      if (isValidJournalId) {
        if (isValidJournalId) {
          // Validate all lines have an account selected
          const missingAccount = wizardState.lines.some((line) => !line.account_id);
          if (missingAccount) {
            alert('Please select an account for every journal line before saving.');
            return;
          }

          try {
            const createdEntry = await api.actions.createEntry(wizardState);
            if (createdEntry?.id) {
              setEntries((current) => {
                if (current.some((e) => String(e.id) === String(createdEntry.id))) return current;
                return [createdEntry, ...current];
              });
              setSelectedEntryId(createdEntry.id);
            }
            setWizardState(EMPTY_ENTRY);
            setWizardMode('create');
            setEditingEntryId(null);
            setWizardOpen(false);
            return;
          } catch (err) {
            console.error('Failed to create journal entry on backend:', JSON.stringify(err));
          }

          const newEntry = {
            id: `je-mock-${Date.now()}`,
            number: `JE-${new Date().getFullYear()}-${String(entries.length + 31).padStart(3, '0')}`,
            ...preparedEntry,
            attachments: [],
            activity: [
              {
                id: 'draft-create',
                type: 'note',
                author: 'User',
                time: 'Now',
                message: 'Draft journal created locally (pending backend sync).',
              },
            ],
          };

          setEntries((current) => [newEntry, ...current]);
          setSelectedEntryId(newEntry.id);
        }

        setWizardState(EMPTY_ENTRY);
        setWizardMode('create');
        setEditingEntryId(null);
        setWizardOpen(false);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Journal Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Journal workspace with draft control, approval state, batch post, and recurring entry
            tracking.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            onClick={handleBatchPost}
            disabled={!postableSelectedDrafts.length}
          >
            Batch Post Drafts
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={openCreateWizard}
          >
            New Journal Entry
          </Button>
        </Stack>
      </Stack>

      {api.loading && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <AlertTitle>Loading journal entries</AlertTitle>
          Fetching entries from the accounting backend…
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Draft journals',
            value: draftCount,
            color: '#2563eb',
            icon: 'solar:document-add-bold-duotone',
          },
          {
            label: 'Pending approvals',
            value: pendingApprovalCount,
            color: '#f59e0b',
            icon: 'solar:shield-warning-bold-duotone',
          },
          {
            label: 'Ready to post',
            value: readyDrafts,
            color: '#0891b2',
            icon: 'solar:verified-check-bold-duotone',
          },
          {
            label: 'Recurring templates',
            value: recurringCount,
            color: '#8b5cf6',
            icon: 'solar:restart-bold-duotone',
          },
          {
            label: 'Out of balance drafts',
            value: outOfBalanceDrafts,
            color: '#dc2626',
            icon: 'solar:danger-triangle-bold-duotone',
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
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
                  <Box sx={{ color: card.color }}>
                    <Iconify icon={card.icon} width={28} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search number, narration, or reference"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All status</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="posted">Posted</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              value={journalId}
              onChange={(event) => setJournalId(event.target.value)}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="all">All journals</MenuItem>
              {journals.map((journal) => (
                <MenuItem key={journal.id} value={journal.id}>
                  {journal.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              value={approvalState}
              onChange={(event) => setApprovalState(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="all">All approvals</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="pending_review">Pending review</MenuItem>
              <MenuItem value="pending_approval">Pending approval</MenuItem>
              <MenuItem value="needs_changes">Needs changes</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 12 }}>
          {/*
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Journal Control Queue
              </Typography>
              <Stack spacing={1.5}>
                {filteredInsights.slice(0, 3).map((entry) => (
                  <Box key={entry.id}>
                    <Stack direction="row" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.number}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.narration}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          entry.readyToPost
                            ? 'Ready'
                            : !entry.isBalanced
                              ? 'Unbalanced'
                              : entry.isLockedByDate
                                ? 'Locked'
                                : formatApprovalLabel(entry.approvalState)
                        }
                        size="small"
                        color={
                          entry.readyToPost
                            ? 'success'
                            : !entry.isBalanced || entry.isLockedByDate
                              ? 'error'
                              : APPROVAL_COLORS[entry.approvalState]
                        }
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(entry.progressScore / 3) * 100}
                      sx={{ mt: 1.25, height: 8, borderRadius: 999 }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(entry.totalDebit)} debit /{' '}
                        {formatCurrency(entry.totalCredit)} credit
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {entry.approvalState === 'approved'
                          ? 'Approval complete'
                          : `Approval ${formatApprovalLabel(entry.approvalState)}`}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
          */}
          <Card sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={
                          !!filteredEntries.length && selectedIds.length === filteredEntries.length
                        }
                        indeterminate={
                          selectedIds.length > 0 && selectedIds.length < filteredEntries.length
                        }
                        onChange={toggleAll}
                      />
                    </TableCell>
                    <TableCell>Entry #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Journal</TableCell>
                    <TableCell>Narration</TableCell>
                    <TableCell>Approval</TableCell>
                    <TableCell>Lock</TableCell>
                    <TableCell align="right">Debit</TableCell>
                    <TableCell align="right">Credit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInsights.map((entry) => {
                    const journal = getJournalById(entry.journal_id);

                    return (
                      <TableRow
                        key={entry.id}
                        hover
                        selected={selectedEntry?.id === entry.id}
                        onClick={() => setSelectedEntryId(entry.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedIds.includes(entry.id)}
                            onChange={() => toggleSelection(entry.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.5}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {entry.number}
                            </Typography>
                            {entry.recurring && (
                              <Chip
                                label={entry.recurringLabel || 'Recurring'}
                                size="small"
                                variant="outlined"
                                sx={{ width: 'fit-content' }}
                              />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={journal?.code || 'GEN'}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22 }}
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {entry.narration}
                          </Typography>
                          
                          {(entry.lines || []).length > 0 && (
                            <Box sx={{ mt: 0.75 }}>
                              
                              {(entry.lines || []).map((line, idx) => (
                                <Typography key={idx} variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                                  {line.account_code || ''}-{line.account_name || line.description || ''}
                                  {Number(line.debit || 0) > 0 && (
                                    <span style={{ fontWeight: 700, color: '#16a34a', marginLeft: 4 }}>DR</span>
                                  )}
                                  {Number(line.credit || 0) > 0 && (
                                    <span style={{ fontWeight: 700, color: '#2563eb', marginLeft: 4 }}>CR</span>
                                  )}
                                </Typography>
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatApprovalLabel(entry.approvalState)}
                            size="small"
                            color={APPROVAL_COLORS[entry.approvalState]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          {entry.isLockedByDate ? (
                            <Chip label="Locked" size="small" color="error" />
                          ) : (
                            <Chip label="Open" size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(entry.totalDebit)}</TableCell>
                        <TableCell align="right">{formatCurrency(entry.totalCredit)}</TableCell>
                        <TableCell>
                          <Chip
                            label={entry.status}
                            size="small"
                            color={STATUS_COLORS[entry.status]}
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Button
                              component={Link}
                              href={paths.dashboard.accountingFinance.transactions.journalEntryDetail(
                                entry.id
                              )}
                              size="small"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Open
                            </Button>
                            {!entry.isLockedByDate && entry.status === 'draft' && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditWizard(entry);
                                }}
                              >
                                Edit
                              </Button>
                            )}
                            {!entry.isLockedByDate && entry.status === 'draft' && (
                              <Tooltip title="Delete entry">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setDeleteTarget(entry);
                                  }}
                                >
                                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
        {/*
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Selected Journal
              </Typography>
              {selectedEntry ? (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      {selectedEntry.number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEntry.narration}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      label={selectedEntry.status}
                      size="small"
                      color={STATUS_COLORS[selectedEntry.status]}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Chip
                      label={formatApprovalLabel(selectedEntry.approvalState)}
                      size="small"
                      color={APPROVAL_COLORS[selectedEntry.approvalState]}
                      variant="outlined"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(selectedEntry.progressScore / 3) * 100}
                    sx={{ height: 10, borderRadius: 999 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Posting readiness {Math.round((selectedEntry.progressScore / 3) * 100)}%
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Debit
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(selectedEntry.totalDebit)}
                      </Typography>
                    </Grid>
                    <Grid size={6}>
                      <Typography variant="caption" color="text.secondary">
                        Credit
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(selectedEntry.totalCredit)}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Alert
                    severity={
                      selectedEntry.readyToPost
                        ? 'success'
                        : !selectedEntry.isBalanced || selectedEntry.isLockedByDate
                          ? 'warning'
                          : 'info'
                    }
                  >
                    {selectedEntry.readyToPost
                      ? 'Entry is ready for posting.'
                      : !selectedEntry.isBalanced
                        ? 'Entry must balance before review and posting.'
                        : selectedEntry.isLockedByDate
                          ? 'Entry is inside a locked period and needs controlled adjustment handling.'
                          : 'Entry still needs approval clearance before posting.'}
                  </Alert>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Control Review
                    </Typography>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Recurring template</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedEntry.recurring ? 'Yes' : 'No'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Attachments</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedEntry.attachmentCount || 0}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Reviewer</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedEntry.reviewer || 'Unassigned'}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      component={Link}
                      href={paths.dashboard.accountingFinance.transactions.journalEntryDetail(
                        selectedEntry.id
                      )}
                      variant="outlined"
                      fullWidth
                    >
                      Open Detail
                    </Button>
                    {!selectedEntry.isLockedByDate && selectedEntry.status === 'draft' && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => openEditWizard(selectedEntry)}
                      >
                        Edit Draft
                      </Button>
                    )}
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a journal entry to review readiness, balance, and approval posture.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                Batch Posting Controls
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Selected drafts</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedDrafts.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Eligible to post</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {postableSelectedDrafts.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Selected draft value</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCurrency(selectedDraftValue)}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        */}
      </Grid>

      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {wizardMode === 'edit' ? 'Edit Journal Entry' : 'Create Journal Entry'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5, mb: 2 }}>
            <Alert severity={wizardBalanced ? 'success' : 'warning'}>
              {wizardBalanced
                ? 'Draft is balanced and can move into review.'
                : 'Draft is out of balance. Approval will stay in needs changes until debit equals credit.'}
            </Alert>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Chip label={`Debit ${formatCurrency(wizardTotals.debit)}`} size="small" />
              <Chip label={`Credit ${formatCurrency(wizardTotals.credit)}`} size="small" />
            </Stack>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Date"
                type="date"
                value={wizardState.date}
                onChange={(event) => updateWizard('date', event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Journal"
                value={wizardState.journal_id}
                onChange={(event) => updateWizard('journal_id', event.target.value)}
              >
                {journals.map((journal) => (
                  <MenuItem key={journal.id} value={journal.id}>
                    {journal.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Reference"
                value={wizardState.reference}
                onChange={(event) => updateWizard('reference', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Recurring"
                value={wizardState.recurring ? 'yes' : 'no'}
                onChange={(event) => updateWizard('recurring', event.target.value === 'yes')}
              >
                <MenuItem value="no">One time</MenuItem>
                <MenuItem value="yes">Recurring</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Fiscal Period"
                value={wizardState.fiscal_period}
                onChange={(event) => updateWizard('fiscal_period', event.target.value)}
              >
                <MenuItem value="">Select period</MenuItem>
                {fiscalPeriods.map((fp) => (
                  <MenuItem key={fp.id} value={fp.id}>
                    {fp.name || fp.code || `Period ${fp.id}`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Narration"
                value={wizardState.narration}
                onChange={(event) => updateWizard('narration', event.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1.5 }}>
            Journal Lines
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell colSpan={2}>Account</TableCell>
                  <TableCell>Analytic Acct</TableCell>
                  <TableCell>Cost Center</TableCell>
                  <TableCell>Tax</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {wizardState.lines.map((line, index) => (
                  <TableRow key={`line-${index}`}>
                    {/* Description */}
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={line.description}
                        onChange={(event) =>
                          updateWizardLine(index, 'description', event.target.value)
                        }
                      />
                    </TableCell>

                    {/* Account picker — replaces the old Account Code + Account Name text fields */}
                    <TableCell colSpan={2}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={line.account_id || ''}
                        onChange={(e) => {
                          const selected = accounts.find((a) => a.id === Number(e.target.value));
                          updateWizardLine(index, 'account_id', selected?.id ?? null);
                          updateWizardLine(index, 'account_code', selected?.code ?? '');
                          updateWizardLine(index, 'account_name', selected?.name ?? '');
                        }}
                      >
                        <MenuItem value="">Select account</MenuItem>
                        {accounts.map((a) => (
                          <MenuItem key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    {/* Analytic Account */}
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={line.analytic_account}
                        onChange={(event) =>
                          updateWizardLine(index, 'analytic_account', event.target.value)
                        }
                      >
                        <MenuItem value="">Select</MenuItem>
                        {analyticAccounts.map((aa) => (
                          <MenuItem key={aa.id} value={aa.id}>
                            {aa.code} — {aa.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    {/* Cost Center */}
                    <TableCell>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        value={line.cost_center}
                        onChange={(event) =>
                          updateWizardLine(index, 'cost_center', event.target.value)
                        }
                      >
                        <MenuItem value="">Select</MenuItem>
                        {costCenters.map((cc) => (
                          <MenuItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>

                    {/* Tax */}
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        value={line.taxCode}
                        onChange={(event) => updateWizardLine(index, 'taxCode', event.target.value)}
                      />
                    </TableCell>

                    {/* Debit */}
                    <TableCell>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={line.debit}
                        onChange={(event) => updateWizardLine(index, 'debit', event.target.value)}
                      />
                    </TableCell>

                    {/* Credit + Remove */}
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={line.credit}
                          onChange={(event) =>
                            updateWizardLine(index, 'credit', event.target.value)
                          }
                        />
                        <Button
                          color="error"
                          onClick={() => removeWizardLine(index)}
                          disabled={wizardState.lines.length <= 2}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button
            onClick={addWizardLine}
            size="small"
            sx={{ mt: 1.5 }}
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Add line
          </Button>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setWizardOpen(false);
              setWizardState(EMPTY_ENTRY);
              setWizardMode('create');
              setEditingEntryId(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateJournal}>
            {wizardMode === 'edit' ? 'Update Draft' : 'Save Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Journal Entry?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete journal entry <strong>{deleteTarget?.number}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteEntry}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
