'use client';

import { toast } from 'sonner';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  pdf,
  View,
  Text,
  Document,
  Page as PdfPage,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import useSWR from 'swr';

import { Iconify } from 'src/components/iconify';
import { fetcher, endpoints } from 'src/utils/axios';

const TYPE_LABELS = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expense',
};

function buildTree(rows) {
  const childMap = {};
  const roots = [];

  rows.forEach((r) => {
    if (r.parent && rows.some((p) => p.id === r.parent)) {
      if (!childMap[r.parent]) childMap[r.parent] = [];
      childMap[r.parent].push(r);
    } else {
      roots.push(r);
    }
  });

  Object.values(childMap).forEach((children) =>
    children.sort((a, b) =>
      String(a.code).localeCompare(String(b.code), undefined, { numeric: true })
    )
  );

  roots.sort((a, b) =>
    String(a.code).localeCompare(String(b.code), undefined, { numeric: true })
  );

  return { roots, childMap };
}

function sumDescendants(childMap, nodeId, key) {
  const children = childMap[nodeId] || [];
  let total = 0;
  children.forEach((child) => {
    total += Number(child[key] || 0);
    total += sumDescendants(childMap, child.id, key);
  });
  return total;
}

function fmt(v) {
  return Number(v || 0).toFixed(2);
}

// ─── PDF Styles ───────────────────────────────────────────────────────────────

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

// ─── PDF Document ─────────────────────────────────────────────────────────────

