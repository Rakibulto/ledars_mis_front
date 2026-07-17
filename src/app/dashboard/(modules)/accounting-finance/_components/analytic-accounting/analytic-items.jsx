'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { formatCurrency } from '../utils';
import { useAnalyticWorkspace } from './use-analytic-workspace';
import { AnalyticWorkspaceToolbar } from './analytic-workspace-toolbar';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AnalyticItems() {
  const workspace = useAnalyticWorkspace();
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(workspace.items[0]?.id || '');

  const filteredItems = useMemo(
    () =>
      workspace.items.filter((item) => {
        if (planFilter !== 'all' && String(item.planId) !== String(planFilter)) return false;
        if (accountFilter !== 'all' && String(item.analytic_account_id) !== String(accountFilter))
          return false;
        if (statusFilter !== 'all' && item.distributionStatus !== statusFilter) return false;
        if (sourceFilter !== 'all' && item.sourceType !== sourceFilter) return false;
        if (dateFrom && item.date < dateFrom) return false;
        if (dateTo && item.date > dateTo) return false;
        if (!search) return true;

        return [
          item.reference,
          item.accountName,
          item.description,
          item.journalNumber,
          item.partnerName,
          item.projectName,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [
      accountFilter,
      dateFrom,
      dateTo,
      planFilter,
      search,
      sourceFilter,
      statusFilter,
      workspace.items,
    ]
  );

  const selectedItem = useMemo(
    () =>
      workspace.items.find((item) => String(item.id) === String(selectedItemId)) ||
      filteredItems[0] ||
      workspace.items[0] ||
      null,
    [filteredItems, selectedItemId, workspace.items]
  );

  const totalAmount = filteredItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Reference
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Date</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Amount
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredItems.map((item) => (
          <tr key={item.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.reference}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.accountName}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.date}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {formatCurrency(item.amount)}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {item.distributionStatus}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box>
      <AnalyticWorkspaceToolbar printTitle="Analytic Items" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Analytic Items
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analytic move lines with journal linkage, distribution validation, and drill-down for
            partner, project, and cost-center slices.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Filtered items"
            value={filteredItems.length}
            helper="Analytic move lines matching the current rule filters"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Net amount"
            value={formatCurrency(totalAmount)}
            helper="Signed amount across the visible analytic move set"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Exceptions"
            value={filteredItems.filter((item) => item.distributionStatus !== 'validated').length}
            helper="Lines still waiting for validated distribution logic"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Journal-linked"
            value={filteredItems.filter((item) => item.journalNumber).length}
            helper="Lines carrying traceable journal references for audit drill-down"
          />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Search lines"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Reference, journal, partner, project"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                select
                fullWidth
                label="Plan"
                value={planFilter}
                onChange={(event) => setPlanFilter(event.target.value)}
              >
                <MenuItem value="all">All plans</MenuItem>
                {workspace.plans.map((plan) => (
                  <MenuItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2.5 }}>
              <TextField
                select
                fullWidth
                label="Account"
                value={accountFilter}
                onChange={(event) => setAccountFilter(event.target.value)}
              >
                <MenuItem value="all">All accounts</MenuItem>
                {workspace.accounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.code} • {account.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Distribution status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="validated">Validated</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                label="Source type"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                <MenuItem value="all">All sources</MenuItem>
                <MenuItem value="journal">Journal</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="bill">Bill</MenuItem>
                <MenuItem value="budget">Budget</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="From"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                type="date"
                label="To"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th align="left">Date</th>
                  <th align="left">Reference</th>
                  <th align="left">Analytic account</th>
                  <th align="left">Journal link</th>
                  <th align="left">Dimensions</th>
                  <th align="right">Amount</th>
                  <th align="left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    style={{
                      cursor: 'pointer',
                      background:
                        String(selectedItem?.id) === String(item.id)
                          ? 'rgba(37,99,235,0.06)'
                          : 'transparent',
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>{item.date}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.reference}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.sourceType} • {item.journalLineCode}
                        </Typography>
                      </Stack>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.accountCode} • {item.accountName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.planName}
                        </Typography>
                      </Stack>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{item.journalNumber}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.journalName}
                        </Typography>
                      </Stack>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{item.partnerName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.projectName} • {item.costCenterName}
                        </Typography>
                      </Stack>
                    </td>
                    <td
                      align="right"
                      style={{
                        padding: '12px 8px',
                        fontWeight: 700,
                        color: item.amount >= 0 ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {formatCurrency(item.amount)}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Chip
                        label={workspace.formatAnalyticStatus(item.distributionStatus)}
                        size="small"
                        color={
                          item.distributionStatus === 'validated'
                            ? 'success'
                            : item.distributionStatus === 'warning'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>

      {selectedItem && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, xl: 5 }}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Line Drill-Down
                  </Typography>
                  <Stack spacing={1.2}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Reference</Typography>
                      <Typography fontWeight={700}>{selectedItem.reference}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Journal</Typography>
                      <Typography fontWeight={700}>{selectedItem.journalNumber}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Journal line</Typography>
                      <Typography fontWeight={700}>{selectedItem.journalLineCode}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">General account</Typography>
                      <Typography fontWeight={700}>{selectedItem.general_account}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography color="text.secondary">Posted by</Typography>
                      <Typography fontWeight={700}>{selectedItem.postedBy}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Distribution Review
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Status: {workspace.formatAnalyticStatus(selectedItem.distributionStatus)}
                    </Typography>
                    <Typography variant="body2">Plan: {selectedItem.planName}</Typography>
                    <Typography variant="body2">
                      Audit tags: {selectedItem.tags.join(', ')}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, xl: 7 }}>
            <Stack spacing={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Allocation Context
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Partner
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedItem.partnerName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Project
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedItem.projectName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="caption" color="text.secondary">
                        Cost center
                      </Typography>
                      <Typography variant="body2" fontWeight={700}>
                        {selectedItem.costCenterName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {selectedItem.description}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {selectedItem.tags.map((tag) => (
                          <Chip
                            key={`${selectedItem.id}-${tag}`}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Source Mix
                  </Typography>
                  <Stack spacing={1}>
                    {['journal', 'invoice', 'bill', 'budget'].map((source) => (
                      <Stack key={source} direction="row" justifyContent="space-between">
                        <Typography color="text.secondary">
                          {workspace.formatAnalyticStatus(source)}
                        </Typography>
                        <Typography fontWeight={700}>
                          {filteredItems.filter((item) => item.sourceType === source).length}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
