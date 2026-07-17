'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import PdfPrintLayout from 'src/app/dashboard/(modules)/accounting-finance/_components/shared/pdf-print-layout';

import { formatCurrency } from '../utils';
import { formatAssetStatus } from '../assets/mock-data';
import { ReportExportActions } from './report-export-actions';
import { useAssetsWorkspace } from '../assets/use-assets-workspace';
import {
  exportAssetCsv,
  exportAssetJson,
  exportAssetExcel,
  buildAssetExportConfig,
} from '../assets/assets-export';

function MetricCard({ label, value, helper }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function AssetReport() {
  const workspace = useAssetsWorkspace();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingAction, setPendingAction] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);

  const assets = useMemo(
    () =>
      workspace.assets.filter((asset) => {
        if (categoryFilter !== 'all' && String(asset.categoryId) !== String(categoryFilter))
          return false;
        if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
        return true;
      }),
    [categoryFilter, statusFilter, workspace.assets]
  );

  const categoryRows = useMemo(
    () =>
      workspace.reporting.categoryPerformance.filter((row) => {
        if (categoryFilter === 'all') return true;
        return String(row.id) === String(categoryFilter);
      }),
    [categoryFilter, workspace.reporting.categoryPerformance]
  );

  const exportConfig = useMemo(() => buildAssetExportConfig(workspace), [workspace]);

  const printContent = (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>
        Asset Movement Summary
      </div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: '20px' }}
      >
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Asset
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Category
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Cost
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Book value
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Depreciation
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                {asset.code} • {asset.name}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.categoryName}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(asset.purchaseCost)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(asset.currentValue)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(asset.accumulatedDepreciation)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                {formatAssetStatus(asset.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>
        Depreciation Movement
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Period
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Posted
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Pending
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Assets
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {workspace.reporting.depreciationMovement.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.period}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(row.postedAmount)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(row.pendingAmount)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {row.assetCount}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                {formatAssetStatus(row.status)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>
        Category Performance
      </div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: '20px' }}
      >
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Category
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Assets
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Cost
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Book value
            </th>
          </tr>
        </thead>
        <tbody>
          {categoryRows.map((row) => (
            <tr key={row.id}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.category}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {row.count}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(row.cost)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(row.bookValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>
        Top Book Value Assets
      </div>
      <table
        style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: '20px' }}
      >
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Asset
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Code
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Category
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Book value
            </th>
          </tr>
        </thead>
        <tbody>
          {workspace.reporting.topBookValueAssets.map((asset) => (
            <tr key={asset.id}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.name}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.code}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.categoryName}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(asset.currentValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ fontWeight: 700, fontSize: 14, margin: '16px 0 8px' }}>Disposal Analysis</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Asset
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Method
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Disposal Date
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              Gain / Loss
            </th>
            <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
              Proceeds Handling
            </th>
          </tr>
        </thead>
        <tbody>
          {workspace.reporting.disposalAnalysis.map((item) => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                {item.assetCode} • {item.assetName}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.methodLabel}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.disposalDate}</td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                {formatCurrency(item.gainOrLoss)}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
                {item.proceedsHandling}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const runAction = async (label, action, successMessage) => {
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

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Asset Report
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Asset movement, depreciation, disposal, and portfolio health reporting backed by the
            shared fixed-asset workspace.
          </Typography>
        </Box>
        <ReportExportActions
          actions={[
            {
              key: 'csv',
              onClick: () =>
                runAction(
                  'Export Asset Report CSV',
                  () => exportAssetCsv('asset-report', exportConfig),
                  'Asset report CSV exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'excel',
              onClick: () =>
                runAction(
                  'Export Asset Report Excel',
                  () => exportAssetExcel('asset-report', exportConfig),
                  'Asset report workbook exported'
                ),
              disabled: pendingAction !== null,
            },
            {
              key: 'json',
              onClick: () =>
                runAction(
                  'Export Asset Report JSON',
                  () => exportAssetJson('asset-report', exportConfig),
                  'Asset report JSON exported'
                ),
              disabled: pendingAction !== null,
            },
            { key: 'print', onClick: () => setPrintOpen(true), disabled: pendingAction !== null },
          ]}
        />
      </Stack>

      <Stack spacing={1.25} sx={{ mb: 3 }}>
        {workspace.alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <MenuItem value="all">All categories</MenuItem>
                {workspace.categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <MenuItem value="all">All status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="fully_depreciated">Fully depreciated</MenuItem>
                <MenuItem value="disposed">Disposed</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Portfolio cost"
            value={formatCurrency(workspace.overview.totalCost)}
            helper="Gross historical acquisition cost"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Book value"
            value={formatCurrency(workspace.overview.bookValue)}
            helper="Net carrying value after depreciation"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Accumulated depreciation"
            value={formatCurrency(workspace.overview.accumulatedDepreciation)}
            helper="Posted depreciation across the register"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Assets in scope"
            value={assets.length}
            helper="Assets matching the current report filters"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Asset Movement Summary
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Asset</th>
                      <th align="left">Category</th>
                      <th align="right">Cost</th>
                      <th align="right">Book value</th>
                      <th align="right">Depreciation</th>
                      <th align="left">Status</th>
                      <th align="right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => (
                      <tr key={asset.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={700}>
                              {asset.code} • {asset.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {asset.purchaseDate} • {asset.vendorName}
                            </Typography>
                          </Stack>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{asset.categoryName}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(asset.purchaseCost)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(asset.currentValue)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(asset.accumulatedDepreciation)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={formatAssetStatus(asset.status)}
                            size="small"
                            color={
                              asset.status === 'disposed'
                                ? 'error'
                                : asset.status === 'active'
                                  ? 'success'
                                  : 'warning'
                            }
                          />
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          <Button
                            component={RouterLink}
                            href={paths.dashboard.accountingFinance.assets.register}
                            size="small"
                            variant="outlined"
                            color="inherit"
                          >
                            View Asset
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Depreciation Movement
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Period</th>
                      <th align="right">Posted</th>
                      <th align="right">Pending</th>
                      <th align="right">Assets</th>
                      <th align="left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.reporting.depreciationMovement.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>{row.period}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.postedAmount)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.pendingAmount)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.assetCount}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={formatAssetStatus(row.status)}
                            size="small"
                            variant="outlined"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Category Performance
                </Typography>
                <Stack spacing={1.25}>
                  {categoryRows.map((row) => (
                    <Stack
                      key={row.id}
                      direction="row"
                      justifyContent="space-between"
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {row.category}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.count} assets • {formatCurrency(row.cost)} cost
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(row.bookValue)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Top Book Value Assets
                </Typography>
                <Stack spacing={1.25}>
                  {workspace.reporting.topBookValueAssets.map((asset) => (
                    <Stack
                      key={asset.id}
                      direction="row"
                      justifyContent="space-between"
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {asset.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {asset.code} • {asset.categoryName}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(asset.currentValue)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Disposal Analysis
                </Typography>
                <Stack spacing={1.25}>
                  {workspace.reporting.disposalAnalysis.map((item) => (
                    <Box
                      key={item.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.assetCode} • {item.methodLabel}
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                          color={item.gainOrLoss >= 0 ? '#15803d' : '#b91c1c'}
                        >
                          {formatCurrency(item.gainOrLoss)}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {item.disposalDate} • {item.proceedsHandling}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {printOpen && (
        <PdfPrintLayout title="Asset Report" onClose={() => setPrintOpen(false)}>
          {printContent}
        </PdfPrintLayout>
      )}
    </Box>
  );
}
