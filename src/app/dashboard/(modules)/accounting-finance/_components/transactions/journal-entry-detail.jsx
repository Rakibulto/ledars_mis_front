'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import { sumLines, getJournalById, getJournalEntryById, TRANSACTION_LOCK_DATE } from './mock-data';
import {
  TimelineCard,
  ControlChecksCard,
  ReferenceLinksCard,
  TransactionRecordNotFound,
} from './transaction-detail-shell';
import {
  exportCsvFile,
  exportJsonFile,
  formatCurrency,
  exportExcelWorkbook,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  posted: 'success',
  cancelled: 'error',
  reversed: 'error',
};

const APPROVAL_COLORS = {
  approved: 'success',
  pending_review: 'warning',
  pending_approval: 'info',
  needs_changes: 'error',
};

function formatApprovalLabel(value) {
  return value ? value.replace(/_/g, ' ') : 'Pending review';
}

function MetricCard({ label, value, helper, icon, tone = 'primary', progress, progressLabel }) {
  return (
    <Card
      sx={(theme) => {
        const color = theme.palette[tone]?.main || theme.palette.primary.main;

        return {
          height: '100%',
          borderRadius: 3,
          border: `1px solid ${alpha(color, 0.14)}`,
          boxShadow: 'none',
          background: `linear-gradient(180deg, ${alpha(color, 0.04)} 0%, ${theme.palette.background.paper} 100%)`,
        };
      }}
    >
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1.15 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={(theme) => {
              const color = theme.palette[tone]?.main || theme.palette.primary.main;

              return {
                width: 44,
                height: 44,
                borderRadius: 2.25,
                display: 'grid',
                placeItems: 'center',
                bgcolor: alpha(color, 0.12),
                color,
                flexShrink: 0,
              };
            }}
          >
            <Iconify icon={icon} width={22} />
          </Box>
        </Stack>

        {progress !== undefined && progress !== null ? (
          <Box sx={{ mt: 1.5 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.75, display: 'block' }}
            >
              {progressLabel || helper}
            </Typography>
          </Box>
        ) : helper ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {helper}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailTile({ label, value, highlight = false }) {
  return (
    <Box
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 2.25,
        bgcolor: highlight ? alpha(theme.palette.primary.main, 0.06) : 'background.neutral',
        border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
        minHeight: 76,
      })}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, lineHeight: 1.45 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

function deriveApprovalState(status) {
  if (status === 'posted') return 'approved';
  if (status === 'cancelled' || status === 'reversed') return 'needs_changes';
  if (status === 'pending') return 'pending_review';
  return 'pending_review';
}

function formatActivityStamp(value) {
  if (!value) return 'Now';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString();
}

function formatDateValue(value, fallback = '-') {
  if (!value) return fallback;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleDateString();
}

function normalizeJournalLine(line = {}) {
  const taxValue = line.taxCode ?? line.tax_code ?? line.tax;

  return {
    ...line,
    description: line.description || line.label || line.account_name || 'Line item',
    account_id: line.account_id ?? line.account ?? null,
    account_code: line.account_code || '',
    account_name: line.account_name || '',
    analytic: line.analytic || line.analytic_account_name || '',
    taxCode:
      typeof taxValue === 'object'
        ? taxValue?.code || taxValue?.name || 'N/A'
        : taxValue !== undefined && taxValue !== null && taxValue !== ''
          ? String(taxValue)
          : 'N/A',
    debit: Number(line.debit || 0),
    credit: Number(line.credit || 0),
    balance: Number(line.balance ?? Number(line.debit || 0) - Number(line.credit || 0)),
  };
}

function buildJournalActivity(record, preparedBy, postedBy) {
  const activity = [];

  if (record.created_at || record.createdAt || preparedBy) {
    activity.push({
      id: 'created',
      type: 'note',
      author: preparedBy || 'System',
      time: formatActivityStamp(record.created_at || record.createdAt),
      message: record.source_document
        ? `Journal entry created from ${record.source_document}.`
        : 'Journal entry created.',
    });
  }

  if (record.posted_at || record.postedAt || record.status === 'posted') {
    activity.push({
      id: 'posted',
      type: 'approval',
      author: postedBy || 'Finance Manager',
      time: formatActivityStamp(record.posted_at || record.postedAt || record.updated_at),
      message:
        record.status === 'posted' ? 'Journal posted successfully.' : 'Posting workflow updated.',
    });
  }

  if (record.status === 'cancelled' || record.status === 'reversed') {
    activity.push({
      id: 'cancelled',
      type: 'reversal',
      author: postedBy || 'Finance Controller',
      time: formatActivityStamp(record.updated_at || record.posted_at || record.postedAt),
      message: 'Journal entry cancelled.',
    });
  }

  return activity;
}

function normalizeJournalEntry(record, source = 'api') {
  if (!record) return null;

  const journalId = record.journal_id ?? record.journal ?? null;
  const journalDetail = record.journal_detail || null;
  const journal =
    journalDetail ||
    (journalId !== null && journalId !== undefined ? getJournalById(journalId) : null);
  const rawLines =
    (Array.isArray(record.items) && record.items.length && record.items) ||
    (Array.isArray(record.lines) && record.lines.length && record.lines) ||
    [];
  const lines = rawLines.map(normalizeJournalLine);
  const totalDebit = Number(record.totalDebit ?? record.total_debit ?? sumLines(lines, 'debit'));
  const totalCredit = Number(
    record.totalCredit ?? record.total_credit ?? sumLines(lines, 'credit')
  );
  const preparedBy = record.created_by_name || record.preparedBy || 'System';
  const postedBy = record.posted_by_name || record.postedBy || 'Finance Manager';
  const approvalState = record.approvalState || deriveApprovalState(record.status);
  const isAutoGenerated = Boolean(record.is_auto_generated ?? record.recurring);
  const attachments = Array.isArray(record.attachments) ? record.attachments : [];
  const activity =
    (Array.isArray(record.activity) && record.activity.length && record.activity) ||
    buildJournalActivity(record, preparedBy, postedBy);

  return {
    ...record,
    source,
    journal_detail: journalDetail || journal || null,
    journal_id: journalId,
    journal_name: journal?.name || record.journal_name || 'General Journal',
    journal_code: journal?.code || record.journal_code || 'GEN',
    lines,
    items: lines,
    totalDebit,
    totalCredit,
    total_debit: totalDebit,
    total_credit: totalCredit,
    preparedBy,
    created_by_name: preparedBy,
    reviewer: record.reviewer || postedBy,
    posted_by_name: record.posted_by_name || postedBy,
    recurring: Boolean(record.recurring ?? isAutoGenerated),
    recurringLabel: record.recurringLabel || (isAutoGenerated ? 'Auto-generated entry' : undefined),
    is_auto_generated: isAutoGenerated,
    approvalState,
    attachments,
    activity,
    source_document: record.source_document || '',
  };
}

export default function JournalEntryDetail({ id: providedId }) {
  const params = useParams();
  const id = providedId ?? params?.id;
  const router = useRouter();
  const isNumeric = !Number.isNaN(Number(id));
  const entryUrl = isNumeric ? endpoints.accounting.journal_entry_by_id(id) : null;
  const { data: rawEntry, mutate: revalidateEntry, isLoading } = useSWR(entryUrl, fetcher);
  const mockEntry = useMemo(
    () => (!isNumeric ? (getJournalEntryById(id) ?? null) : null),
    [id, isNumeric]
  );
  const [entry, setEntry] = useState(() =>
    mockEntry ? normalizeJournalEntry(mockEntry, 'mock') : null
  );

  useEffect(() => {
    if (rawEntry) {
      setEntry(normalizeJournalEntry(rawEntry, 'api'));
      return;
    }

    if (!isNumeric) {
      setEntry(mockEntry ? normalizeJournalEntry(mockEntry, 'mock') : null);
    }
  }, [isNumeric, mockEntry, rawEntry]);

  const [reverseOpen, setReverseOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const totalDebit = useMemo(() => sumLines(entry?.lines || [], 'debit'), [entry]);
  const totalCredit = useMemo(() => sumLines(entry?.lines || [], 'credit'), [entry]);

  if (!entry) {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    return (
      <TransactionRecordNotFound
        title="Journal Entry Detail"
        backHref={paths.dashboard.accountingFinance.transactions.journalEntries}
      />
    );
  }

  const journal = entry.journal_detail || {
    name: entry.journal_name || 'General Journal',
    code: entry.journal_code || 'GEN',
  };
  const isLockedByDate = new Date(entry.date) < new Date(TRANSACTION_LOCK_DATE);
  const canEditLines = entry.status === 'draft' && !isLockedByDate;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
  const balanceAmount = totalDebit - totalCredit;
  const readinessScore = [isBalanced, !isLockedByDate, entry.approvalState === 'approved'].filter(
    Boolean
  ).length;
  const readinessPercent = Math.round((readinessScore / 3) * 100);
  const lineCount = entry.lines?.length || 0;
  const overviewTiles = [
    { label: 'Journal', value: journal.name || 'General Journal' },
    { label: 'Posting date', value: formatDateValue(entry.date) },
    { label: 'Reference', value: entry.reference || '-' },
    { label: 'Prepared by', value: entry.preparedBy || '-' },
    { label: 'Reviewer', value: entry.reviewer || '-' },
    { label: 'Source document', value: entry.source_document || '-' },
    { label: 'Line items', value: String(lineCount) },
    { label: 'Posted by', value: entry.posted_by_name || 'Not posted yet' },
    {
      label: 'Lock state',
      value: isLockedByDate ? 'Locked period' : 'Open period',
      highlight: true,
    },
  ];
  const activityCount = (entry.activity || []).length;
  const attachmentCount = entry.attachments?.length || 0;
  const heroMetrics = [
    {
      label: 'Total debit',
      value: formatCurrency(totalDebit),
      helper: `${lineCount} line${lineCount === 1 ? '' : 's'}`,
      icon: 'solar:arrow-up-bold',
      tone: 'primary',
    },
    {
      label: 'Total credit',
      value: formatCurrency(totalCredit),
      helper: isBalanced ? 'Balanced posting' : 'Needs review',
      icon: 'solar:arrow-down-bold',
      tone: 'secondary',
    },
    {
      label: 'Balance',
      value: formatCurrency(balanceAmount),
      helper: isBalanced ? 'No variance' : 'Debit minus credit',
      icon: 'solar:scale-bold',
      tone: isBalanced ? 'success' : 'warning',
    },
    {
      label: 'Readiness',
      value: `${readinessPercent}%`,
      helper: `${readinessScore}/3 checks satisfied`,
      icon: 'solar:shield-check-bold',
      tone: readinessPercent === 100 ? 'success' : 'info',
      progress: readinessPercent,
      progressLabel: 'Balance, lock, and approval signals',
    },
  ];
  const tableHeadCellSx = {
    fontWeight: 700,
    bgcolor: 'background.neutral',
  };

  const controlChecks = [
    {
      label: 'Debit and credit balance',
      description: 'Entries must remain balanced before approval and posting',
      status: isBalanced ? 'success' : 'error',
      value: isBalanced ? 'balanced' : 'out of balance',
    },
    {
      label: 'Period lock status',
      description: 'Entries before the lock date require controlled adjustment flow',
      status: isLockedByDate ? 'warning' : 'success',
      value: isLockedByDate ? 'locked period' : 'open period',
    },
    {
      label: 'Support documentation',
      description: 'Attachment coverage for audit readiness',
      status: entry.attachments?.length ? 'success' : 'warning',
      value: `${entry.attachments?.length || 0} files`,
    },
  ];

  const referenceLinks = [
    {
      label: 'Journal register',
      description: 'Return to the journal entry listing',
      href: paths.dashboard.accountingFinance.transactions.journalEntries,
      icon: 'solar:list-bold',
    },
    {
      label: 'Journal item register',
      description: 'Review related posting lines across entries',
      href: paths.dashboard.accountingFinance.transactions.journalItems,
      icon: 'solar:documents-bold',
    },
    {
      label: journal?.name || 'General ledger posting',
      description: 'Review broader posting drilldowns',
      href: paths.dashboard.accountingFinance.transactions.generalLedgerPosting,
      icon: 'solar:chart-square-bold',
    },
  ];

  const timeline = [
    {
      label: 'Entry prepared',
      description: `${entry.preparedBy || 'Finance team'} prepared the draft`,
      status: journal?.name || 'journal',
      tone: 'info',
      time: new Date(entry.date).toLocaleDateString(),
      icon: 'solar:document-text-bold',
    },
    {
      label: 'Review state',
      description: `Reviewer: ${entry.reviewer || 'Unassigned'}`,
      status: formatApprovalLabel(entry.approvalState),
      tone:
        entry.approvalState === 'approved'
          ? 'success'
          : entry.approvalState === 'needs_changes'
            ? 'error'
            : 'warning',
      icon: 'solar:shield-check-bold',
    },
    {
      label: 'Posting status',
      description: entry.narration,
      status: entry.status,
      tone:
        entry.status === 'posted'
          ? 'success'
          : entry.status === 'cancelled' || entry.status === 'reversed'
            ? 'error'
            : 'warning',
      icon: 'solar:history-bold',
    },
  ];

  const runActionWithToast = async (
    action,
    successMessage,
    errorMessage,
    loadingMessage,
    label
  ) => {
    const loadingToastId = toast.loading(loadingMessage || 'Processing action...');
    setPendingAction(label || null);

    try {
      await action();
      toast.dismiss(loadingToastId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(error?.message || errorMessage);
    } finally {
      setPendingAction(null);
    }
  };

  const updateLine = (index, field, value) => {
    if (!canEditLines) return;

    setEntry((current) => ({
      ...current,
      lines: (current.lines || []).map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              [field]: field === 'debit' || field === 'credit' ? Number(value || 0) : value,
            }
          : line
      ),
    }));
  };

  const handlePost = async () => {
    if (entry.status?.toLowerCase() !== 'draft' || isPosting) return;
    setIsPosting(true);
    const postedAt = new Date().toISOString();
    const postedBy = entry.posted_by_name || 'Finance Manager';

    try {
      if (entry.source === 'mock') {
        setEntry((current) =>
          current
            ? normalizeJournalEntry(
                {
                  ...current,
                  status: 'posted',
                  approvalState: 'approved',
                  posted_by_name: postedBy,
                  posted_at: postedAt,
                  activity: [
                    {
                      id: `post-${Date.now()}`,
                      type: 'post',
                      author: postedBy,
                      time: formatActivityStamp(postedAt),
                      message: 'Journal posted successfully.',
                    },
                    ...(current.activity || []),
                  ],
                },
                'mock'
              )
            : current
        );
        toast.success('Journal entry posted successfully');
        return;
      }

      const { data } = await axiosInstance.post(endpoints.accounting.journal_entry_post(id));
      setEntry(normalizeJournalEntry(data, 'api'));
      await revalidateEntry();
      toast.success('Journal entry posted successfully');
    } catch (error) {
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.error ||
          error?.message ||
          'Failed to post entry'
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleReverse = async () => {
    const reversalTime = new Date().toISOString();
    const reversalAuthor = 'Finance Controller';
    const reversalMessage = `Entry cancelled. Reason: ${reverseReason || 'No reason provided.'}`;

    try {
      if (entry.source === 'mock') {
        setEntry((current) =>
          current
            ? normalizeJournalEntry(
                {
                  ...current,
                  status: 'cancelled',
                  approvalState: 'needs_changes',
                  activity: [
                    {
                      id: `reverse-${Date.now()}`,
                      type: 'reversal',
                      author: reversalAuthor,
                      time: formatActivityStamp(reversalTime),
                      message: reversalMessage,
                    },
                    ...(current.activity || []),
                  ],
                },
                'mock'
              )
            : current
        );
      } else {
        await axiosInstance.post(endpoints.accounting.journal_entry_cancel(id));
        setEntry((current) =>
          current
            ? normalizeJournalEntry(
                {
                  ...current,
                  status: 'cancelled',
                  approvalState: 'needs_changes',
                  activity: [
                    {
                      id: `reverse-${Date.now()}`,
                      type: 'reversal',
                      author: reversalAuthor,
                      time: formatActivityStamp(reversalTime),
                      message: reversalMessage,
                    },
                    ...(current.activity || []),
                  ],
                },
                'api'
              )
            : current
        );
        await revalidateEntry();
      }

      toast.success('Journal entry cancelled successfully');
    } catch (error) {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to cancel entry');
    } finally {
      setReverseReason('');
      setReverseOpen(false);
    }
  };

  const printContent = (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Entry Context</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <tbody>
            {[
              { label: 'Journal', value: journal?.name || 'General Journal' },
              { label: 'Reference', value: entry.reference || '-' },
              { label: 'Prepared by', value: entry.preparedBy || '-' },
              { label: 'Reviewer', value: entry.reviewer || '-' },
              { label: 'Source document', value: entry.source_document || '-' },
              { label: 'Posted by', value: entry.posted_by_name || 'Not posted yet' },
            ].map((item, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    border: '1px solid #ddd',
                    padding: '6px 8px',
                    fontWeight: 600,
                    width: '40%',
                  }}
                >
                  {item.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {String(item.value ?? '-')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Journal Lines</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Account
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Analytic
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Tax
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                Debit
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                Credit
              </th>
            </tr>
          </thead>
          <tbody>
            {(entry.lines || []).map((line, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {line.account_code || line.account_id || '-'}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.analytic}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{line.taxCode}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(line.debit)}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                  {formatCurrency(line.credit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Control Checks</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Check
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Status
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Value
              </th>
            </tr>
          </thead>
          <tbody>
            {controlChecks.map((check, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                  {check.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                  {check.description}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{check.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Workflow Timeline</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Event
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Description
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Status
              </th>
              <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((item, idx) => (
              <tr key={idx}>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                  {item.label}
                </td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.description}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.status}</td>
                <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.time || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
      <Stack spacing={3}>
        <Card
          sx={(theme) => ({
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 4,
            color: theme.palette.common.white,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 46%, ${theme.palette.secondary.dark} 100%)`,
            boxShadow: `0 24px 60px ${alpha(theme.palette.primary.main, 0.22)}`,
          })}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(circle at top right, rgba(255,255,255,0.18) 0, transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08) 0, transparent 24%)',
            }}
          />
          <CardContent sx={{ position: 'relative', p: { xs: 2.5, md: 3 } }}>
            <Stack
              direction={{ xs: 'column', xl: 'row' }}
              spacing={3}
              alignItems={{ xl: 'stretch' }}
              justifyContent="space-between"
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Chip
                  label="Journal entry detail"
                  size="small"
                  sx={{
                    alignSelf: 'flex-start',
                    mb: 2,
                    color: 'common.white',
                    bgcolor: alpha('#fff', 0.14),
                    border: `1px solid ${alpha('#fff', 0.16)}`,
                    fontWeight: 700,
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{ fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}
                >
                  {entry.number}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ mt: 1.5, maxWidth: 760, color: alpha('#fff', 0.88), lineHeight: 1.7 }}
                >
                  {entry.narration || 'No narration provided.'}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2.25 }}>
                  <Chip
                    label={entry.status}
                    size="small"
                    color={STATUS_COLORS[entry.status] || 'default'}
                    sx={{
                      textTransform: 'capitalize',
                      bgcolor: 'common.white',
                      color: 'text.primary',
                    }}
                  />
                  <Chip
                    label={formatApprovalLabel(entry.approvalState)}
                    size="small"
                    color={APPROVAL_COLORS[entry.approvalState] || 'default'}
                    variant="outlined"
                    sx={{
                      textTransform: 'capitalize',
                      color: 'common.white',
                      borderColor: alpha('#fff', 0.35),
                    }}
                  />
                  <Chip
                    label={journal.code || 'GEN'}
                    size="small"
                    variant="outlined"
                    sx={{ color: 'common.white', borderColor: alpha('#fff', 0.35) }}
                  />
                  <Chip
                    label={isLockedByDate ? 'Locked period' : 'Open period'}
                    size="small"
                    color={isLockedByDate ? 'error' : 'success'}
                    variant="outlined"
                    sx={{ color: 'common.white', borderColor: alpha('#fff', 0.35) }}
                  />
                  <Chip
                    label={`${activityCount} events`}
                    size="small"
                    variant="outlined"
                    sx={{ color: 'common.white', borderColor: alpha('#fff', 0.35) }}
                  />
                  <Chip
                    label={`${attachmentCount} attachments`}
                    size="small"
                    variant="outlined"
                    sx={{ color: 'common.white', borderColor: alpha('#fff', 0.35) }}
                  />
                </Stack>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ mt: 3, flexWrap: 'wrap' }}
                >
                  <Box sx={{ minWidth: 140 }}>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                      Reference
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'common.white' }}>
                      {entry.reference || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 140 }}>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                      Source document
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'common.white' }}>
                      {entry.source_document || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 140 }}>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                      Prepared by
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'common.white' }}>
                      {entry.preparedBy || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 140 }}>
                    <Typography variant="caption" sx={{ color: alpha('#fff', 0.7) }}>
                      Reviewer
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'common.white' }}>
                      {entry.reviewer || '-'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ width: { xs: '100%', xl: 470 }, flexShrink: 0 }}>
                <Grid container spacing={1.5}>
                  {heroMetrics.map((metric) => (
                    <Grid key={metric.label} size={{ xs: 12, sm: 6 }}>
                      <MetricCard {...metric} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={(theme) => ({
            borderRadius: 3,
            boxShadow: 'none',
            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
          })}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack
              direction={{ xs: 'column', lg: 'row' }}
              justifyContent="space-between"
              spacing={2}
              alignItems={{ lg: 'center' }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>
                  Workflow actions
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep the entry moving without leaving the page.
                </Typography>
              </Box>
              <Stack
                direction="row"
                spacing={1.25}
                flexWrap="wrap"
                justifyContent={{ xs: 'flex-start', lg: 'flex-end' }}
              >
                {entry.status === 'draft' && (
                  <Button variant="contained" onClick={handlePost} disabled={isPosting}>
                    {isPosting ? 'Posting...' : 'Post Entry'}
                  </Button>
                )}
                {entry.status === 'posted' && (
                  <Button color="error" variant="outlined" onClick={() => setReverseOpen(true)}>
                    Reverse Entry
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
                  disabled={Boolean(pendingAction)}
                  onClick={() => setPrintOpen(true)}
                >
                  Print Pack
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:document-bold" />}
                  disabled={Boolean(pendingAction)}
                  onClick={() =>
                    runActionWithToast(
                      () =>
                        exportCsvFile(
                          `${entry.number}-detail`,
                          buildTransactionCsvRows({
                            summary: [
                              { label: 'Status', value: entry.status },
                              {
                                label: 'Approval',
                                value: formatApprovalLabel(entry.approvalState),
                              },
                              { label: 'Total debit', value: formatCurrency(totalDebit) },
                              { label: 'Total credit', value: formatCurrency(totalCredit) },
                            ],
                            sections: [
                              {
                                title: 'Entry Context',
                                items: [
                                  { label: 'Journal', value: journal?.name || 'General Journal' },
                                  { label: 'Reference', value: entry.reference || '-' },
                                  { label: 'Prepared by', value: entry.preparedBy || '-' },
                                  { label: 'Reviewer', value: entry.reviewer || '-' },
                                  { label: 'Source document', value: entry.source_document || '-' },
                                  {
                                    label: 'Posted by',
                                    value: entry.posted_by_name || 'Not posted yet',
                                  },
                                ],
                              },
                            ],
                            tables: [
                              {
                                title: 'Journal Lines',
                                columns: [
                                  { key: 'description', label: 'Description' },
                                  { key: 'account_code', label: 'Account' },
                                  { key: 'analytic', label: 'Analytic' },
                                  { key: 'taxCode', label: 'Tax' },
                                  { key: 'debit', label: 'Debit' },
                                  { key: 'credit', label: 'Credit' },
                                ],
                                rows: entry.lines || [],
                              },
                            ],
                            controlChecks,
                            referenceLinks,
                            timeline,
                            auditTrail: (entry.activity || []).map((item) => ({
                              primary: item.author,
                              secondary: item.message,
                              meta: item.time,
                            })),
                          })
                        ),
                      'CSV exported',
                      'Failed to export CSV',
                      'Exporting CSV...',
                      'Export CSV'
                    )
                  }
                >
                  {pendingAction === 'Export CSV' ? 'Export CSV...' : 'Export CSV'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:file-download-bold" />}
                  disabled={Boolean(pendingAction)}
                  onClick={() =>
                    runActionWithToast(
                      () =>
                        exportExcelWorkbook(
                          `${entry.number}-detail`,
                          buildTransactionWorkbookData({
                            summary: [
                              { label: 'Status', value: entry.status },
                              {
                                label: 'Approval',
                                value: formatApprovalLabel(entry.approvalState),
                              },
                              { label: 'Total debit', value: formatCurrency(totalDebit) },
                              { label: 'Total credit', value: formatCurrency(totalCredit) },
                            ],
                            sections: [
                              {
                                title: 'Entry Context',
                                items: [
                                  { label: 'Journal', value: journal?.name || 'General Journal' },
                                  { label: 'Reference', value: entry.reference || '-' },
                                  { label: 'Prepared by', value: entry.preparedBy || '-' },
                                  { label: 'Reviewer', value: entry.reviewer || '-' },
                                  { label: 'Source document', value: entry.source_document || '-' },
                                  {
                                    label: 'Posted by',
                                    value: entry.posted_by_name || 'Not posted yet',
                                  },
                                ],
                              },
                            ],
                            tables: [
                              {
                                title: 'Journal Lines',
                                columns: [
                                  { key: 'description', label: 'Description' },
                                  { key: 'account_code', label: 'Account' },
                                  { key: 'analytic', label: 'Analytic' },
                                  { key: 'taxCode', label: 'Tax' },
                                  { key: 'debit', label: 'Debit' },
                                  { key: 'credit', label: 'Credit' },
                                ],
                                rows: entry.lines || [],
                              },
                            ],
                            controlChecks,
                            referenceLinks,
                            timeline,
                            auditTrail: (entry.activity || []).map((item) => ({
                              primary: item.author,
                              secondary: item.message,
                              meta: item.time,
                            })),
                          })
                        ),
                      'Excel workbook exported',
                      'Failed to export Excel workbook',
                      'Building Excel workbook...',
                      'Export Excel'
                    )
                  }
                >
                  {pendingAction === 'Export Excel' ? 'Export Excel...' : 'Export Excel'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:download-bold" />}
                  disabled={Boolean(pendingAction)}
                  onClick={() =>
                    runActionWithToast(
                      () =>
                        exportJsonFile(entry.number, {
                          entry,
                          journal,
                          controlChecks,
                          timeline,
                        }),
                      'JSON exported',
                      'Failed to export JSON',
                      'Exporting JSON...',
                      'Export JSON'
                    )
                  }
                >
                  {pendingAction === 'Export JSON' ? 'Export JSON...' : 'Export JSON'}
                </Button>
                <Button variant="text" onClick={() => router.back()}>
                  Back
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {isLockedByDate && (
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
            This journal falls before the lock date {formatDateValue(TRANSACTION_LOCK_DATE)}.
            Editing is blocked in the mock workflow.
          </Alert>
        )}

        <Grid container spacing={3} alignItems="flex-start">
          <Grid size={{ xs: 12, lg: 4 }}>
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
              <Stack spacing={3}>
                <Card
                  sx={(theme) => ({
                    borderRadius: 3,
                    boxShadow: 'none',
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  })}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          Entry snapshot
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Key fields that define this record.
                        </Typography>
                      </Box>
                      <Stack spacing={1} alignItems="flex-end">
                        <Chip
                          label={entry.status}
                          color={STATUS_COLORS[entry.status] || 'default'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={formatApprovalLabel(entry.approvalState)}
                          color={APPROVAL_COLORS[entry.approvalState] || 'default'}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Stack>
                    </Stack>
                    <Grid container spacing={1.5}>
                      {overviewTiles.map((tile) => (
                        <Grid key={tile.label} size={{ xs: 12, sm: 6, md: 4 }}>
                          <DetailTile
                            label={tile.label}
                            value={tile.value}
                            highlight={tile.highlight}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                <ControlChecksCard checks={controlChecks} />
                <ReferenceLinksCard links={referenceLinks} />
                <TimelineCard items={timeline} />

                <Card
                  sx={(theme) => ({
                    borderRadius: 3,
                    boxShadow: 'none',
                    border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                  })}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          Attachments
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Supporting files linked to this entry.
                        </Typography>
                      </Box>
                      <Chip label={`${attachmentCount} files`} size="small" variant="outlined" />
                    </Stack>
                    <Stack spacing={1.25}>
                      {(entry.attachments || []).map((attachment) => (
                        <Box
                          key={attachment.id}
                          sx={(theme) => ({
                            p: 1.5,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                            bgcolor: 'background.neutral',
                          })}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={2}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {attachment.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {attachment.type} - {attachment.owner}
                              </Typography>
                            </Box>
                            <Chip label={attachment.status} size="small" variant="outlined" />
                          </Stack>
                        </Box>
                      ))}
                      {!(entry.attachments || []).length && (
                        <Box sx={{ py: 3, textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            No attachments linked to this journal.
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              <Card
                sx={(theme) => ({
                  borderRadius: 3,
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                })}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        Journal lines
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review the double-entry balance and edit draft lines when the period is
                        open.
                      </Typography>
                    </Box>
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                    >
                      <Chip
                        label={`Debit ${formatCurrency(totalDebit)}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={`Credit ${formatCurrency(totalCredit)}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={
                          isBalanced ? 'Balanced' : `Variance ${formatCurrency(balanceAmount)}`
                        }
                        size="small"
                        color={isBalanced ? 'success' : 'warning'}
                        variant="outlined"
                      />
                      <Chip
                        label={canEditLines ? 'Editable' : 'Read only'}
                        size="small"
                        color={canEditLines ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Stack>
                  </Stack>

                  <TableContainer
                    sx={(theme) => ({
                      borderRadius: 2.5,
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                      overflow: 'hidden',
                    })}
                  >
                    <Table stickyHeader sx={{ minWidth: 760 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={tableHeadCellSx}>Description</TableCell>
                          <TableCell sx={tableHeadCellSx}>Account</TableCell>
                          <TableCell sx={tableHeadCellSx}>Analytic</TableCell>
                          <TableCell sx={tableHeadCellSx}>Tax</TableCell>
                          <TableCell sx={tableHeadCellSx} align="right">
                            Debit
                          </TableCell>
                          <TableCell sx={tableHeadCellSx} align="right">
                            Credit
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(entry.lines || []).length ? (
                          (entry.lines || []).map((line, index) => (
                            <TableRow
                              key={`${line.account_code || line.account_id || 'line'}-${index}`}
                              hover
                              sx={(theme) => ({
                                '&:nth-of-type(odd)': {
                                  bgcolor: alpha(theme.palette.text.primary, 0.015),
                                },
                              })}
                            >
                              <TableCell sx={{ verticalAlign: 'top' }}>
                                {canEditLines ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={line.description || ''}
                                    onChange={(event) =>
                                      updateLine(index, 'description', event.target.value)
                                    }
                                  />
                                ) : (
                                  line.description || '-'
                                )}
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top' }}>
                                <Typography variant="body2" fontWeight={700}>
                                  {line.account_code || line.account_id || '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {line.account_name || 'Account'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top' }}>
                                {canEditLines ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    value={line.analytic || ''}
                                    onChange={(event) =>
                                      updateLine(index, 'analytic', event.target.value)
                                    }
                                  />
                                ) : (
                                  line.analytic || '-'
                                )}
                              </TableCell>
                              <TableCell sx={{ verticalAlign: 'top' }}>
                                {line.taxCode || 'N/A'}
                              </TableCell>
                              <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                {canEditLines ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={line.debit || 0}
                                    onChange={(event) =>
                                      updateLine(index, 'debit', event.target.value)
                                    }
                                  />
                                ) : (
                                  formatCurrency(line.debit || 0)
                                )}
                              </TableCell>
                              <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                                {canEditLines ? (
                                  <TextField
                                    fullWidth
                                    size="small"
                                    type="number"
                                    value={line.credit || 0}
                                    onChange={(event) =>
                                      updateLine(index, 'credit', event.target.value)
                                    }
                                  />
                                ) : (
                                  formatCurrency(line.credit || 0)
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6}>
                              <Box sx={{ py: 6, textAlign: 'center' }}>
                                <Typography variant="subtitle1" fontWeight={700}>
                                  No journal lines available
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  This record does not include any line items yet.
                                </Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box
                    sx={(theme) => ({
                      mt: 2,
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                    })}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1.5}
                    >
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          Totals
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Debit and credit should stay in lockstep for a valid posting.
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                        <Chip
                          label={formatCurrency(totalDebit)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={formatCurrency(totalCredit)}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        <Chip
                          label={isBalanced ? 'Balanced' : formatCurrency(balanceAmount)}
                          size="small"
                          color={isBalanced ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              <Card
                sx={(theme) => ({
                  borderRadius: 3,
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.text.primary, 0.08)}`,
                })}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={2}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        Activity & chatter
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        A chronological view of actions and notes.
                      </Typography>
                    </Box>
                    <Chip label={`${activityCount} events`} size="small" variant="outlined" />
                  </Stack>

                  <Stack spacing={1.5}>
                    {(entry.activity || []).length ? (
                      (entry.activity || []).map((item, index) => {
                        const tone =
                          item.type === 'reversal'
                            ? 'error'
                            : item.type === 'approval' || item.type === 'post'
                              ? 'success'
                              : 'info';

                        return (
                          <Box
                            key={item.id || `${item.author}-${index}`}
                            sx={(theme) => ({
                              p: 1.75,
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette[tone].main, 0.16)}`,
                              borderLeft: `4px solid ${theme.palette[tone].main}`,
                              bgcolor: alpha(theme.palette[tone].main, 0.04),
                            })}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              spacing={2}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={700}>
                                  {item.author}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {item.time || 'Now'}
                                </Typography>
                              </Box>
                              <Chip
                                label={(item.type || 'note').replace(/_/g, ' ')}
                                size="small"
                                variant="outlined"
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </Stack>
                            <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                              {item.message}
                            </Typography>
                          </Box>
                        );
                      })
                    ) : (
                      <Box
                        sx={{
                          py: 5,
                          textAlign: 'center',
                          borderRadius: 2,
                          bgcolor: 'background.neutral',
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          No activity yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Workflow events will appear here once the entry is posted or reviewed.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        <Dialog open={reverseOpen} onClose={() => setReverseOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reverse Journal Entry</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Capture the reason for reversal so the mock activity stream mirrors an audited
              accounting trail.
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Reversal reason"
              value={reverseReason}
              onChange={(event) => setReverseReason(event.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setReverseOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleReverse}>
              Reverse
            </Button>
          </DialogActions>
        </Dialog>

        {printOpen && (
          <PdfPrintLayout
            title={`Journal Entry - ${entry.number}`}
            onClose={() => setPrintOpen(false)}
          >
            {printContent}
          </PdfPrintLayout>
        )}
      </Stack>
    </Box>
  );
}
