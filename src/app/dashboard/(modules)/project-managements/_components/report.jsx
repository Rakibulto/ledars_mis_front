'use client';

import { useMemo, useState } from 'react';

import { toast } from 'sonner';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';

import { Iconify } from 'src/components/iconify';

import { useProjectManagementsApi } from './use-project-managements-api';
import ProjectReportPackPdf from './report-pack-pdf';

const STATUS_COLOR = {
  Active: 'success',
  Completed: 'info',
  'On Hold': 'warning',
  Planning: 'default',
};

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function fCurrency(n) {
  return `৳${Number(n).toLocaleString()}`;
}

function triggerReportDownload(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const normalized = String(value ?? '');
  if (!/[",\n]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function getReportActionButtonSx(theme, tone = 'default') {
  const isPrimary = tone === 'primary';

  return {
    minWidth: { xs: '100%', sm: 'auto' },
    px: 2.2,
    py: 1.15,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: '0.95rem',
    letterSpacing: '-0.01em',
    textTransform: 'none',
    whiteSpace: 'nowrap',
    borderWidth: 1,
    borderColor: isPrimary ? 'transparent' : alpha(theme.palette.grey[500], 0.24),
    color: isPrimary ? theme.palette.common.white : theme.palette.text.primary,
    background: isPrimary
      ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[800]} 100%)`
      : `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.grey[500], 0.04)} 100%)`,
    boxShadow: isPrimary
      ? `0 16px 30px ${alpha(theme.palette.grey[900], 0.22)}`
      : `0 10px 24px ${alpha(theme.palette.grey[900], 0.08)}`,
    backdropFilter: 'blur(8px)',
    transition: theme.transitions.create(['transform', 'box-shadow', 'border-color', 'background-color'], {
      duration: theme.transitions.duration.shorter,
    }),
    '&:hover': {
      transform: 'translateY(-1px)',
      borderColor: isPrimary ? 'transparent' : alpha(theme.palette.primary.main, 0.22),
      background: isPrimary
        ? `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[700]} 100%)`
        : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
      boxShadow: isPrimary
        ? `0 20px 34px ${alpha(theme.palette.grey[900], 0.28)}`
        : `0 14px 28px ${alpha(theme.palette.primary.main, 0.12)}`,
    },
    '&.Mui-disabled': {
      color: isPrimary ? alpha(theme.palette.common.white, 0.72) : theme.palette.text.disabled,
      borderColor: isPrimary ? 'transparent' : alpha(theme.palette.grey[500], 0.18),
      background: isPrimary
        ? `linear-gradient(135deg, ${alpha(theme.palette.grey[900], 0.72)} 0%, ${alpha(theme.palette.grey[800], 0.72)} 100%)`
        : alpha(theme.palette.grey[500], 0.08),
    },
  };
}

export default function ProjectReport() {
  const theme = useTheme();
  const { overview, isLoading, error } = useProjectManagementsApi();
  const [activeAction, setActiveAction] = useState('');
  const [isPrintPackOpen, setIsPrintPackOpen] = useState(false);

  const reportSnapshot = useMemo(
    () => ({
      generatedAt: new Date().toISOString(),
      summary: {
        projectCompletionRate: overview.projectCompletionRate,
        completedProjects: overview.completedProjects,
        totalProjects: overview.totalProjects,
        totalBudget: overview.totalBudget,
        workItemCompletionRate: overview.workItemCompletionRate,
        completedWorkItems: overview.completedWorkItems,
        totalWorkItems: overview.totalWorkItems,
        activeProjects: overview.activeProjects,
        overdueEntries: overview.overduePlans + overview.overdueWorkItems,
      },
      projectProgressRows: overview.projectProgressRows,
      statusDistribution: overview.statusDistribution,
      donorRows: overview.donorRows,
    }),
    [overview]
  );

  const SUMMARY = [
    {
      label: 'Project Completion Rate',
      value: `${overview.projectCompletionRate}%`,
      icon: 'solar:check-circle-bold-duotone',
      helper: `${overview.completedProjects} of ${overview.totalProjects} projects completed`,
    },
    {
      label: 'Approved Budget',
      value: fCurrency(overview.totalBudget),
      icon: 'solar:wallet-money-bold-duotone',
      helper: `${overview.totalProjects} projects with tracked approved budgets`,
    },
    {
      label: 'Task Completion Rate',
      value: `${overview.workItemCompletionRate}%`,
      icon: 'solar:checklist-minimalistic-bold-duotone',
      helper: `${overview.completedWorkItems} of ${overview.totalWorkItems} work items done`,
    },
    {
      label: 'Active Projects',
      value: overview.activeProjects,
      icon: 'solar:play-circle-bold-duotone',
      helper: `${overview.overduePlans + overview.overdueWorkItems} overdue plan/work item entries need attention`,
    },
  ];

  const reportPackDocument = useMemo(() => <ProjectReportPackPdf snapshot={reportSnapshot} />, [reportSnapshot]);

  function handleOpenPrintPack() {
    setIsPrintPackOpen(true);
  }

  function handleClosePrintPack() {
    setIsPrintPackOpen(false);
  }

  async function handleDownloadReport(format) {
    setActiveAction(format);

    try {
      const safeDate = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        triggerReportDownload(
          JSON.stringify(reportSnapshot, null, 2),
          `project-report-${safeDate}.json`,
          'application/json;charset=utf-8'
        );
      }

      if (format === 'csv') {
        const rows = [
          ['Project', 'Status', 'Progress Percent', 'Completed Work Items', 'Total Work Items', 'Donor', 'Approved Budget'],
          ...overview.projectProgressRows.map((project) => [
            project.title,
            project.derivedStatus,
            project.progressPercent,
            project.completedWorkItems,
            project.totalWorkItems || 0,
            project.donorName,
            project.budgetAmount,
          ]),
        ];

        triggerReportDownload(
          rows.map((row) => row.map(escapeCsv).join(',')).join('\n'),
          `project-report-${safeDate}.csv`,
          'text/csv;charset=utf-8'
        );
      }

      if (format === 'excel') {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const generatedAt = new Date(reportSnapshot.generatedAt);

        workbook.creator = 'LEDARS';
        workbook.created = generatedAt;
        workbook.modified = generatedAt;

        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
          { header: 'Metric', key: 'metric', width: 32 },
          { header: 'Value', key: 'value', width: 24 },
          { header: 'Details', key: 'details', width: 56 },
        ];
        summarySheet.addRows([
          {
            metric: 'Project Completion Rate',
            value: `${overview.projectCompletionRate}%`,
            details: `${overview.completedProjects} of ${overview.totalProjects} projects completed`,
          },
          {
            metric: 'Approved Budget',
            value: Number(overview.totalBudget || 0),
            details: `${overview.totalProjects} projects with tracked approved budgets`,
          },
          {
            metric: 'Task Completion Rate',
            value: `${overview.workItemCompletionRate}%`,
            details: `${overview.completedWorkItems} of ${overview.totalWorkItems} work items done`,
          },
          {
            metric: 'Active Projects',
            value: overview.activeProjects,
            details: `${overview.overduePlans + overview.overdueWorkItems} overdue plan/work item entries need attention`,
          },
        ]);

        const projectsSheet = workbook.addWorksheet('Projects');
        projectsSheet.columns = [
          { header: 'Project', key: 'title', width: 34 },
          { header: 'Status', key: 'status', width: 18 },
          { header: 'Progress %', key: 'progressPercent', width: 14 },
          { header: 'Completed Work Items', key: 'completedWorkItems', width: 20 },
          { header: 'Total Work Items', key: 'totalWorkItems', width: 18 },
          { header: 'Donor', key: 'donorName', width: 24 },
          { header: 'Approved Budget', key: 'budgetAmount', width: 18 },
        ];
        overview.projectProgressRows.forEach((project) => {
          projectsSheet.addRow({
            title: project.title,
            status: project.derivedStatus,
            progressPercent: project.progressPercent,
            completedWorkItems: project.completedWorkItems,
            totalWorkItems: project.totalWorkItems || 0,
            donorName: project.donorName,
            budgetAmount: Number(project.budgetAmount || 0),
          });
        });

        const donorsSheet = workbook.addWorksheet('Donors');
        donorsSheet.columns = [
          { header: 'Donor', key: 'name', width: 28 },
          { header: 'Projects', key: 'count', width: 14 },
          { header: 'Share %', key: 'share', width: 14 },
        ];
        overview.donorRows.forEach((row) => {
          donorsSheet.addRow({
            name: row.name,
            count: row.count,
            share: row.share,
          });
        });

        [summarySheet, projectsSheet, donorsSheet].forEach((sheet) => {
          sheet.getRow(1).font = { bold: true };
          sheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEAF2FF' },
          };
          sheet.views = [{ state: 'frozen', ySplit: 1 }];
        });

        summarySheet.getColumn('value').numFmt = '#,##0.00';
        projectsSheet.getColumn('budgetAmount').numFmt = '#,##0.00';

        const buffer = await workbook.xlsx.writeBuffer();
        triggerReportDownload(
          buffer,
          `project-report-${safeDate}.xlsx`,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
      }

      if (format === 'txt') {
        const lines = [
          'Project Report',
          `Generated: ${new Date(reportSnapshot.generatedAt).toLocaleString()}`,
          '',
          `Project completion rate: ${overview.projectCompletionRate}%`,
          `Approved budget: ${fCurrency(overview.totalBudget)}`,
          `Task completion rate: ${overview.workItemCompletionRate}%`,
          `Active projects: ${overview.activeProjects}`,
          '',
          'Per-Project Progress',
          ...overview.projectProgressRows.map(
            (project) => `- ${project.title}: ${project.progressPercent}% (${project.completedWorkItems}/${project.totalWorkItems || 0}) • ${project.derivedStatus}`
          ),
        ];

        triggerReportDownload(
          lines.join('\n'),
          `project-report-${safeDate}.txt`,
          'text/plain;charset=utf-8'
        );
      }

      toast.success(`Project report downloaded as ${format.toUpperCase()}.`);
    } catch (downloadError) {
      toast.error(downloadError?.message || 'Failed to download project report.');
    } finally {
      setActiveAction('');
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
            Project Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Aggregated analytics derived from project and task data.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} alignItems={{ xs: 'stretch', sm: 'center' }} useFlexGap flexWrap="wrap">
          <Button
            variant="outlined"
            color="inherit"
            startIcon={activeAction === 'csv' ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:document-text-bold" width={18} />}
            onClick={() => handleDownloadReport('csv')}
            disabled={Boolean(activeAction)}
            sx={getReportActionButtonSx(theme)}
          >
            {activeAction === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={activeAction === 'excel' ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:file-text-bold" width={18} />}
            onClick={() => handleDownloadReport('excel')}
            disabled={Boolean(activeAction)}
            sx={getReportActionButtonSx(theme)}
          >
            {activeAction === 'excel' ? 'Exporting Excel...' : 'Export Excel'}
          </Button>

          <Button
            variant="outlined"
            color="inherit"
            startIcon={activeAction === 'json' ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:code-bold" width={18} />}
            onClick={() => handleDownloadReport('json')}
            disabled={Boolean(activeAction)}
            sx={getReportActionButtonSx(theme)}
          >
            {activeAction === 'json' ? 'Exporting JSON...' : 'Export JSON'}
          </Button>

          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:printer-bold" width={18} />}
            onClick={handleOpenPrintPack}
            disabled={Boolean(activeAction)}
            sx={getReportActionButtonSx(theme, 'primary')}
          >
            Print Pack
          </Button>
        </Stack>
      </Stack>

      <Dialog
        open={isPrintPackOpen}
        onClose={handleClosePrintPack}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: alpha(theme.palette.grey[900], 0.96),
            backgroundImage: 'none',
          },
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.75,
            color: 'common.white',
            borderBottom: `1px solid ${alpha('#ffffff', 0.12)}`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Project Report Print Pack
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#ffffff', 0.72) }}>
                Preview the React PDF document and use the viewer controls to print or save it.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <PDFDownloadLink document={reportPackDocument} fileName={`project-report-pack-${new Date().toISOString().slice(0, 10)}.pdf`}>
                {({ loading }) => (
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:file-download-bold" width={18} />}
                    sx={{
                      ...getReportActionButtonSx(theme),
                      minWidth: 'auto',
                      color: 'common.white',
                      borderColor: alpha('#ffffff', 0.16),
                      background: alpha('#ffffff', 0.04),
                    }}
                  >
                    {loading ? 'Preparing PDF...' : 'Download PDF'}
                  </Button>
                )}
              </PDFDownloadLink>

              <IconButton
                onClick={handleClosePrintPack}
                sx={{
                  color: 'common.white',
                  border: `1px solid ${alpha('#ffffff', 0.14)}`,
                  bgcolor: alpha('#ffffff', 0.04),
                }}
              >
                <Iconify icon="mingcute:close-line" width={20} />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[950] || '#020617', 0.98) }}>
          {isPrintPackOpen ? (
            <PDFViewer width="100%" height="100%" style={{ border: 0, minHeight: 'calc(100vh - 88px)' }}>
              {reportPackDocument}
            </PDFViewer>
          ) : null}
        </DialogContent>
      </Dialog>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load report data right now.
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading report analytics...
          </Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {SUMMARY.map((s) => (
              <Grid key={s.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {s.label}
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
                          {s.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {s.helper}
                        </Typography>
                      </Box>
                      <Iconify icon={s.icon} width={32} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Per-Project Progress
                  </Typography>
                  <Stack spacing={2.5}>
                    {overview.projectProgressRows.map((project) => (
                      <Box key={project.id}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {project.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.progressSummary} • {project.progressDetail}
                            </Typography>
                          </Box>
                          <Chip
                            label={project.derivedStatus}
                            size="small"
                            color={STATUS_COLOR[project.derivedStatus] || 'default'}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ minWidth: 92 }}
                          >
                            Progress {project.progressPercent}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={project.progressPercent}
                            color={
                              project.progressPercent >= 100
                                ? 'success'
                                : project.progressPercent >= 50
                                  ? 'primary'
                                  : 'warning'
                            }
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {project.completedWorkItems}/{project.totalWorkItems || 0}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {project.donorName} • {fCurrency(project.budgetAmount)} approved budget
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Status Distribution
                    </Typography>
                    {overview.statusDistribution.map((status) => {
                      const value = pct(status.count, overview.totalProjects);

                      return (
                        <Box key={status.label} sx={{ mb: 1.5 }}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2">{status.label}</Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {status.count} ({value}%)
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={value}
                            color={status.color}
                            sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                          />
                        </Box>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                      Donor Budget Summary
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Donor</TableCell>
                            <TableCell align="right">Projects</TableCell>
                            <TableCell align="right">Budget</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {overview.donorRows.map((donor) => (
                            <TableRow key={donor.donorName}>
                              <TableCell sx={{ maxWidth: 140 }}>
                                <Typography variant="caption" noWrap>
                                  {donor.donorName}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption">{donor.projects}</Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="caption" fontWeight={700}>
                                  {fCurrency(donor.budgetAmount)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell>
                              <Typography variant="caption" fontWeight={700}>
                                Total
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" fontWeight={700}>
                                {overview.totalProjects}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption" fontWeight={700}>
                                {fCurrency(overview.totalBudget)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
