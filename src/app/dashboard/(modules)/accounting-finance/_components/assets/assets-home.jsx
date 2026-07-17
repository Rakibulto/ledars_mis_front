'use client';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { useAssetsWorkspace } from './use-assets-workspace';
import { AssetsWorkspaceToolbar } from './assets-workspace-toolbar';

const NAV_ITEMS = [
  {
    title: 'Asset Register',
    description: 'Full register with valuation, depreciation progress, and lifecycle status.',
    href: paths.dashboard.accountingFinance.assets.register,
    icon: 'solar:document-text-bold-duotone',
  },
  {
    title: 'Asset Acquisition',
    description:
      'Register new fixed assets with category, vendor, cost center, and financial setup.',
    href: paths.dashboard.accountingFinance.assets.acquisition,
    icon: 'solar:add-circle-bold-duotone',
  },
  {
    title: 'Depreciation',
    description: 'Review depreciation schedules, progress, and run depreciation cycles.',
    href: paths.dashboard.accountingFinance.assets.depreciation,
    icon: 'solar:graph-down-bold-duotone',
  },
  {
    title: 'Disposal',
    description: 'Manage sale, scrap, donation, and loss events with disposal history.',
    href: paths.dashboard.accountingFinance.assets.disposal,
    icon: 'solar:trash-bin-trash-bold-duotone',
  },
  {
    title: 'Asset Reports',
    description: 'Open reporting for asset portfolio, category mix, and lifecycle controls.',
    href: paths.dashboard.accountingFinance.assets.reports,
    icon: 'solar:chart-square-bold-duotone',
  },
];

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            <Iconify icon={icon} width={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function AssetsHome() {
  useCurrency();
  const workspace = useAssetsWorkspace();
  const { assets } = workspace;
  const { categories } = workspace;

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Category
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Purchase Date
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Purchase Cost
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Book Value
          </th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => (
          <tr key={asset.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {(categories.find((c) => String(c.id) === String(asset.category)) || {}).name}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.status}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {new Date(asset.purchase_date).toLocaleDateString()}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.purchase_cost}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{asset.current_value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const activeAssets = assets.filter(
    (asset) => asset.status === 'active' || asset.status === 'running'
  );
  const disposedAssets = assets.filter((asset) => asset.status === 'disposed');
  const fullyDepreciatedAssets = assets.filter((asset) =>
    String(asset.status || '').includes('depreci')
  );

  const totalCost = assets.reduce((sum, asset) => sum + Number(asset.purchase_cost || 0), 0);
  const totalBookValue = assets.reduce((sum, asset) => sum + Number(asset.current_value || 0), 0);
  const accumulatedDepreciation = totalCost - totalBookValue;

  const topAssets = useMemo(
    () =>
      [...assets]
        .sort((left, right) => Number(right.current_value || 0) - Number(left.current_value || 0))
        .slice(0, 5),
    [assets]
  );
  const categoryMix = useMemo(
    () =>
      categories
        .map((category) => ({
          id: category.id,
          name: category.name,
          count: assets.filter((asset) => asset.category === category.id).length,
        }))
        .filter((item) => item.count > 0)
        .sort((left, right) => right.count - left.count)
        .slice(0, 5),
    [assets, categories]
  );

  const [expandedAssetId, setExpandedAssetId] = useState(null);

  const alerts = [];
  if (disposedAssets.length > 0) {
    alerts.push({
      id: 'disposed-assets',
      severity: 'info',
      title: `${disposedAssets.length} disposed assets in portfolio history`,
      description:
        'Review disposal history to confirm gains, losses, and write-off documentation remain current.',
    });
  }
  if (fullyDepreciatedAssets.length > 0) {
    alerts.push({
      id: 'fully-depreciated',
      severity: 'warning',
      title: `${fullyDepreciatedAssets.length} assets fully depreciated`,
      description:
        'Consider refresh, impairment review, or disposal planning for fully depreciated items still in service.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'asset-steady',
      severity: 'success',
      title: 'Asset portfolio controls look stable',
      description:
        'No immediate disposal or depreciation exception was detected in the current mock workspace.',
    });
  }

  return (
    <Box>
      <AssetsWorkspaceToolbar printTitle="Assets Workspace" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Assets Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fixed asset command center for register control, acquisition intake, depreciation
            review, disposal workflow, and portfolio reporting.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.assets.acquisition}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            New Asset
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.assets.depreciation}
            variant="contained"
            startIcon={<Iconify icon="solar:play-circle-bold" />}
          >
            Review Depreciation
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Portfolio cost"
            value={formatCurrency(totalCost)}
            helper="Original fixed asset investment captured in the register"
            icon="solar:wallet-money-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Book value"
            value={formatCurrency(totalBookValue)}
            helper="Remaining carrying value after depreciation"
            icon="solar:chart-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Accumulated depreciation"
            value={formatCurrency(accumulatedDepreciation)}
            helper="Depreciation already recognized across the portfolio"
            icon="solar:graph-down-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Active assets"
            value={activeAssets.length}
            helper={`${disposedAssets.length} disposed • ${fullyDepreciatedAssets.length} fully depreciated`}
            icon="solar:buildings-2-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {NAV_ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200' }}>
                    <Iconify icon={item.icon} width={24} />
                  </Box>
                </Stack>
                <Typography variant="h6" fontWeight={700}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {item.description}
                </Typography>
                <Button component={RouterLink} href={item.href} variant="contained" fullWidth>
                  Open Page
                </Button>
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
                Top Book Value Assets
              </Typography>
              <Stack spacing={0}>
                {topAssets.map((asset, index) => {
                  const category = categories.find((c) => String(c.id) === String(asset.category));
                  const purchaseCost = Number(asset.purchase_cost || 0);
                  const bookValue = Number(asset.current_value || 0);
                  const accumDepr = purchaseCost - bookValue;
                  const isExpanded = String(expandedAssetId) === String(asset.id);
                  return (
                    <Box key={asset.id}>
                      {index > 0 && <Divider />}
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ py: 1.25 }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {asset.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {asset.code} • Purchased{' '}
                            {new Date(asset.purchase_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={asset.status}
                            size="small"
                            color={asset.status === 'disposed' ? 'error' : 'success'}
                            sx={{ textTransform: 'capitalize' }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ minWidth: 80, textAlign: 'right' }}
                          >
                            {formatCurrency(bookValue)}
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
                        <Box sx={{ pb: 2 }}>
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" color="text.secondary">
                                Purchase Cost
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(purchaseCost)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" color="text.secondary">
                                Book Value
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(bookValue)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" color="text.secondary">
                                Accum. Depreciation
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {formatCurrency(accumDepr)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                              <Typography variant="caption" color="text.secondary">
                                Category
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {category?.name || '—'}
                              </Typography>
                            </Grid>
                            {asset.depreciation_method && (
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Depr. Method
                                </Typography>
                                <Typography
                                  variant="body2"
                                  fontWeight={700}
                                  sx={{ textTransform: 'capitalize' }}
                                >
                                  {String(asset.depreciation_method).replace(/_/g, ' ')}
                                </Typography>
                              </Grid>
                            )}
                            {asset.useful_life_months && (
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Useful Life
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {asset.useful_life_months} months
                                </Typography>
                              </Grid>
                            )}
                            {asset.custodian && (
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Custodian
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {asset.custodian}
                                </Typography>
                              </Grid>
                            )}
                            {asset.location && (
                              <Grid size={{ xs: 6, sm: 3 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Location
                                </Typography>
                                <Typography variant="body2" fontWeight={700}>
                                  {asset.location}
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
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Category Mix
              </Typography>
              <Stack spacing={1.25}>
                {categoryMix.map((category) => (
                  <Stack
                    key={category.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2">{category.name}</Typography>
                    <Chip label={`${category.count} assets`} size="small" variant="outlined" />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Lifecycle Snapshot
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Active / running</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {activeAssets.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Disposed</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {disposedAssets.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Fully depreciated</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {fullyDepreciatedAssets.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Tracked categories</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {categoryMix.length}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
