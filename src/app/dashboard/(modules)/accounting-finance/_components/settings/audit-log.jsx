'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';
import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import {
  exportCsvFile,
  exportJsonFile,
  exportExcelWorkbook,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

const EP = endpoints.accounting;

const ACTION_META = {
  create: { color: '#16a34a', severity: 'low', label: 'Create' },
  update: { color: '#2563eb', severity: 'medium', label: 'Update' },
  approve: { color: '#7c3aed', severity: 'medium', label: 'Approve' },
  send: { color: '#0891b2', severity: 'medium', label: 'Send' },
  post: { color: '#d97706', severity: 'high', label: 'Post' },
  lock: { color: '#dc2626', severity: 'high', label: 'Lock' },
  delete: { color: '#dc2626', severity: 'high', label: 'Delete' },
};

const DOCUMENT_META = {
  JE: {
    module: 'General Ledger',
    documentType: 'Journal Entry',
    controlOwner: 'Finance Controller',
  },
  BILL: { module: 'Payables', documentType: 'Vendor Bill', controlOwner: 'Accounts Payable' },
  STAT: {
    module: 'Receivables',
    documentType: 'Statement Batch',
    controlOwner: 'Accounts Receivable',
  },
  INV: { module: 'Receivables', documentType: 'Customer Invoice', controlOwner: 'Billing Desk' },
  PAY: { module: 'Treasury', documentType: 'Payment', controlOwner: 'Treasury' },
};

function getActionFamily(action) {
  const value = String(action || '').toLowerCase();

  if (value.includes('delete')) return 'delete';
  if (value.includes('lock')) return 'lock';
  if (value.includes('post')) return 'post';
  if (value.includes('approve')) return 'approve';
  if (value.includes('send')) return 'send';
  if (value.includes('update')) return 'update';
  return 'create';
}

function getDocumentMeta(document) {
  const prefix = String(document || '').split('-')[0] || '';
  return (
    DOCUMENT_META[prefix] || {
      module: 'Accounting Control',
      documentType: 'Accounting Record',
      controlOwner: 'Finance Operations',
    }
  );
}

function getInitials(name) {
  return String(name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function buildAuditRecord(log, index) {
  const family = getActionFamily(log.action);
  const meta = ACTION_META[family] || ACTION_META.create;
  const documentMeta = getDocumentMeta(log.document);
  const timestamp = new Date(log.timestamp || Date.now());
  const hour = timestamp.getHours();
  const timeWindow = hour < 8 || hour >= 18 ? 'After hours' : 'Business hours';
  const beforeState =
    family === 'update'
      ? [
          { field: 'Status', before: 'Draft', after: 'Approved' },
          { field: 'Owner', before: 'Junior Accountant', after: 'Finance Controller' },
        ]
      : family === 'lock'
        ? [{ field: 'Period lock', before: 'Soft lock', after: 'Hard lock' }]
        : family === 'delete'
          ? [
              {
                field: 'Document availability',
                before: 'Visible',
                after: 'Removed from active list',
              },
            ]
          : [{ field: 'Posting state', before: 'Pending', after: 'Completed' }];
  const retentionPolicy =
    meta.severity === 'high'
      ? '7-year retained audit pack'
      : meta.severity === 'medium'
        ? '3-year operational archive'
        : '1-year quick-access log';

  return {
    id: log.id || `audit-${index + 1}`,
    user: log.user || 'Unknown user',
    action: log.action || 'Recorded activity',
    actionFamily: family,
    actionLabel: meta.label,
    severity: meta.severity,
    color: meta.color,
    document: log.document || 'Unassigned document',
    documentType: documentMeta.documentType,
    module: documentMeta.module,
    controlOwner: documentMeta.controlOwner,
    details:
      log.details ||
      `${log.action || 'Activity'} completed for ${log.document || 'the selected record'}.`,
    timestamp,
    timestampLabel: timestamp.toLocaleString(),
    dayLabel: timestamp.toLocaleDateString(),
    timeWindow,
    ipAddress: log.ip || `10.24.18.${(index % 80) + 10}`,
    beforeState,
    retentionPolicy,
  };
}

function getDocumentHref(entry) {
  const prefix = String(entry.document || '').split('-')[0];

  if (prefix === 'JE') return paths.dashboard.accountingFinance.transactions.journalEntries;
  if (prefix === 'BILL') return paths.dashboard.accountingFinance.transactions.vendorBills;
  if (prefix === 'INV') return paths.dashboard.accountingFinance.transactions.customerInvoices;
  if (prefix === 'PAY') return paths.dashboard.accountingFinance.transactions.supplierPayments;
  if (prefix === 'STAT') return paths.dashboard.accountingFinance.receivables.customerStatements;

  return paths.dashboard.accountingFinance.root;
}

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            <Iconify icon={icon} width={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AuditLog() {
  const { data: rawAuditLog } = useGetRequest(EP.audit_logs);

  const auditLog = useMemo(
    () =>
      (Array.isArray(rawAuditLog) ? rawAuditLog : rawAuditLog?.results || []).map(buildAuditRecord),
    [rawAuditLog]
  );

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [retentionWindow, setRetentionWindow] = useState('7 years');
  const [autoArchive, setAutoArchive] = useState(true);

  const filtered = useMemo(
    () =>
      auditLog.filter((entry) => {
        if (actionFilter !== 'all' && entry.actionFamily !== actionFilter) return false;
        if (severityFilter !== 'all' && entry.severity !== severityFilter) return false;
        if (!search) return true;

        const haystack = [
          entry.user,
          entry.action,
          entry.document,
          entry.details,
          entry.module,
          entry.controlOwner,
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search.toLowerCase());
      }),
    [actionFilter, auditLog, search, severityFilter]
  );

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Timestamp
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>User</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Action
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Document
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Module
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Severity
          </th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((item) => (
          <tr key={item.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.timestampLabel}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.user}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.action}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.document}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.module}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.severity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const actionOptions = useMemo(
    () => Array.from(new Set(auditLog.map((entry) => entry.actionFamily))),
    [auditLog]
  );

  const summary = useMemo(() => {
    const highRisk = auditLog.filter((entry) => entry.severity === 'high');
    const afterHours = auditLog.filter((entry) => entry.timeWindow === 'After hours');
    const actors = new Set(auditLog.map((entry) => entry.user));

    return {
      totalEvents: auditLog.length,
      highRisk: highRisk.length,
      afterHours: afterHours.length,
      activeActors: actors.size,
    };
  }, [auditLog]);

  const topActors = useMemo(() => {
    const counts = auditLog.reduce((accumulator, entry) => {
      accumulator[entry.user] = (accumulator[entry.user] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .map(([user, count]) => ({ user, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }, [auditLog]);

  const watchlist = useMemo(
    () => auditLog.filter((entry) => entry.severity === 'high').slice(0, 5),
    [auditLog]
  );
  const selectedEntry =
    filtered.find((entry) => entry.id === selectedEntryId) || filtered[0] || null;

  const exportConfig = useMemo(
    () => ({
      title: 'Accounting Audit Workspace',
      documentNumber: 'AUDIT-CONTROL',
      subtitle: 'Change evidence, sensitive activity review, and control-owner visibility',
      alerts: [
        summary.highRisk
          ? {
              title: `${summary.highRisk} sensitive actions need controller review`,
              description:
                'Posting, lock, and delete activity should be reviewed against approval policy and evidence retention.',
            }
          : {
              title: 'No high-risk actions detected in the visible sample',
              description:
                'Activity mix is limited to low and medium risk actions in the current audit workspace.',
            },
        summary.afterHours
          ? {
              title: `${summary.afterHours} events were recorded outside business hours`,
              description:
                'Review after-hours changes against delegation and emergency posting controls.',
            }
          : {
              title: 'No after-hours activity detected',
              description: 'Recorded actions currently sit inside standard operating windows.',
            },
      ],
      summary: [
        { label: 'Visible events', value: summary.totalEvents },
        { label: 'High-risk actions', value: summary.highRisk },
        { label: 'After-hours actions', value: summary.afterHours },
        { label: 'Active actors', value: summary.activeActors },
      ],
      sections: [
        {
          title: 'Control posture',
          items: [
            { label: 'Primary owner', value: 'Finance Controller' },
            { label: 'Evidence retention', value: 'Operational review pack with export support' },
            {
              label: 'Filter scope',
              value: `${filtered.length} events in current review selection`,
            },
          ],
        },
      ],
      tables: [
        {
          title: 'Audit Events',
          columns: [
            { key: 'timestampLabel', label: 'Timestamp' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'document', label: 'Document' },
            { key: 'module', label: 'Module' },
            { key: 'severity', label: 'Severity' },
          ],
          rows: filtered,
        },
      ],
      controlChecks: [
        {
          label: 'High-risk review',
          value: summary.highRisk ? 'Required' : 'Normal monitoring',
          description: 'Sensitive actions should be reconciled with posting and approval rules.',
        },
        {
          label: 'After-hours monitoring',
          value: summary.afterHours ? 'Escalate' : 'Normal coverage',
          description: 'Escalate if activity falls outside approved operational windows.',
        },
      ],
      referenceLinks: [
        {
          label: 'Posting Rules',
          href: paths.dashboard.accountingFinance.settings.postingRules,
          description: 'Review how sensitive postings are routed and approved.',
        },
        {
          label: 'Role Permissions',
          href: paths.dashboard.accountingFinance.settings.rolePermissions,
          description: 'Confirm segregation-of-duties and restricted action scope.',
        },
      ],
      timeline: filtered.slice(0, 5).map((entry) => ({
        label: entry.action,
        status: entry.severity,
        description: `${entry.user} on ${entry.document}`,
        time: entry.timestampLabel,
      })),
      auditTrail: watchlist.map((entry) => ({
        primary: `${entry.actionLabel} | ${entry.document}`,
        secondary: `${entry.user} | ${entry.module} | ${entry.timeWindow}`,
        meta: entry.controlOwner,
      })),
      payload: { summary, filtered, watchlist, topActors },
    }),
    [filtered, summary, topActors, watchlist]
  );

  const runExport = async (label, action, successMessage) => {
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

  const exportCsv = () =>
    exportCsvFile('accounting-audit-log', buildTransactionCsvRows(exportConfig));
  const exportExcel = () =>
    exportExcelWorkbook('accounting-audit-log', buildTransactionWorkbookData(exportConfig));
  const exportJson = () =>
    exportJsonFile('accounting-audit-log', {
      title: exportConfig.title,
      subtitle: exportConfig.subtitle,
      generatedAt: new Date().toISOString(),
      ...exportConfig.payload,
    });

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
            Audit Log Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control desk for change evidence, sensitive activity monitoring, and actor-level review.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.settings.postingRules}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:slider-vertical-bold" />}
          >
            Review Policies
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" />}
            onClick={() =>
              runExport('Export Audit Workbook', exportExcel, 'Audit workbook exported')
            }
            disabled={pendingAction !== null}
          >
            Export Excel
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {summary.highRisk ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Sensitive activity requires review
            </Typography>
            High-risk actions are present in the current audit scope. Reconcile them with posting
            rules and approval evidence.
          </Alert>
        ) : null}
        {summary.afterHours ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              After-hours coverage is active
            </Typography>
            Some changes were captured outside the standard business window. Verify whether
            emergency delegation applied.
          </Alert>
        ) : null}
        {!auditLog.length ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              Audit history is empty
            </Typography>
            The audit workspace has no visible entries. Seeded data or live activity is required to
            review control coverage.
          </Alert>
        ) : null}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Visible events"
            value={summary.totalEvents}
            helper="Current review window across accounting modules"
            icon="solar:document-text-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="High-risk actions"
            value={summary.highRisk}
            helper="Posting, locking, and destructive operations"
            icon="solar:danger-triangle-bold-duotone"
            color="#dc2626"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="After-hours events"
            value={summary.afterHours}
            helper="Recorded outside standard office control windows"
            icon="solar:clock-circle-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Active actors"
            value={summary.activeActors}
            helper="Distinct users visible in the audit scope"
            icon="solar:users-group-rounded-bold-duotone"
            color="#059669"
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search user, action, document, or control owner"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="solar:magnifer-linear" width={18} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Action family"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              sx={{ minWidth: 190 }}
            >
              <MenuItem value="all">All actions</MenuItem>
              {actionOptions.map((option) => (
                <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Risk"
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="all">All risks</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Actor</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Document</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell>When</TableCell>
                    <TableCell>Owner</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow
                      key={entry.id}
                      hover
                      selected={entry.id === selectedEntry?.id}
                      onClick={() => setSelectedEntryId(entry.id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 12,
                              bgcolor: `${entry.color}20`,
                              color: entry.color,
                            }}
                          >
                            {getInitials(entry.user)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {entry.user}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {entry.ipAddress}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.75}>
                          <Chip
                            label={entry.actionLabel}
                            size="small"
                            sx={{
                              bgcolor: `${entry.color}18`,
                              color: entry.color,
                              fontWeight: 700,
                              width: 'fit-content',
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {entry.action}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.document}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.documentType} · {entry.module}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.details}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.timestampLabel}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.timeWindow}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{entry.controlOwner}</Typography>
                        <Chip
                          label={entry.severity}
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.75, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ py: 4, textAlign: 'center' }}
                        >
                          No audit events match the current search and risk filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Most Active Actors
                </Typography>
                <Stack divider={<Divider flexItem />}>
                  {topActors.map((actor) => (
                    <Stack
                      key={actor.user}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ py: 1.25 }}
                    >
                      <Typography variant="body2">{actor.user}</Typography>
                      <Chip label={`${actor.count} events`} size="small" variant="outlined" />
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Sensitive Watchlist
                </Typography>
                <Stack spacing={1.5}>
                  {watchlist.length ? (
                    watchlist.map((entry) => (
                      <Box
                        key={entry.id}
                        sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {entry.action} · {entry.document}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {entry.user} · {entry.controlOwner}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.timestampLabel}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No high-risk events are visible in the current audit scope.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Evidence Controls
                </Typography>
                <Stack spacing={1.25}>
                  {selectedEntry ? (
                    <>
                      <Button
                        component={RouterLink}
                        href={getDocumentHref(selectedEntry)}
                        variant="outlined"
                        color="inherit"
                      >
                        Open Source Document
                      </Button>
                      <Typography variant="body2">
                        Retention: {selectedEntry.retentionPolicy}
                      </Typography>
                      <Typography variant="body2">Owner: {selectedEntry.controlOwner}</Typography>
                    </>
                  ) : null}
                  <TextField
                    select
                    size="small"
                    label="Retention window"
                    value={retentionWindow}
                    onChange={(event) => setRetentionWindow(event.target.value)}
                  >
                    <MenuItem value="1 year">1 year</MenuItem>
                    <MenuItem value="3 years">3 years</MenuItem>
                    <MenuItem value="7 years">7 years</MenuItem>
                  </TextField>
                  <Button
                    variant={autoArchive ? 'contained' : 'outlined'}
                    color="inherit"
                    onClick={() => setAutoArchive((current) => !current)}
                  >
                    {autoArchive ? 'Auto archive enabled' : 'Enable auto archive'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => runExport('Export Audit CSV', exportCsv, 'Audit CSV exported')}
                    disabled={pendingAction !== null}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      runExport('Export Audit JSON', exportJson, 'Audit JSON exported')
                    }
                    disabled={pendingAction !== null}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setPrintOpen(true)}
                    disabled={pendingAction !== null}
                  >
                    Print Pack
                  </Button>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.accountingFinance.settings.rolePermissions}
                    variant="contained"
                  >
                    Open Role Controls
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {selectedEntry ? (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Before / After Diff
                  </Typography>
                  <Stack spacing={1.25}>
                    {selectedEntry.beforeState.map((row) => (
                      <Box
                        key={`${selectedEntry.id}-${row.field}`}
                        sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                      >
                        <Typography variant="body2" fontWeight={700}>
                          {row.field}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Before: {row.before}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          After: {row.after}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ) : null}
          </Stack>
        </Grid>
      </Grid>
      {printOpen && (
        <PdfPrintLayout title="Audit Log" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
