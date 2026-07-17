'use client';

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
  Select,
  Tooltip,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  InputLabel,
  IconButton,
  FormControl,
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

import {
  STATUS_COLORS,
  STATUS_LABELS,
  SOURCE_LABELS,
  STATUS_OPTIONS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPE_OPTIONS,
} from 'src/sections/crm/constants';

import { useAuthContext } from 'src/auth/hooks';

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

// ─── PDF Documents ────────────────────────────────────────────────────────────

function LeadRowPdfDocument({ lead }) {
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
          <Text style={ps.docTitle}>Lead Report</Text>
          <Text style={ps.docSubtitle}>
            {lead.lead_id} · {lead.name} · Generated {new Date().toLocaleDateString()}
          </Text>
        </View>
        <View style={ps.section}>
          <Text style={ps.sectionTitle}>CUSTOMER INFORMATION</Text>
          {rows([
            ['Name', lead.name],
            ['Phone', lead.phone],
            ['Email', lead.email],
            ['Country', lead.country],
            ['City', lead.city],
            ['Area', lead.area],
            ['Address', lead.address],
            ['Source', SOURCE_LABELS[lead.source] || lead.source],
            ['Link', lead.link],
            ['Remarks', lead.remarks],
          ])}
        </View>
        <View style={ps.section}>
          <Text style={ps.sectionTitle}>PROJECT INFORMATION</Text>
          {rows([
            ['Project Name', lead.project_name],
            ['Project Type', PROJECT_TYPE_LABELS[lead.project_type] || lead.project_type],
            ['Customization', lead.customization],
            ['Status', STATUS_LABELS[lead.status] || lead.status],
          ])}
        </View>
        <View style={ps.section}>
          <Text style={ps.sectionTitle}>ASSIGNMENT</Text>
          {rows([
            ['Created By', lead.created_by_name],
            ['Assigned To', lead.assigned_to_name],
          ])}
        </View>
        <Text style={ps.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — CRM Module
        </Text>
      </PdfPage>
    </Document>
  );
}

