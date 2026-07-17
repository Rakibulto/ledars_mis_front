'use client';

import { toast } from 'sonner';
import { useState, isValidElement } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ListItemText from '@mui/material/ListItemText';
import TableContainer from '@mui/material/TableContainer';
import ListItemButton from '@mui/material/ListItemButton';

import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { Iconify } from 'src/components/iconify';

import {
  exportCsvFile,
  exportJsonFile,
  sanitizeExportName,
  exportExcelWorkbook,
  buildTransactionCsvRows,
  buildTransactionWorkbookData,
} from '../utils';

const CHECK_COLORS = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
};

function renderValue(value) {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (isValidElement(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '—';
  }

  if (typeof value === 'object') {
    if ('label' in value) {
      return (
        <Chip
          label={value.label}
          size={value.size || 'small'}
          color={value.color || 'default'}
          variant={value.variant || 'filled'}
          icon={value.icon ? <Iconify icon={value.icon} /> : null}
          sx={value.sx}
        />
      );
    }

    if ('primary' in value || 'secondary' in value) {
      return (
        <Box>
          {value.primary ? (
            <Typography variant="body2" fontWeight={600}>
              {value.primary}
            </Typography>
          ) : null}
          {value.secondary ? (
            <Typography variant="caption" color="text.secondary">
              {value.secondary}
            </Typography>
          ) : null}
        </Box>
      );
    }
  }

  return value;
}

export function formatDetailDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function TransactionRecordNotFound({ title, backHref }) {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The selected mock transaction record could not be found.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          component={RouterLink}
          href={backHref}
          startIcon={<Iconify icon="solar:arrow-left-linear" />}
        >
          Back
        </Button>
      </Stack>

      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        This record is missing from the current shared mock dataset.
      </Alert>
    </Box>
  );
}

