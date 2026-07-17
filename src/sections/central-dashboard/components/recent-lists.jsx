'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import { SectionCard, EmptyState, StatusChip } from './common';

function CompactTable({ title, columns, rows, viewAllHref, emptyMessage }) {
  const action = viewAllHref && (
    <Typography
      component={Link}
      href={viewAllHref}
      variant="caption"
      sx={{
        color: 'primary.main',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      View All <ArrowRight size={12} />
    </Typography>
  );

  if (!rows || !rows.length) {
    return (
      <SectionCard title={title} action={action}>
        <EmptyState
          icon={ArrowRight}
          title={`No ${title}`}
          description={emptyMessage || `No recent ${title.toLowerCase()} found`}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard title={title} action={action} contentSx={{ mx: -1 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.key} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12 }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.id || index} hover>
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ maxWidth: 200 }}>
                    {col.render ? (
                      col.render(row[col.key], row)
                    ) : (
                      <Typography variant="body2" noWrap>
                        {row[col.key] || '—'}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionCard>
  );
}

function TableSkeleton({ rows = 5, columns = 3 }) {
  return (
    <Card variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Skeleton width={140} height={22} sx={{ mb: 2 }} />
      <Stack spacing={1.5}>
        {Array.from({ length: rows }).map((_, i) => (
          <Stack key={i} direction="row" spacing={2}>
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} sx={{ flex: 1 }} height={18} />
            ))}
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}

export default function RecentLists({ recent = {}, isLoading }) {
  const tableConfigs = [
    {
      title: 'Recent Projects',
      href: '/dashboard/project-managements/',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
      ],
      rows: (recent.projects || []).slice(0, 5),
      empty: 'No recent projects',
    },
    {
      title: 'Recent Meetings',
      href: '/dashboard/meeting-management/list/',
      columns: [
        { key: 'title', label: 'Title' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
      ],
      rows: (recent.meetings || []).slice(0, 5),
      empty: 'No recent meetings',
    },
    {
      title: 'Recent Procurement',
      href: '/dashboard/procurement/requisitions',
      columns: [
        { key: 'reference', label: 'ID' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
      ],
      rows: (recent.procurement || []).slice(0, 5),
      empty: 'No recent procurement',
    },
    {
      title: 'Recent Tasks',
      href: '/dashboard/todo/list/',
      columns: [
        { key: 'title', label: 'Title' },
        { key: 'due_date', label: 'Due' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
      ],
      rows: (recent.tasks || []).slice(0, 5),
      empty: 'No recent tasks',
    },
    {
      title: 'Recent Leads',
      href: '/dashboard/crm/leads/',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'source', label: 'Source' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
      ],
      rows: (recent.leads || []).slice(0, 5),
      empty: 'No recent leads',
    },
    {
      title: 'Recent Beneficiaries',
      href: '/dashboard/beneficiaries/database/',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
        { key: 'date', label: 'Date' },
      ],
      rows: (recent.beneficiaries || []).slice(0, 5),
      empty: 'No recent beneficiaries',
    },
    {
      title: 'Recent Stock Moves',
      href: '/dashboard/store&inventory/inventory-log/history/',
      columns: [
        { key: 'product', label: 'Product' },
        { key: 'move_type', label: 'Type' },
        { key: 'quantity', label: 'Qty' },
      ],
      rows: (recent.stock_moves || []).slice(0, 5),
      empty: 'No recent stock moves',
    },
    {
      title: 'Recent Movements',
      href: '/dashboard/movement-management/',
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'project', label: 'Project' },
        { key: 'status', label: 'Status', render: (v) => <StatusChip status={v} /> },
      ],
      rows: (recent.movements || []).slice(0, 5),
      empty: 'No recent movements',
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        Recent Records
      </Typography>
      <Grid container spacing={3}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, lg: 6 }}>
                <TableSkeleton />
              </Grid>
            ))
          : tableConfigs.map((config) => (
              <Grid key={config.title} size={{ xs: 12, lg: 6 }}>
                <CompactTable
                  title={config.title}
                  columns={config.columns}
                  rows={config.rows}
                  viewAllHref={config.href}
                  emptyMessage={config.empty}
                />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
