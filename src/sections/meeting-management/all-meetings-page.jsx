'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import {
  pdf,
  View,
  Text,
  Document,
  Page as PdfPage,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Box,
  Tab,
  Card,
  Grid,
  Tabs,
  Menu,
  Stack,
  Table,
  Button,
  Dialog,
  Select,
  Tooltip,
  MenuItem,
  TableRow,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePatchRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useTable, TableEmptyRows, TablePaginationCustom } from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks';

import { MEETING_STATUS_LABELS, MEETING_STATUS_COLORS, MEETING_STATUS_OPTIONS } from './constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (t) => (t ? t.slice(0, 5) : '—');

const TODAY = dayjs().format('YYYY-MM-DD');
const YESTERDAY = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const TOMORROW = dayjs().add(1, 'day').format('YYYY-MM-DD');

function isMissed(row) {
  return row.date < TODAY && !['completed', 'cancelled'].includes(row.status);
}

function getDateBucket(row) {
  const { date } = row;
  if (!date) return 'next';
  if (isMissed(row)) return 'missed';
  if (date === YESTERDAY) return 'yesterday';
  if (date === TODAY) return 'today';
  if (date === TOMORROW) return 'tomorrow';
  if (date > TOMORROW) return 'next';
  return 'yesterday';
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

const ps = PdfStyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  headerBlock: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
  },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 3, color: '#111' },
  docSubtitle: { fontSize: 10, color: '#777' },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8e8e8',
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    borderBottomStyle: 'solid',
  },
  rowLabel: { width: '38%', color: '#666' },
  rowValue: { flex: 1, fontFamily: 'Helvetica-Bold' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#bbb',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
});

const ls = PdfStyleSheet.create({
  page: { padding: 24, fontSize: 7, fontFamily: 'Helvetica', color: '#1a1a1a' },
  headerBlock: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
  },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111' },
  subtitle: { fontSize: 8, color: '#777', marginTop: 2 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  headerCell: { fontFamily: 'Helvetica-Bold', fontSize: 6.5, color: '#fff' },
  tableRowEven: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 0.3,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
  },
  tableRowOdd: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.3,
    borderBottomColor: '#e2e8f0',
    borderBottomStyle: 'solid',
  },
  cell: { fontSize: 6.5 },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 24,
    right: 24,
    textAlign: 'center',
    fontSize: 7,
    color: '#bbb',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 5,
  },
});

// ─── Per-row PDF ──────────────────────────────────────────────────────────────