function DetailFieldsCard({ title, items }) {
  if (!items?.length) return null;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {items.map((item) => (
            <Grid key={`${title}-${item.label}`} size={{ xs: 12, md: item.fullWidth ? 12 : 6 }}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
                {renderValue(item.value)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

function DataTableCard({ title, columns, rows, emptyMessage }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ pb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
      </CardContent>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={`${title}-${column.key}`} align={column.align || 'left'}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length ? (
              rows.map((row, index) => (
                <TableRow key={`${title}-row-${index}`} hover>
                  {columns.map((column) => (
                    <TableCell
                      key={`${title}-${column.key}-${index}`}
                      align={column.align || 'left'}
                    >
                      {renderValue(row[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage || 'No related records available.'}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function SidebarCard({ title, items, content }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
        {content || (
          <List disablePadding>
            {(items || []).map((item, index) => (
              <Box key={`${title}-${index}`}>
                <ListItemButton disableRipple sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary={item.primary}
                    secondary={item.secondary}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                  />
                  {item.meta ? renderValue(item.meta) : null}
                </ListItemButton>
                {index < items.length - 1 ? <Divider /> : null}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export function ControlChecksCard({ checks }) {
  if (!checks?.length) return null;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          Control Checks
        </Typography>
        <Stack spacing={1.5}>
          {checks.map((check) => (
            <Box key={check.label}>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {check.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {check.description}
                  </Typography>
                </Box>
                <Chip
                  label={check.value || check.status}
                  size="small"
                  color={CHECK_COLORS[check.status] || 'default'}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ReferenceLinksCard({ links }) {
  if (!links?.length) return null;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          Related Records
        </Typography>
        <Stack spacing={1.25}>
          {links.map((link) => (
            <Button
              key={link.label}
              component={RouterLink}
              href={link.href}
              variant="outlined"
              color="inherit"
              sx={{ justifyContent: 'space-between', textAlign: 'left' }}
              startIcon={<Iconify icon={link.icon || 'solar:link-bold'} />}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" fontWeight={600}>
                  {link.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {link.description}
                </Typography>
              </Box>
            </Button>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function TimelineCard({ items }) {
  if (!items?.length) return null;

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
          Workflow Timeline
        </Typography>
        <List disablePadding>
          {items.map((item, index) => (
            <Box key={`${item.label}-${index}`}>
              <ListItem disableGutters sx={{ alignItems: 'flex-start', py: 1 }}>
                <Box sx={{ mt: 0.25, mr: 1.5 }}>
                  <Iconify icon={item.icon || 'solar:history-bold'} width={18} />
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {item.label}
                    </Typography>
                    <Chip
                      label={item.status}
                      size="small"
                      color={CHECK_COLORS[item.tone] || 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {item.description}
                  </Typography>
                  {item.time ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {item.time}
                    </Typography>
                  ) : null}
                </Box>
              </ListItem>
              {index < items.length - 1 ? <Divider /> : null}
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default function TransactionDetailShell({
  title,
  subtitle,
  documentNumber,
  backHref,
  chips = [],
  statusActions = [],
  actions = [],
  alerts = [],
  summary = [],
  sections = [],
  tables = [],
  sidebar = [],
  auditTrail = [],
  controlChecks = [],
  referenceLinks = [],
  timeline = [],
  enablePrintExport = true,
  exportFileName,
  exportPayload,
}) {
  const normalizedAuditTrail = auditTrail.length
    ? auditTrail
    : [
        {
          primary: 'Record reference',
          secondary: 'Current drilldown document',
          meta: documentNumber || title,
        },
        {
          primary: 'Data source',
          secondary: 'Loaded from shared mock transaction data',
          meta: 'Mock dataset',
        },
      ];

  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

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

  const printContent = (
    <div>
      {summary.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Summary</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {summary.map((item, idx) => (
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
                    {typeof item.value === 'object' && item.value !== null
                      ? JSON.stringify(item.value)
                      : String(item.value ?? '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sections.map((section, sIdx) => (
        <div key={sIdx} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{section.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {(section.items || []).map((item, iIdx) => (
                <tr key={iIdx}>
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
                    {typeof item.value === 'object' && item.value !== null
                      ? JSON.stringify(item.value)
                      : String(item.value ?? '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tables.map((table, tIdx) => (
        <div key={tIdx} style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{table.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                {(table.columns || []).map((col) => (
                  <th
                    key={col.key}
                    style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(table.rows || []).map((row, rIdx) => (
                <tr key={rIdx}>
                  {(table.columns || []).map((col) => (
                    <td key={col.key} style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                      {typeof row[col.key] === 'object' && row[col.key] !== null
                        ? JSON.stringify(row[col.key])
                        : String(row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {controlChecks.length > 0 && (
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
              {controlChecks.map((check, cIdx) => (
                <tr key={cIdx}>
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
      )}

      {timeline.length > 0 && (
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
              {timeline.map((item, tIdx) => (
                <tr key={tIdx}>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 600 }}>
                    {item.label}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {item.description}
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.status}</td>
                  <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                    {item.time || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const combinedActions = [
    ...actions,
    ...(enablePrintExport
      ? [
          {
            label: 'Print Pack',
            variant: 'outlined',
            color: 'inherit',
            icon: 'solar:printer-minimalistic-bold',
            onClick: () => setPrintOpen(true),
          },
          {
            label: 'Export CSV',
            variant: 'outlined',
            color: 'inherit',
            icon: 'solar:document-bold',
            onClick: () =>
              runActionWithToast(
                () =>
                  exportCsvFile(
                    `${exportFileName || sanitizeExportName(documentNumber || title)}-detail`,
                    buildTransactionCsvRows({
                      summary,
                      sections,
                      tables,
                      controlChecks,
                      referenceLinks,
                      timeline,
                      auditTrail: normalizedAuditTrail,
                    })
                  ),
                'CSV exported',
                'Failed to export CSV',
                'Exporting CSV...',
                'Export CSV'
              ),
          },
          {
            label: 'Export Excel',
            variant: 'outlined',
            color: 'inherit',
            icon: 'solar:file-download-bold',
            onClick: () =>
              runActionWithToast(
                () =>
                  exportExcelWorkbook(
                    `${exportFileName || sanitizeExportName(documentNumber || title)}-detail`,
                    buildTransactionWorkbookData({
                      summary,
                      sections,
                      tables,
                      controlChecks,
                      referenceLinks,
                      timeline,
                      auditTrail: normalizedAuditTrail,
                    })
                  ),
                'Excel workbook exported',
                'Failed to export Excel workbook',
                'Building Excel workbook...',
                'Export Excel'
              ),
          },
          {
            label: 'Export JSON',
            variant: 'outlined',
            color: 'inherit',
            icon: 'solar:download-bold',
            onClick: () =>
              runActionWithToast(
                () =>
                  exportJsonFile(
                    exportFileName || sanitizeExportName(documentNumber || title),
                    exportPayload || {
                      title,
                      subtitle,
                      documentNumber,
                      alerts,
                      summary,
                      sections,
                      tables,
                      sidebar,
                      auditTrail: normalizedAuditTrail,
                      controlChecks,
                      referenceLinks,
                      timeline,
                    }
                  ),
                'JSON exported',
                'Failed to export JSON',
                'Exporting JSON...',
                'Export JSON'
              ),
          },
        ]
      : []),
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Button
              variant="outlined"
              size="small"
              component={RouterLink}
              href={backHref}
              startIcon={<Iconify icon="solar:arrow-left-linear" />}
            >
              Back
            </Button>
            {documentNumber ? (
              <Chip label={documentNumber} size="small" variant="outlined" />
            ) : null}
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          ) : null}
          {chips.length ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
              {chips.map((chip, index) => (
                <Box key={`${title}-chip-${index}`}>{renderValue(chip)}</Box>
              ))}
            </Stack>
          ) : null}
        </Box>
        {statusActions.length || combinedActions.length ? (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {statusActions.map((action) => (
              <Button
                key={`${title}-status-${action.label}`}
                size="small"
                variant={action.variant || 'outlined'}
                color={action.color || 'primary'}
                disabled={action.disabled || Boolean(pendingAction)}
                onClick={action.onClick}
                startIcon={
                  action.icon ? (
                    isValidElement(action.icon) ? (
                      action.icon
                    ) : (
                      <Iconify icon={action.icon} />
                    )
                  ) : null
                }
              >
                {pendingAction === action.label ? `${action.label}...` : action.label}
              </Button>
            ))}
            {combinedActions.map((action) => (
              <Button
                key={`${title}-${action.label}`}
                size="small"
                variant={action.variant || 'outlined'}
                color={action.color || 'primary'}
                disabled={action.disabled || Boolean(pendingAction)}
                onClick={action.onClick}
                component={action.href ? RouterLink : undefined}
                href={action.href}
                startIcon={action.icon ? <Iconify icon={action.icon} /> : null}
              >
                {pendingAction === action.label ? `${action.label}...` : action.label}
              </Button>
            ))}
          </Stack>
        ) : null}
      </Stack>

      {alerts.map((alert) => (
        <Alert
          key={`${title}-${alert.title}`}
          severity={alert.severity || 'info'}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            {alert.title}
          </Typography>
          <Typography variant="body2">{alert.description}</Typography>
        </Alert>
      ))}

      {summary.length ? (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {summary.map((item) => (
            <Grid key={`${title}-${item.label}`} size={{ xs: 12, md: 4 }}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                    {renderValue(item.value)}
                  </Typography>
                  {item.helper ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.75, display: 'block' }}
                    >
                      {item.helper}
                    </Typography>
                  ) : null}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            {sections.map((section) => (
              <DetailFieldsCard
                key={`${title}-${section.title}`}
                title={section.title}
                items={section.items}
              />
            ))}
            {tables.map((table) => (
              <DataTableCard key={`${title}-${table.title}`} {...table} />
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <ControlChecksCard checks={controlChecks} />
            {sidebar.map((section) => (
              <SidebarCard key={`${title}-${section.title}`} {...section} />
            ))}
            <ReferenceLinksCard links={referenceLinks} />
            <TimelineCard items={timeline} />
            <SidebarCard title="Audit Panel" items={normalizedAuditTrail} />
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title={title} onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
