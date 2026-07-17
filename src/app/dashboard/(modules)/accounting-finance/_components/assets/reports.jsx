'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { formatCurrency } from '../utils';
import { formatAssetStatus } from './mock-data';
import { useAssetsWorkspace } from './use-assets-workspace';
import { AssetsWorkspaceToolbar } from './assets-workspace-toolbar';

function ReportCard({ label, value, helper }) {
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

export default function AssetReports() {
  const workspace = useAssetsWorkspace();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedAssetId, setExpandedAssetId] = useState(null);

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Category
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Assets Count
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Cost</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Book Value
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Depreciation Ratio
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.reporting.categoryPerformance.map((row) => (
          <tr key={row.id || row.category}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.category}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.count}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.cost}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.bookValue}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.depreciation}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const categoryRows = useMemo(
    () =>
      workspace.reporting.categoryPerformance.filter((row) => {
        if (categoryFilter === 'all') return true;
        return String(row.id) === String(categoryFilter);
      }),
    [categoryFilter, workspace.reporting.categoryPerformance]
  );

  return (
    <Box>
      <AssetsWorkspaceToolbar printTitle="Asset Reports" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Asset Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Portfolio analytics with category mix, disposal posture, and book-value health designed
            around the fixed asset workspace.
          </Typography>
        </Box>
        <TextField
          select
          label="Category filter"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">All categories</MenuItem>
          {workspace.categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ReportCard
            label="Capitalized assets"
            value={workspace.assets.length}
            helper="All assets currently tracked in the register"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ReportCard
            label="Portfolio cost"
            value={formatCurrency(workspace.overview.totalCost)}
            helper="Gross historical acquisition cost"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ReportCard
            label="Book value"
            value={formatCurrency(workspace.overview.bookValue)}
            helper="Net carrying amount after depreciation"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <ReportCard
            label="Disposal recovery"
            value={formatCurrency(
              workspace.disposals.reduce((sum, item) => sum + item.saleAmount, 0)
            )}
            helper="Cash recovered from disposed assets"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Category Summary
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Category</th>
                      <th align="right">Assets</th>
                      <th align="right">Cost</th>
                      <th align="right">Book value</th>
                      <th align="right">Depreciation ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: '12px 8px' }}>{row.category}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.count}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.cost)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.bookValue)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {row.cost ? `${Math.round((row.depreciation / row.cost) * 100)}%` : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mt: 3 }}>
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
                  Top Book Value Assets
                </Typography>
                <Stack spacing={1.25}>
                  {workspace.reporting.topBookValueAssets.map((asset) => {
                    const fullAsset = workspace.assets.find(
                      (a) => String(a.id) === String(asset.id)
                    );
                    const isExpanded = String(expandedAssetId) === String(asset.id);
                    const purchaseCost = Number(fullAsset?.purchase_cost || 0);
                    const accumDepr = purchaseCost - Number(asset.currentValue || 0);
                    return (
                      <Box
                        key={asset.id}
                        sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'background.neutral' }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ p: 1.5 }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {asset.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {asset.code} • {asset.categoryName}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700}>
                              {formatCurrency(asset.currentValue)}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              color="inherit"
                              onClick={() => setExpandedAssetId(isExpanded ? null : asset.id)}
                            >
                              {isExpanded ? 'Hide' : 'View Details'}
                            </Button>
                          </Stack>
                        </Stack>
                        <Collapse in={isExpanded}>
                          <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Purchase Cost
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {formatCurrency(purchaseCost)}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 6 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Accum. Depreciation
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {formatCurrency(accumDepr)}
                                </Typography>
                              </Grid>
                              {fullAsset?.depreciation_method && (
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Depr. Method
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    fontWeight={700}
                                    sx={{ textTransform: 'capitalize' }}
                                  >
                                    {String(fullAsset.depreciation_method).replace(/_/g, ' ')}
                                  </Typography>
                                </Grid>
                              )}
                              {fullAsset?.useful_life_months && (
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Useful Life
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>
                                    {fullAsset.useful_life_months} months
                                  </Typography>
                                </Grid>
                              )}
                              {fullAsset?.status && (
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Status
                                  </Typography>
                                  <Box sx={{ mt: 0.25 }}>
                                    <Chip
                                      label={formatAssetStatus(fullAsset.status)}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Box>
                                </Grid>
                              )}
                              {fullAsset?.location && (
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Location
                                  </Typography>
                                  <Typography variant="body2" fontWeight={700}>
                                    {fullAsset.location}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Disposal Analysis
                </Typography>
                <Stack spacing={1.5}>
                  {workspace.reporting.disposalAnalysis.map((item) => (
                    <Stack
                      key={item.id}
                      spacing={0.35}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
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
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