function CoaListPdfDocument({ flatRows }) {
  const cols = [
    { label: 'Code', w: '7%' },
    { label: 'Account', w: '18%' },
    { label: 'Type', w: '8%' },
    { label: 'Opening Dr', w: '10%' },
    { label: 'Opening Cr', w: '10%' },
    { label: 'Period Dr', w: '10%' },
    { label: 'Period Cr', w: '10%' },
    { label: 'Closing Dr', w: '10%' },
    { label: 'Closing Cr', w: '10%' },
  ];

  return (
    <Document>
      <PdfPage size="A4" orientation="landscape" style={ls.page}>
        <View style={ls.headerBlock}>
          <Text style={ls.title}>Chart of Accounts</Text>
          <Text style={ls.subtitle}>
            {flatRows.length} account{flatRows.length === 1 ? '' : 's'} · Generated{' '}
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
        {flatRows.map((row, i) => (
          <View key={row.id} style={i % 2 === 0 ? ls.tableRowEven : ls.tableRowOdd}>
            <Text style={[ls.cell, { width: '7%', paddingLeft: row.depth * 8 }]}>
              {row.code || '—'}
            </Text>
            <Text style={[ls.cell, { width: '18%', fontFamily: row.isParent ? 'Helvetica-Bold' : 'Helvetica' }]}>
              {row.name || '—'}
            </Text>
            <Text style={[ls.cell, { width: '8%' }]}>
              {TYPE_LABELS[row.classification] || row.account_type_name || '—'}
            </Text>
            <Text style={[ls.cell, { width: '10%', textAlign: 'right' }]}>{fmt(row.opening_dr)}</Text>
            <Text style={[ls.cell, { width: '10%', textAlign: 'right' }]}>{fmt(row.opening_cr)}</Text>
            <Text style={[ls.cell, { width: '10%', textAlign: 'right' }]}>{fmt(row.period_dr)}</Text>
            <Text style={[ls.cell, { width: '10%', textAlign: 'right' }]}>{fmt(row.period_cr)}</Text>
            <Text style={[ls.cell, { width: '10%', textAlign: 'right' }]}>{fmt(row.closing_dr)}</Text>
            <Text style={[ls.cell, { width: '10%', textAlign: 'right', fontFamily: 'Helvetica-Bold' }]}>
              {fmt(row.closing_cr)}
            </Text>
          </View>
        ))}
        <Text style={ls.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — Chart of Accounts
        </Text>
      </PdfPage>
    </Document>
  );
}

function TreeRow({ node, childMap, depth, expanded, onToggle }) {
  const children = childMap[node.id] || [];
  const hasChildren = children.length > 0;
  const isExpanded = !!expanded[node.id];

  const dr = node.isParent
    ? Number(node.opening_dr || 0) + sumDescendants(childMap, node.id, 'opening_dr')
    : Number(node.opening_dr || 0);
  const cr = node.isParent
    ? Number(node.opening_cr || 0) + sumDescendants(childMap, node.id, 'opening_cr')
    : Number(node.opening_cr || 0);
  const pDr = node.isParent
    ? Number(node.period_dr || 0) + sumDescendants(childMap, node.id, 'period_dr')
    : Number(node.period_dr || 0);
  const pCr = node.isParent
    ? Number(node.period_cr || 0) + sumDescendants(childMap, node.id, 'period_cr')
    : Number(node.period_cr || 0);
  const cDr = node.isParent
    ? Number(node.closing_dr || 0) + sumDescendants(childMap, node.id, 'closing_dr')
    : Number(node.closing_dr || 0);
  const cCr = node.isParent
    ? Number(node.closing_cr || 0) + sumDescendants(childMap, node.id, 'closing_cr')
    : Number(node.closing_cr || 0);

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          bgcolor: node.isParent ? 'rgba(76, 175, 80, 0.04)' : 'transparent',
        }}
        onClick={() => {
          // Collect all descendant codes (including self) for parent accounts
          const codes = [node.code];
          function collectChildren(parentId) {
            const kids = childMap[parentId] || [];
            kids.forEach((child) => {
              codes.push(child.code);
              collectChildren(child.id);
            });
          }
          collectChildren(node.id);
          const param = codes.length > 1 ? codes.join(',') : node.code;
          window.location.href = `/dashboard/accounting-finance/transactions/general-ledger-posting?accounts=${param}`;
        }}
      >
        <TableCell>
          <Typography variant="body2" fontWeight={node.isParent ? 700 : 400} sx={{ fontSize: 13, pl: depth * 3 }}>
            {node.code}
          </Typography>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: depth * 3 }}>
            {hasChildren ? (
              <Box
                component="span"
                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                sx={{
                  mr: 1,
                  cursor: 'pointer',
                  color: 'text.secondary',
                  fontSize: 11,
                  userSelect: 'none',
                  width: 16,
                  display: 'inline-flex',
                  justifyContent: 'center',
                }}
              >
                {isExpanded ? '▼' : '▶'}
              </Box>
            ) : (
              <Box sx={{ width: 28 }} />
            )}
            <Typography variant="body2" fontWeight={node.isParent ? 700 : 400}>
              {node.name}
            </Typography>
          </Box>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {TYPE_LABELS[node.classification] || node.account_type_name || '-'}
          </Typography>
        </TableCell>

        <TableCell align="right" sx={{ fontSize: 13 }}>{fmt(dr)}</TableCell>
        <TableCell align="right" sx={{ fontSize: 13 }}>{fmt(cr)}</TableCell>
        <TableCell align="right" sx={{ fontSize: 13 }}>{fmt(pDr)}</TableCell>
        <TableCell align="right" sx={{ fontSize: 13 }}>{fmt(pCr)}</TableCell>
        <TableCell align="right" sx={{ fontSize: 13 }}>{fmt(cDr)}</TableCell>
        <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600 }}>{fmt(cCr)}</TableCell>
      </TableRow>

      {hasChildren &&
        isExpanded &&
        children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            childMap={childMap}
            depth={depth + 1}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export default function CoaHierarchicalList() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const didInitExpand = useRef(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Default date range: current month
  const today = new Date();
  const firstDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const lastDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
  const [dateFrom, setDateFrom] = useState(firstDay);
  const [dateTo, setDateTo] = useState(lastDay);

  const trialBalanceUrl = useMemo(() => {
    const base = endpoints.accounting.account_trial_balance;
    return `${base}?date_from=${dateFrom}&date_to=${dateTo}`;
  }, [dateFrom, dateTo]);

  const { data: rawResponse, isLoading } = useSWR(trialBalanceUrl, fetcher);

  const rawRows = useMemo(() => {
    if (!rawResponse) return [];
    // Support both old format (array) and new format ({ date_from, date_to, accounts })
    if (Array.isArray(rawResponse)) return rawResponse;
    return rawResponse.accounts || [];
  }, [rawResponse]);

  const rows = useMemo(() => {
    if (!Array.isArray(rawRows)) return [];
    let list = rawRows;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          String(r.code).toLowerCase().includes(q) ||
          String(r.name).toLowerCase().includes(q) ||
          String(r.account_type_name).toLowerCase().includes(q)
      );
    }
    if (typeFilter !== 'all') {
      list = list.filter((r) => r.classification === typeFilter);
    }
    return list;
  }, [rawRows, search, typeFilter]);

  const { roots, childMap } = useMemo(() => {
    const parentIds = new Set();
    rows.forEach((r) => {
      if (r.parent && rows.some((p) => p.id === r.parent)) parentIds.add(r.parent);
    });
    const marked = rows.map((r) => ({ ...r, isParent: parentIds.has(r.id) }));
    return buildTree(marked);
  }, [rows]);

  useEffect(() => {
    if (!didInitExpand.current && rows.length > 0) {
      const next = {};
      rows.forEach((r) => {
        if (childMap[r.id] && childMap[r.id].length) next[r.id] = true;
      });
      setExpanded(next);
      didInitExpand.current = true;
    }
  }, [rows, childMap]);

  const handleToggle = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = useCallback(() => {
    const next = {};
    rows.forEach((r) => {
      if (childMap[r.id] && childMap[r.id].length) next[r.id] = true;
    });
    setExpanded(next);
  }, [rows, childMap]);

  const collapseAll = useCallback(() => setExpanded({}), []);

  const handlePdfDownload = async () => {
    if (!flatListForPdf.length) {
      toast.error('No accounts to export.');
      return;
    }
    setPdfLoading(true);
    try {
      const blob = await pdf(<CoaListPdfDocument flatRows={flatListForPdf} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `chart-of-accounts-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleExcelExport = async () => {
    if (!rows.length) {
      toast.error('No accounts to export.');
      return;
    }
    setExportingExcel(true);
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Chart of Accounts');
      sheet.columns = [
        { header: 'Code', key: 'code', width: 12 },
        { header: 'Account', key: 'name', width: 30 },
        { header: 'Type', key: 'account_type_name', width: 14 },
        { header: 'Opening Dr', key: 'opening_dr', width: 14 },
        { header: 'Opening Cr', key: 'opening_cr', width: 14 },
        { header: 'Period Dr', key: 'period_dr', width: 14 },
        { header: 'Period Cr', key: 'period_cr', width: 14 },
        { header: 'Closing Dr', key: 'closing_dr', width: 14 },
        { header: 'Closing Cr', key: 'closing_cr', width: 14 },
      ];
      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 22;
      rows.forEach((row) => {
        sheet.addRow({
          code: row.code,
          name: row.name,
          account_type_name: TYPE_LABELS[row.classification] || row.account_type_name || '',
          opening_dr: Number(row.opening_dr || 0),
          opening_cr: Number(row.opening_cr || 0),
          period_dr: Number(row.period_dr || 0),
          period_cr: Number(row.period_cr || 0),
          closing_dr: Number(row.closing_dr || 0),
          closing_cr: Number(row.closing_cr || 0),
        });
      });
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `chart-of-accounts-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export Excel.');
    } finally {
      setExportingExcel(false);
    }
  };

  const totals = useMemo(() => {
    const leaves = rows.filter((r) => !childMap[r.id] || childMap[r.id].length === 0);
    return {
      opening_dr: leaves.reduce((s, r) => s + Number(r.opening_dr || 0), 0),
      opening_cr: leaves.reduce((s, r) => s + Number(r.opening_cr || 0), 0),
      period_dr: leaves.reduce((s, r) => s + Number(r.period_dr || 0), 0),
      period_cr: leaves.reduce((s, r) => s + Number(r.period_cr || 0), 0),
      closing_dr: leaves.reduce((s, r) => s + Number(r.closing_dr || 0), 0),
      closing_cr: leaves.reduce((s, r) => s + Number(r.closing_cr || 0), 0),
    };
  }, [rows, childMap]);

  const flatListForPdf = useMemo(() => {
    const flat = [];
    function walk(nodes, depth) {
      nodes.forEach((node) => {
        flat.push({ ...node, depth });
        const children = childMap[node.id] || [];
        if (children.length) walk(children, depth + 1);
      });
    }
    walk(roots, 0);
    return flat;
  }, [roots, childMap]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Trial Balance Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Period: {dateFrom} to {dateTo} — Opening, period movement, and closing balances split into debit and credit columns.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={pdfLoading ? null : <Iconify icon="solar:file-pdf-bold" />}
            onClick={handlePdfDownload}
            disabled={pdfLoading}
          >
            {pdfLoading ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={exportingExcel ? null : <Iconify icon="solar:file-sheet-bold" />}
            onClick={handleExcelExport}
            disabled={exportingExcel}
          >
            {exportingExcel ? 'Exporting...' : 'Download Excel'}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                bgcolor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:wallet-money-bold-duotone" width={26} sx={{ color: '#3b82f6' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                {rows.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Accounts
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                bgcolor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:arrow-down-bold-duotone" width={26} sx={{ color: '#ef4444' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                {fmt(totals.closing_dr)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Debit (Closing)
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
                bgcolor: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:arrow-up-bold-duotone" width={26} sx={{ color: '#10b981' }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700} lineHeight={1.2}>
                {fmt(totals.closing_cr)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Credit (Closing)
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Date From"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="Date To"
            type="date"
            size="small"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="Search accounts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Code, name, or type"
            sx={{ minWidth: 250, maxWidth: 350 }}
            size="small"
          />
          <TextField
            select
            size="small"
            label="Account Type"
            value={typeFilter ?? 'all'}
            onChange={(event) => setTypeFilter(event.target.value ?? 'all')}
            sx={{ width: 180 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="asset">Asset</MenuItem>
            <MenuItem value="liability">Liability</MenuItem>
            <MenuItem value="equity">Equity</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="expense">Expense</MenuItem>
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" size="small" onClick={expandAll}>Expand All</Button>
          <Button variant="outlined" size="small" onClick={collapseAll}>Collapse All</Button>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table
            size="small"
            sx={{
              borderCollapse: 'collapse',
              '& .MuiTableCell-root': {
                border: '1px solid #e0e0e0 !important',
                borderColor: '#e0e0e0 !important',
                borderStyle: 'solid !important',
                py: 1.25,
                px: 1.5,
              },
              '& .MuiTableHead-root .MuiTableCell-root': {
                borderBottom: '2px solid #bdbdbd !important',
                bgcolor: '#f5f5f5',
                fontWeight: 700,
                fontSize: 13,
                border: '1px solid #bdbdbd !important',
                borderColor: '#bdbdbd !important',
                borderStyle: 'solid !important',
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 100 }}>Code</TableCell>
                <TableCell>Account</TableCell>
                <TableCell sx={{ width: 100 }}>Type</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Opening Dr</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Opening Cr</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Period Dr</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Period Cr</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Closing Dr</TableCell>
                <TableCell align="right" sx={{ width: 110 }}>Closing Cr</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {roots.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  childMap={childMap}
                  depth={0}
                  expanded={expanded}
                  onToggle={handleToggle}
                />
              ))}
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell colSpan={3}>
                  <Typography fontWeight={700}>Totals</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.opening_dr)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.opening_cr)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.period_dr)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.period_cr)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.closing_dr)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(totals.closing_cr)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}