function LeadsListPdfDocument({ leads }) {
  const headerCells = [
    { label: 'ID', style: { width: '7%' } },
    { label: 'Customer', style: { width: '11%' } },
    { label: 'Phone', style: { width: '10%' } },
    { label: 'Email', style: { width: '14%' } },
    { label: 'Country', style: { width: '8%' } },
    { label: 'City', style: { width: '8%' } },
    { label: 'Area', style: { width: '8%' } },
    { label: 'Project', style: { width: '11%' } },
    { label: 'Type', style: { width: '7%' } },
    { label: 'Status', style: { width: '7%' } },
    { label: 'Source', style: { width: '6%' } },
    { label: 'Assigned', style: { width: '7%' } },
  ];

  return (
    <Document>
      <PdfPage size="A4" orientation="landscape" style={ls.page}>
        <View style={ls.headerBlock}>
          <Text style={ls.title}>Leads Report</Text>
          <Text style={ls.subtitle}>
            {leads.length} lead{leads.length === 1 ? '' : 's'} · Generated{' '}
            {new Date().toLocaleDateString()}
          </Text>
        </View>
        <View style={ls.tableHeader}>
          {headerCells.map((c) => (
            <Text key={c.label} style={[ls.headerCell, c.style]}>
              {c.label}
            </Text>
          ))}
        </View>
        {leads.map((row, i) => (
          <View key={row.id} style={i % 2 === 0 ? ls.tableRowEven : ls.tableRowOdd}>
            <Text style={[ls.cell, { width: '7%' }]}>{row.lead_id || '—'}</Text>
            <Text style={[ls.cell, { width: '11%', fontFamily: 'Helvetica-Bold' }]}>
              {row.name || '—'}
            </Text>
            <Text style={[ls.cell, { width: '10%' }]}>{row.phone || '—'}</Text>
            <Text style={[ls.cell, { width: '14%' }]}>{row.email || '—'}</Text>
            <Text style={[ls.cell, { width: '8%' }]}>{row.country || '—'}</Text>
            <Text style={[ls.cell, { width: '8%' }]}>{row.city || '—'}</Text>
            <Text style={[ls.cell, { width: '8%' }]}>{row.area || '—'}</Text>
            <Text style={[ls.cell, { width: '11%' }]}>{row.project_name || '—'}</Text>
            <Text style={[ls.cell, { width: '7%' }]}>
              {PROJECT_TYPE_LABELS[row.project_type] || row.project_type || '—'}
            </Text>
            <Text style={[ls.cell, { width: '7%' }]}>
              {STATUS_LABELS[row.status] || row.status || '—'}
            </Text>
            <Text style={[ls.cell, { width: '6%' }]}>
              {SOURCE_LABELS[row.source] || row.source || '—'}
            </Text>
            <Text style={[ls.cell, { width: '7%' }]}>{row.assigned_to_name || '—'}</Text>
          </View>
        ))}
        <Text style={ls.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — CRM Module
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
        {STATUS_OPTIONS.filter((opt) => opt.value !== row.status).map((opt) => (
          <MenuItem key={opt.value} onClick={() => handleSelect(opt.value)}>
            <Label
              variant="soft"
              color={STATUS_COLORS[opt.value] || 'default'}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AllLeadsPage() {
  const { user } = useAuthContext();
  const table = useTable({ defaultCurrentPage: 0, defaultRowsPerPage: 10 });
  const [deleteId, setDeleteId] = useState(null);
  const confirm = useBoolean();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const canAddLead = user?.user_permissions_list?.some((p) => p.codename === 'add_lead');
  const canChangeLead = user?.user_permissions_list?.some((p) => p.codename === 'change_lead');
  const canDeleteLead = user?.user_permissions_list?.some((p) => p.codename === 'delete_lead');

  const [statusTab, setStatusTab] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const { data: rawData, loading } = useGetRequest(endpoints.crm.leads);

  const tableData = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    return rawData?.results || [];
  }, [rawData]);

  const uniqueSorted = (items) =>
    [...new Set(items.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));

  const tabCounts = useMemo(() => {
    const counts = { all: tableData.length };
    STATUS_OPTIONS.forEach((opt) => {
      counts[opt.value] = tableData.filter((r) => r.status === opt.value).length;
    });
    return counts;
  }, [tableData]);

  const projectOptions = useMemo(
    () => uniqueSorted(tableData.map((r) => r.project_name)).map((n) => ({ value: n, label: n })),
    [tableData]
  );

  const nameOptions = useMemo(
    () => uniqueSorted(tableData.map((r) => r.name)).map((n) => ({ value: n, label: n })),
    [tableData]
  );

  const phoneOptions = useMemo(
    () => uniqueSorted(tableData.map((r) => r.phone)).map((n) => ({ value: n, label: n })),
    [tableData]
  );

  const areaOptions = useMemo(
    () => uniqueSorted(tableData.map((r) => r.area)).map((n) => ({ value: n, label: n })),
    [tableData]
  );

  const assignedOptions = useMemo(
    () =>
      uniqueSorted(tableData.map((r) => r.assigned_to_name).filter((v) => v && v !== '—')).map(
        (n) => ({ value: n, label: n })
      ),
    [tableData]
  );

  const summary = useMemo(
    () => ({
      total: tableData.length,
      new: tableData.filter((r) => r.status === 'new').length,
      won: tableData.filter((r) => r.status === 'won').length,
      lost: tableData.filter((r) => r.status === 'lost').length,
    }),
    [tableData]
  );

  const filtered = useMemo(() => {
    let result = tableData;
    if (statusTab !== 'all') result = result.filter((r) => r.status === statusTab);
    if (projectFilter !== 'all') result = result.filter((r) => r.project_name === projectFilter);
    if (projectTypeFilter !== 'all')
      result = result.filter((r) => r.project_type === projectTypeFilter);
    if (nameFilter !== 'all') result = result.filter((r) => r.name === nameFilter);
    if (phoneFilter !== 'all') result = result.filter((r) => r.phone === phoneFilter);
    if (areaFilter !== 'all') result = result.filter((r) => r.area === areaFilter);
    if (assignedFilter !== 'all')
      result = result.filter((r) => r.assigned_to_name === assignedFilter);
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          (r.name || '').toLowerCase().includes(q) ||
          (r.lead_id || '').toLowerCase().includes(q) ||
          (r.phone || '').toLowerCase().includes(q) ||
          (r.project_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [
    tableData,
    statusTab,
    projectFilter,
    projectTypeFilter,
    nameFilter,
    phoneFilter,
    areaFilter,
    assignedFilter,
    searchText,
  ]);

  const paginated = filtered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const hasActiveFilters =
    projectFilter !== 'all' ||
    projectTypeFilter !== 'all' ||
    nameFilter !== 'all' ||
    phoneFilter !== 'all' ||
    areaFilter !== 'all' ||
    assignedFilter !== 'all' ||
    searchText;

  const handleClearFilters = () => {
    setProjectFilter('all');
    setProjectTypeFilter('all');
    setNameFilter('all');
    setPhoneFilter('all');
    setAreaFilter('all');
    setAssignedFilter('all');
    setSearchText('');
    table.onResetPage();
  };

  const handleStatusChange = async (id, status) => {
    try {
      await usePatchRequest(endpoints.crm.leadById(id), { status });
      toast.success('Status updated successfully');
      mutate(endpoints.crm.leads);
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleListPrint = async () => {
    if (!filtered.length) {
      toast.error('No leads to print.');
      return;
    }
    setPdfLoading(true);
    try {
      const blob = await pdf(<LeadsListPdfDocument leads={filtered} />).toBlob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      toast.error('Failed to generate print view.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleListExcelExport = async () => {
    if (!filtered.length) {
      toast.error('No leads to export.');
      return;
    }
    setExportingExcel(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Leads');
      sheet.columns = [
        { header: 'Lead ID', key: 'lead_id', width: 14 },
        { header: 'Customer Name', key: 'name', width: 22 },
        { header: 'Phone', key: 'phone', width: 16 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Country', key: 'country', width: 14 },
        { header: 'City', key: 'city', width: 14 },
        { header: 'Area', key: 'area', width: 16 },
        { header: 'Address', key: 'address', width: 22 },
        { header: 'Source', key: 'source', width: 14 },
        { header: 'Project Name', key: 'project_name', width: 22 },
        { header: 'Project Type', key: 'project_type', width: 14 },
        { header: 'Customization', key: 'customization', width: 16 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Assigned To', key: 'assigned_to_name', width: 20 },
        { header: 'Created By', key: 'created_by_name', width: 20 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 22;
      filtered.forEach((row) => {
        sheet.addRow({
          lead_id: row.lead_id,
          name: row.name,
          phone: row.phone,
          email: row.email,
          country: row.country,
          city: row.city,
          area: row.area,
          address: row.address,
          source: SOURCE_LABELS[row.source] || row.source,
          project_name: row.project_name,
          project_type: PROJECT_TYPE_LABELS[row.project_type] || row.project_type,
          customization: row.customization,
          status: STATUS_LABELS[row.status] || row.status,
          assigned_to_name: row.assigned_to_name,
          created_by_name: row.created_by_name,
          remarks: row.remarks,
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      const blob = await pdf(<LeadRowPdfDocument lead={row} />).toBlob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch {
      toast.error('Failed to open print view.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(endpoints.crm.leadById(deleteId));
      toast.success('Lead deleted successfully');
      mutate(endpoints.crm.leads);
    } catch (error) {
      toast.error(error?.message || 'Unable to delete lead.');
    } finally {
      confirm.onFalse();
      setDeleteId(null);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Typography variant="h4" fontWeight={700}>
          All Leads
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
        Manage and track sales leads
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Leads"
            value={summary.total}
            icon="solar:users-group-rounded-bold-duotone"
            iconColor="#3b82f6"
            iconBg="#eff6ff"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="New Leads"
            value={summary.new}
            icon="solar:star-bold-duotone"
            iconColor="#f59e0b"
            iconBg="#fffbeb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Won"
            value={summary.won}
            icon="solar:trophy-bold-duotone"
            iconColor="#10b981"
            iconBg="#f0fdf4"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Lost"
            value={summary.lost}
            icon="solar:close-circle-bold-duotone"
            iconColor="#ef4444"
            iconBg="#fef2f2"
          />
        </Grid>
      </Grid>

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
                Lead Directory
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} lead{filtered.length === 1 ? '' : 's'} found
              </Typography>
            </Box>
            {canAddLead && (
              <Button
                onClick={() => window.open(paths.dashboard.crm.leads.create, '_blank')}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                disabled={loading}
                sx={{ whiteSpace: 'nowrap', alignSelf: { xs: 'stretch', sm: 'auto' } }}
              >
                Create Lead
              </Button>
            )}
          </Stack>

          {/* Status Tabs */}
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={statusTab}
              onChange={(_, v) => {
                setStatusTab(v);
                table.onResetPage();
              }}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab value="all" label={`All (${tabCounts.all})`} />
              {STATUS_OPTIONS.map((opt) => (
                <Tab
                  key={opt.value}
                  value={opt.value}
                  label={`${opt.label} (${tabCounts[opt.value] || 0})`}
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
              label="Project Name"
              value={projectFilter}
              onChange={(e) => {
                setProjectFilter(e.target.value);
                table.onResetPage();
              }}
              options={projectOptions}
              minWidth={180}
            />
            <SelectFilter
              label="Project Type"
              value={projectTypeFilter}
              onChange={(e) => {
                setProjectTypeFilter(e.target.value);
                table.onResetPage();
              }}
              options={PROJECT_TYPE_OPTIONS}
              minWidth={170}
            />
            <SelectFilter
              label="Customer Name"
              value={nameFilter}
              onChange={(e) => {
                setNameFilter(e.target.value);
                table.onResetPage();
              }}
              options={nameOptions}
              minWidth={180}
            />
            <SelectFilter
              label="Phone"
              value={phoneFilter}
              onChange={(e) => {
                setPhoneFilter(e.target.value);
                table.onResetPage();
              }}
              options={phoneOptions}
              minWidth={160}
            />
            <SelectFilter
              label="Area"
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                table.onResetPage();
              }}
              options={areaOptions}
              minWidth={160}
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
              placeholder="Search by name, ID, phone, project..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                table.onResetPage();
              }}
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            {hasActiveFilters && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:close-circle-bold" width={16} />}
                onClick={handleClearFilters}
                sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                Clear filters
              </Button>
            )}
          </Stack>
        </Box>

        <TableContainer>
          <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Lead ID</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Area</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#374151' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#374151' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Iconify
                        icon="solar:users-group-rounded-bold-duotone"
                        width={48}
                        sx={{ color: 'text.disabled', mb: 1.5 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        No leads found.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    sx={{
                      '&:last-child td': { borderBottom: 0 },
                      borderBottom: '1px solid #f3f4f6',
                      '&:nth-of-type(odd)': { bgcolor: 'background.paper' },
                      '&:nth-of-type(even)': { bgcolor: '#f0fdf4' },
                      '&:hover': { bgcolor: '#f0f9ff !important' },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.lead_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.project_name || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {PROJECT_TYPE_LABELS[row.project_type] || row.project_type || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.area || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color={STATUS_COLORS[row.status] || 'default'}>
                        {STATUS_LABELS[row.status] || row.status}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            component={RouterLink}
                            href={paths.dashboard.crm.leads.detail(row.id)}
                            sx={{
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.lighter' },
                            }}
                          >
                            <Iconify icon="solar:eye-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                        {canChangeLead && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              component={RouterLink}
                              href={paths.dashboard.crm.leads.edit(row.id)}
                              sx={{ color: 'info.main', '&:hover': { bgcolor: 'info.lighter' } }}
                            >
                              <Iconify icon="solar:pen-bold" width={18} />
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
                        {canDeleteLead && (
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
                ))
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
        title="Delete lead"
        content="Are you sure you want to delete this lead? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
