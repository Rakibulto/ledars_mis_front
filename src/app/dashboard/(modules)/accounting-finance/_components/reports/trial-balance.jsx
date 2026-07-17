'use client';

import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';
import Collapse from '@mui/material/Collapse';

import useSWR from 'swr';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';

const TYPE_COLORS = {
  asset: 'success',
  liability: 'info',
  equity: 'secondary',
  income: 'warning',
  expense: 'error',
};

// ── Build hierarchy and compute parent aggregates ─────────────
function buildHierarchicalRows(rows) {
  const childMap = {};
  const roots = [];
  const rowMap = {};

  rows.forEach((r) => {
    rowMap[r.id] = { ...r, children: [], isParent: false };
  });

  rows.forEach((r) => {
    if (r.parent && rowMap[r.parent]) {
      rowMap[r.parent].children.push(rowMap[r.id]);
      rowMap[r.parent].isParent = true;
    } else {
      roots.push(rowMap[r.id]);
    }
  });

  // Sort children by code
  Object.values(rowMap).forEach((node) => {
    node.children.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
  });

  roots.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));

  return { roots, rowMap };
}

function sumChildren(children, key) {
  return children.reduce((s, c) => s + (c[key] || 0), 0);
}

function formatDecimals(value) {
  return Number(value || 0).toFixed(2);
}

// ── Recursive row component ──────────────────────────────────
function HierarchicalRow({ node, depth, expanded, onToggle }) {
  const hasChildren = node.children && node.children.length > 0;

  // Compute parent row values as sum of children
  const displayRow = node.isParent
    ? {
        ...node,
        opening_dr: sumChildren(node.children, 'opening_dr'),
        opening_cr: sumChildren(node.children, 'opening_cr'),
        period_dr: sumChildren(node.children, 'period_dr'),
        period_cr: sumChildren(node.children, 'period_cr'),
        closing_dr: sumChildren(node.children, 'closing_dr'),
        closing_cr: sumChildren(node.children, 'closing_cr'),
      }
    : node;

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: depth * 3 }}>
            {hasChildren ? (
              <IconButton size="small" onClick={() => onToggle(node.id)} sx={{ mr: 0.5 }}>
                {expanded[node.id] ? (
                  <Typography variant="body2">▼</Typography>
                ) : (
                  <Typography variant="body2">▶</Typography>
                )}
              </IconButton>
            ) : (
              <Box sx={{ width: 32 }} />
            )}
            <Typography variant="body2" fontWeight={node.isParent ? 700 : 500}>
              {node.code}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ pl: depth * 3 }}>
            <Typography variant="body2" fontWeight={node.isParent ? 700 : 500}>
              {node.name}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Chip
            label={node.account_type_name || '-'}
            size="small"
            variant="outlined"
            color={TYPE_COLORS[node.classification] || 'default'}
          />
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatDecimals(displayRow.opening_dr)}
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatDecimals(displayRow.opening_cr)}
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatDecimals(displayRow.period_dr)}
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: 13 }}>
          {formatDecimals(displayRow.period_cr)}
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
          {formatDecimals(displayRow.closing_dr)}
        </TableCell>
        <TableCell align="right" sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
          {formatDecimals(displayRow.closing_cr)}
        </TableCell>
      </TableRow>
      {hasChildren &&
        node.children.map((child) => (
          <Collapse key={child.id} in={!!expanded[node.id]} timeout="auto" unmountOnExit={false}>
            <HierarchicalRow
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          </Collapse>
        ))}
    </>
  );
}

// ── Main component ───────────────────────────────────────────
export default function TrialBalance() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const { data: rawRows, isLoading } = useSWR(
    `${endpoints.accounting.account_trial_balance}?as_of_date=${asOfDate}`,
    fetcher
  );

  const rows = useMemo(() => {
    if (!Array.isArray(rawRows)) return [];
    let filtered = rawRows;
    if (search) {
      const q = search.toLowerCase();
      filtered = rawRows.filter(
        (r) =>
          String(r.code).toLowerCase().includes(q) ||
          String(r.name).toLowerCase().includes(q) ||
          String(r.account_type_name).toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [rawRows, search]);

  const { roots, rowMap } = useMemo(() => buildHierarchicalRows(rows), [rows]);

  const handleToggle = useCallback((id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const expandAll = useCallback(() => {
    const next = {};
    Object.values(rowMap).forEach((node) => {
      if (node.isParent) next[node.id] = true;
    });
    setExpanded(next);
  }, [rowMap]);

  const collapseAll = useCallback(() => setExpanded({ }), []);

  // Compute totals from leaf nodes only (not parents, to avoid double-counting)
  const totals = useMemo(() => {
    const leaves = rows.filter((r) => !r.parent || !rowMap[r.parent]);
    return {
      opening_dr: leaves.reduce((s, r) => s + r.opening_dr, 0),
      opening_cr: leaves.reduce((s, r) => s + r.opening_cr, 0),
      period_dr: leaves.reduce((s, r) => s + r.period_dr, 0),
      period_cr: leaves.reduce((s, r) => s + r.period_cr, 0),
      closing_dr: leaves.reduce((s, r) => s + r.closing_dr, 0),
      closing_cr: leaves.reduce((s, r) => s + r.closing_cr, 0),
    };
  }, [rows, rowMap]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Trial Balance Register
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Opening, period movement, and closing balances are split into debit and credit columns.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outlined" size="small" onClick={collapseAll}>
            Collapse All
          </Button>
        </Stack>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            fullWidth
            type="date"
            label="As of Date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: 250 }}
          />
          <TextField
            fullWidth
            label="Search account"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Code, name, or type"
            sx={{ maxWidth: 300 }}
          />
        </CardContent>
      </Card>

      {/* Table */}
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
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Opening Dr</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Opening Cr</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Period Dr</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Period Cr</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Closing Dr</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Closing Cr</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && roots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {roots.map((node) => (
                <HierarchicalRow
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={handleToggle}
                />
              ))}
              {/* Totals row */}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={3}>
                  <Typography fontWeight={700}>Totals</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatDecimals(totals.opening_dr)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatDecimals(totals.opening_cr)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatDecimals(totals.period_dr)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatDecimals(totals.period_cr)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatDecimals(totals.closing_dr)}
                </TableCell>
                <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {formatDecimals(totals.closing_cr)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