function MeetingRowPdfDocument({ meeting }) {
  const rows = (pairs) =>
    pairs
      .filter(([, v]) => v)
      .map(([label, value]) => (
        <View key={label} style={ps.row}>
          <Text style={ps.rowLabel}>{label}</Text>
          <Text style={ps.rowValue}>{value}</Text>
        </View>
      ));

  return (
    <Document>
      <PdfPage size="A4" style={ps.page}>
        <View style={ps.headerBlock}>
          <Text style={ps.docTitle}>Meeting Report</Text>
          <Text style={ps.docSubtitle}>
            {meeting.meeting_id} · {meeting.title} · Generated {new Date().toLocaleDateString()}
          </Text>
        </View>
        <View style={ps.section}>
          <Text style={ps.sectionTitle}>MEETING DETAILS</Text>
          {rows([
            ['Meeting ID', meeting.meeting_id],
            ['Title', meeting.title],
            ['Description', meeting.description],
            ['Date', meeting.date],
            ['Start Time', fmt(meeting.start_time)],
            ['End Time', fmt(meeting.end_time)],
            ['Status', MEETING_STATUS_LABELS[meeting.status] || meeting.status],
            ['Location', meeting.location],
            ['Meeting Link', meeting.meeting_link],
          ])}
        </View>
        <View style={ps.section}>
          <Text style={ps.sectionTitle}>AGENDA & MINUTES</Text>
          {rows([
            ['Agenda', meeting.agenda],
            ['Minutes', meeting.minutes],
          ])}
        </View>
        <View style={ps.section}>
          <Text style={ps.sectionTitle}>ASSIGNMENT</Text>
          {rows([
            ['Created By', meeting.created_by_name],
            ['Assigned To', meeting.assigned_to_names],
          ])}
        </View>
        <Text style={ps.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — Meeting Management
        </Text>
      </PdfPage>
    </Document>
  );
}

// ─── List PDF ─────────────────────────────────────────────────────────────────

function MeetingsListPdfDocument({ meetings }) {
  const cols = [
    { label: 'ID', w: '9%' },
    { label: 'Title', w: '18%' },
    { label: 'Date', w: '10%' },
    { label: 'Start', w: '8%' },
    { label: 'End', w: '8%' },
    { label: 'Status', w: '10%' },
    { label: 'Location', w: '15%' },
    { label: 'Assigned To', w: '14%' },
    { label: 'Created By', w: '8%' },
  ];

  return (
    <Document>
      <PdfPage size="A4" orientation="landscape" style={ls.page}>
        <View style={ls.headerBlock}>
          <Text style={ls.title}>Meetings Report</Text>
          <Text style={ls.subtitle}>
            {meetings.length} meeting{meetings.length === 1 ? '' : 's'} · Generated{' '}
            {new Date().toLocaleDateString()}
          </Text>
        </View>
        <View style={ls.tableHeader}>
          {cols.map((c) => (
            <Text key={c.label} style={[ls.headerCell, { width: c.w }]}>
              {c.label}
            </Text>
          ))}
        </View>
        {meetings.map((row, i) => (
          <View key={row.id} style={i % 2 === 0 ? ls.tableRowEven : ls.tableRowOdd}>
            <Text style={[ls.cell, { width: '9%' }]}>{row.meeting_id || '—'}</Text>
            <Text style={[ls.cell, { width: '18%', fontFamily: 'Helvetica-Bold' }]}>
              {row.title || '—'}
            </Text>
            <Text style={[ls.cell, { width: '10%' }]}>{row.date || '—'}</Text>
            <Text style={[ls.cell, { width: '8%' }]}>{fmt(row.start_time)}</Text>
            <Text style={[ls.cell, { width: '8%' }]}>{fmt(row.end_time)}</Text>
            <Text style={[ls.cell, { width: '10%' }]}>
              {MEETING_STATUS_LABELS[row.status] || row.status || '—'}
            </Text>
            <Text style={[ls.cell, { width: '15%' }]}>{row.location || '—'}</Text>
            <Text style={[ls.cell, { width: '14%' }]}>{row.assigned_to_names || '—'}</Text>
            <Text style={[ls.cell, { width: '8%' }]}>{row.created_by_name || '—'}</Text>
          </View>
        ))}
        <Text style={ls.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — Meeting Management
        </Text>
      </PdfPage>
    </Document>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ title, value, icon, iconColor, iconBg }) {
  return (
    <Card
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2,
          bgcolor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={26} sx={{ color: iconColor }} />
      </Box>
      <Box>
        <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </Card>
  );
}

function SelectFilter({ label, value, onChange, options, minWidth = 160 }) {
  return (
    <FormControl size="small" sx={{ minWidth }}>
      <InputLabel>{label}</InputLabel>
      <Select value={value} label={label} onChange={onChange}>
        <MenuItem value="all">
          <em>All</em>
        </MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt.value || opt} value={opt.value || opt}>
            {opt.label || opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// ─── Status Change Menu ───────────────────────────────────────────────────────

function StatusChangeMenu({ row, onStatusChange }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = (status) => {
    onStatusChange(row.id, status);
    handleClose();
  };

  return (
    <>
      <Tooltip title="Change Status">
        <IconButton
          size="small"
          onClick={handleOpen}
          sx={{ color: 'warning.main', '&:hover': { bgcolor: 'warning.lighter' } }}
        >
          <Iconify icon="solar:refresh-bold" width={18} />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {MEETING_STATUS_OPTIONS.filter((opt) => opt.value !== row.status).map((opt) => (
          <MenuItem key={opt.value} onClick={() => handleSelect(opt.value)}>
            <Label
              variant="soft"
              color={MEETING_STATUS_COLORS[opt.value] || 'default'}
              sx={{ cursor: 'pointer' }}
            >
              {opt.label}
            </Label>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

// ─── Reschedule Dialog ────────────────────────────────────────────────────────

function RescheduleDialog({ open, onClose, meeting, onReschedule }) {
  const [newDate, setNewDate] = useState(null);

  const handleSubmit = () => {
    if (!newDate) {
      toast.error('Please select a new date.');
      return;
    }
    const formatted = dayjs(newDate).format('YYYY-MM-DD');
    if (formatted <= TODAY) {
      toast.error('Reschedule date must be in the future.');
      return;
    }
    onReschedule(meeting.id, formatted);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reschedule Meeting</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a new date for <strong>{meeting?.title}</strong>
        </Typography>
        <DatePicker
          label="New Date"
          value={newDate}
          onChange={setNewDate}
          minDate={dayjs().add(1, 'day')}
          format="DD-MM-YYYY"
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Reschedule
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AllMeetingsPage() {
  const { user } = useAuthContext();
  const table = useTable({ defaultCurrentPage: 0, defaultRowsPerPage: 10 });
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const canAddMeeting = user?.user_permissions_list?.some((p) => p.codename === 'add_meeting');
  const canChangeMeeting = user?.user_permissions_list?.some(
    (p) => p.codename === 'change_meeting'
  );
  const canDeleteMeeting = user?.user_permissions_list?.some(
    (p) => p.codename === 'delete_meeting'
  );

  const [dateTab, setDateTab] = useState('today');
  const [titleFilter, setTitleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const rescheduleOpen = useBoolean();

  const { data: rawData, loading } = useGetRequest(endpoints.meetingManagement.meetings);

  const tableData = useMemo(() => {
    const rows = Array.isArray(rawData) ? rawData : rawData?.results || [];
    return rows.map((r) => ({
      ...r,
      assigned_to_names: Array.isArray(r.assigned_to_names)
        ? r.assigned_to_names.map((u) => u.name).join(', ')
        : r.assigned_to_names || '—',
    }));
  }, [rawData]);

  // ── Tab counts ────────────────────────────────────────────────────────────

  const tabCounts = useMemo(
    () => ({
      all: tableData.length,
      missed: tableData.filter((r) => isMissed(r)).length,
      yesterday: tableData.filter((r) => r.date === YESTERDAY).length,
      today: tableData.filter((r) => r.date === TODAY).length,
      tomorrow: tableData.filter((r) => r.date === TOMORROW).length,
      next: tableData.filter((r) => r.date > TOMORROW).length,
    }),
    [tableData]
  );

  const DATE_TABS = [
    { value: 'all', label: 'All' },
    { value: 'missed', label: 'Missed' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'next', label: 'Next' },
  ];

  // ── Summary ───────────────────────────────────────────────────────────────

  const summary = useMemo(
    () => ({
      total: tableData.length,
      scheduled: tableData.filter((r) => r.status === 'scheduled').length,
      completed: tableData.filter((r) => r.status === 'completed').length,
      cancelled: tableData.filter((r) => r.status === 'cancelled').length,
    }),
    [tableData]
  );

  // ── Filter options ────────────────────────────────────────────────────────

  const titleOptions = useMemo(
    () =>
      [...new Set(tableData.map((r) => r.title).filter(Boolean))]
        .sort()
        .map((t) => ({ value: t, label: t })),
    [tableData]
  );

  const assignedOptions = useMemo(
    () =>
      [...new Set(tableData.map((r) => r.assigned_to_names).filter((v) => v && v !== '—'))]
        .sort()
        .map((n) => ({ value: n, label: n })),
    [tableData]
  );

  // ── Filtered data ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let result = tableData;

    // Date tab filter
    if (dateTab === 'missed') result = result.filter((r) => isMissed(r));
    else if (dateTab === 'yesterday') result = result.filter((r) => r.date === YESTERDAY);
    else if (dateTab === 'today') result = result.filter((r) => r.date === TODAY);
    else if (dateTab === 'tomorrow') result = result.filter((r) => r.date === TOMORROW);
    else if (dateTab === 'next') result = result.filter((r) => r.date > TOMORROW);

    if (titleFilter !== 'all') result = result.filter((r) => r.title === titleFilter);
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (assignedFilter !== 'all')
      result = result.filter((r) => r.assigned_to_names === assignedFilter);
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          (r.title || '').toLowerCase().includes(q) ||
          (r.meeting_id || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [tableData, dateTab, titleFilter, statusFilter, assignedFilter, searchText]);

  const paginated = filtered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const hasFilters =
    titleFilter !== 'all' || statusFilter !== 'all' || assignedFilter !== 'all' || searchText;

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleStatusChange = async (id, status) => {
    try {
      await usePatchRequest(endpoints.meetingManagement.meetingById(id), { status });
      toast.success('Status updated successfully');
      mutate(endpoints.meetingManagement.meetings);
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleReschedule = async (id, newDate) => {
    try {
      await usePatchRequest(endpoints.meetingManagement.meetingById(id), {
        date: newDate,
        status: 'scheduled',
      });
      toast.success('Meeting rescheduled successfully');
      mutate(endpoints.meetingManagement.meetings);
    } catch {
      toast.error('Failed to reschedule meeting.');
    }
  };

  const handleListPrint = async () => {
    if (!filtered.length) {
      toast.error('No meetings to print.');
      return;
    }
    setPdfLoading(true);
    try {
      const blob = await pdf(<MeetingsListPdfDocument meetings={filtered} />).toBlob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      toast.error('Failed to generate print view.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleListPdfDownload = async () => {
    if (!filtered.length) {
      toast.error('No meetings to export.');
      return;
    }
    setPdfLoading(true);
    try {
      const blob = await pdf(<MeetingsListPdfDocument meetings={filtered} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `meetings-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleListExcelExport = async () => {
    if (!filtered.length) {
      toast.error('No meetings to export.');
      return;
    }
    setExportingExcel(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Meetings');
      sheet.columns = [
        { header: 'Meeting ID', key: 'meeting_id', width: 14 },
        { header: 'Title', key: 'title', width: 28 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Start Time', key: 'start_time', width: 12 },
        { header: 'End Time', key: 'end_time', width: 12 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Location', key: 'location', width: 22 },
        { header: 'Meeting Link', key: 'meeting_link', width: 30 },
        { header: 'Agenda', key: 'agenda', width: 34 },
        { header: 'Minutes', key: 'minutes', width: 34 },
        { header: 'Assigned To', key: 'assigned_to_names', width: 22 },
        { header: 'Created By', key: 'created_by_name', width: 22 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 22;
      filtered.forEach((row) => {
        sheet.addRow({
          meeting_id: row.meeting_id,
          title: row.title,
          date: row.date,
          start_time: fmt(row.start_time),
          end_time: fmt(row.end_time),
          status: MEETING_STATUS_LABELS[row.status] || row.status,
          location: row.location,
          meeting_link: row.meeting_link,
          agenda: row.agenda,
          minutes: row.minutes,
          assigned_to_names: row.assigned_to_names,
          created_by_name: row.created_by_name,
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `meetings-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrint = async (row) => {
    setPdfLoading(true);
    try {
      const blob = await pdf(<MeetingRowPdfDocument meeting={row} />).toBlob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      toast.error('Failed to open print view.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(endpoints.meetingManagement.meetingById(deleteId));
      toast.success('Meeting deleted successfully');
      mutate(endpoints.meetingManagement.meetings);
    } catch (error) {
      toast.error(error?.message || 'Unable to delete meeting.');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="h4" fontWeight={700}>
          All Meetings
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Open list in print view">
            <span>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:printer-bold" width={18} />}
                onClick={handleListPrint}
                disabled={pdfLoading || !filtered.length}
              >
                Print
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Download list as PDF">
            <span>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:file-download-bold" width={18} />}
                onClick={handleListPdfDownload}
                disabled={pdfLoading || !filtered.length}
              >
                {pdfLoading ? '…' : 'PDF'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Download list as Excel">
            <span>
              <Button
                variant="outlined"
                color="success"
                startIcon={<Iconify icon="solar:export-bold" width={18} />}
                onClick={handleListExcelExport}
                disabled={exportingExcel || !filtered.length}
              >
                {exportingExcel ? '…' : 'Excel'}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage and track all scheduled meetings
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Meetings"
            value={summary.total}
            icon="solar:calendar-bold-duotone"
            iconColor="#3b82f6"
            iconBg="#eff6ff"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Scheduled"
            value={summary.scheduled}
            icon="solar:clock-bold-duotone"
            iconColor="#f59e0b"
            iconBg="#fffbeb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Completed"
            value={summary.completed}
            icon="solar:check-circle-bold-duotone"
            iconColor="#10b981"
            iconBg="#f0fdf4"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Cancelled"
            value={summary.cancelled}
            icon="solar:close-circle-bold-duotone"
            iconColor="#ef4444"
            iconBg="#fef2f2"
          />
        </Grid>
      </Grid>

      {/* Table Card */}
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: '1px solid #e5e7eb' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', sm: 'center' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Meeting Directory
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} meeting{filtered.length === 1 ? '' : 's'} found
              </Typography>
            </Box>
            {canAddMeeting && (
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => window.open(paths.dashboard.meetingManagement.create, '_blank')}
                disabled={loading}
                sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                Create Meeting
              </Button>
            )}
          </Stack>

          {/* Date Tabs */}
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={dateTab}
              onChange={(_, v) => {
                setDateTab(v);
                table.onResetPage();
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {DATE_TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  value={tab.value}
                  label={`${tab.label} (${tabCounts[tab.value]})`}
                  sx={tab.value === 'missed' ? { color: 'error.main' } : {}}
                />
              ))}
            </Tabs>
          </Box>

          {/* Dropdown Filters */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            <SelectFilter
              label="Title"
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value);
                table.onResetPage();
              }}
              options={titleOptions}
              minWidth={180}
            />
            <SelectFilter
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                table.onResetPage();
              }}
              options={MEETING_STATUS_OPTIONS}
              minWidth={150}
            />
            <SelectFilter
              label="Assigned To"
              value={assignedFilter}
              onChange={(e) => {
                setAssignedFilter(e.target.value);
                table.onResetPage();
              }}
              options={assignedOptions}
              minWidth={180}
            />
            <TextField
              size="small"
              placeholder="Search by title or ID..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                table.onResetPage();
              }}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            {hasFilters && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:close-circle-bold" width={16} />}
                onClick={() => {
                  setTitleFilter('all');
                  setStatusFilter('all');
                  setAssignedFilter('all');
                  setSearchText('');
                  table.onResetPage();
                }}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Clear filters
              </Button>
            )}
          </Stack>
        </Box>

        {/* Table */}
        <TableContainer>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                {['Meeting ID', 'Title', 'Date', 'Time', 'Status', 'Assigned To', 'Actions'].map(
                  (h) => (
                    <TableCell
                      key={h}
                      align={h === 'Actions' ? 'right' : 'left'}
                      sx={{ fontWeight: 700, color: '#374151' }}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Iconify
                        icon="solar:calendar-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No meetings found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => {
                  const missed = isMissed(row);
                  const displayStatus = missed ? 'cancelled' : row.status;
                  const displayStatusLabel = missed
                    ? 'Missed'
                    : MEETING_STATUS_LABELS[row.status] || row.status;

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        '&:last-child td': { borderBottom: 0 },
                        borderBottom: '1px solid #f3f4f6',
                        '&:nth-of-type(odd)': { bgcolor: 'background.paper' },
                        '&:nth-of-type(even)': { bgcolor: missed ? '#fff5f5' : '#f0f9ff' },
                        '&:hover': {
                          bgcolor: missed ? '#fee2e2 !important' : '#e0f2fe !important',
                        },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {row.meeting_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {row.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.date || '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {fmt(row.start_time)} – {fmt(row.end_time)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Label
                          variant="soft"
                          color={MEETING_STATUS_COLORS[displayStatus] || 'default'}
                        >
                          {displayStatusLabel}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.assigned_to_names || '—'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={paths.dashboard.meetingManagement.detail(row.id)}
                              sx={{
                                color: 'primary.main',
                                '&:hover': { bgcolor: 'primary.lighter' },
                              }}
                            >
                              <Iconify icon="solar:eye-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          {canChangeMeeting && (
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  window.open(
                                    paths.dashboard.meetingManagement.edit(row.id),
                                    '_blank'
                                  )
                                }
                                sx={{ color: 'info.main', '&:hover': { bgcolor: 'info.lighter' } }}
                              >
                                <Iconify icon="solar:pen-bold" width={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                          {missed && (
                            <Tooltip title="Reschedule">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setRescheduleTarget(row);
                                  rescheduleOpen.onTrue();
                                }}
                                sx={{
                                  color: 'secondary.main',
                                  '&:hover': { bgcolor: 'secondary.lighter' },
                                }}
                              >
                                <Iconify icon="solar:calendar-add-bold" width={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <StatusChangeMenu row={row} onStatusChange={handleStatusChange} />
                          <Tooltip title="Print PDF">
                            <IconButton
                              size="small"
                              onClick={() => handlePrint(row)}
                              sx={{
                                color: 'success.main',
                                '&:hover': { bgcolor: 'success.lighter' },
                              }}
                            >
                              <Iconify icon="solar:printer-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          {canDeleteMeeting && (
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setDeleteId(row.id);
                                  confirm.onTrue();
                                }}
                                sx={{ '&:hover': { bgcolor: 'error.lighter' } }}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              <TableEmptyRows emptyRows={0} height={table.dense ? 52 : 76} />
            </TableBody>
          </Table>
        </TableContainer>

        <TablePaginationCustom
          count={filtered.length}
          page={table.page}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
          dense={table.dense}
          onChangeDense={table.onChangeDense}
        />
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete meeting"
        content="Are you sure you want to delete this meeting? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />

      <RescheduleDialog
        open={rescheduleOpen.value}
        onClose={rescheduleOpen.onFalse}
        meeting={rescheduleTarget}
        onReschedule={handleReschedule}
      />
    </Box>
  );
}
