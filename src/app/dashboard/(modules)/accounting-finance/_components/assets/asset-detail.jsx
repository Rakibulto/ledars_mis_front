'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useAssetsWorkspace } from './use-assets-workspace';

export default function AssetDetail({ assetId }) {
  const workspace = useAssetsWorkspace();
  const { formatAssetStatus } = workspace;

  const asset = useMemo(
    () => workspace.assets.find((a) => String(a.id) === String(assetId)) ?? null,
    [workspace.assets, assetId]
  );

  if (workspace.isLoading || (!asset && !workspace.isLoading && workspace.assets.length === 0)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!asset) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Asset not found.
        </Typography>
        <Button
          component={Link}
          href="/dashboard/accounting-finance/assets/register"
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mt: 2 }}
        >
          Back to Register
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Button
            component={Link}
            href="/dashboard/accounting-finance/assets/register"
            startIcon={<Iconify icon="solar:arrow-left-bold" />}
            variant="outlined"
            color="inherit"
            size="small"
            sx={{ mb: 1 }}
          >
            Back to Register
          </Button>
          <Typography variant="h4" fontWeight={800}>
            {asset.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {asset.code} &bull; {asset.categoryName}
          </Typography>
        </Box>
        <Chip
          label={formatAssetStatus(asset.status)}
          color={
            asset.status === 'disposed'
              ? 'error'
              : asset.status === 'fully_depreciated'
                ? 'warning'
                : 'success'
          }
          sx={{ fontSize: 14, px: 1.5, py: 2.5 }}
        />
      </Stack>

      <Grid container spacing={3}>
        {/* ── Left column — core info ─────────────────────────────────── */}
        <Grid size={{ xs: 12, xl: 4 }}>
          {/* Key financials */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Financial Summary
              </Typography>
              <Stack spacing={1.4}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Purchase cost</Typography>
                  <Typography fontWeight={700}>{formatCurrency(asset.purchaseCost)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Salvage value</Typography>
                  <Typography fontWeight={700}>{formatCurrency(asset.salvageValue)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Accumulated depreciation</Typography>
                  <Typography fontWeight={700}>
                    {formatCurrency(asset.accumulatedDepreciation)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Book value</Typography>
                  <Typography fontWeight={700} color="primary.main">
                    {formatCurrency(asset.currentValue)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Monthly depreciation</Typography>
                  <Typography fontWeight={700}>
                    {formatCurrency(asset.monthlyDepreciation)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Depreciation progress</Typography>
                  <Typography fontWeight={700}>{asset.depreciationProgress}%</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Asset details */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Asset Details
              </Typography>
              <Stack spacing={1.4}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Serial number</Typography>
                  <Typography fontWeight={600}>{asset.serialNumber || '—'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Condition</Typography>
                  <Typography fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {asset.condition}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Purchase date</Typography>
                  <Typography fontWeight={600}>{asset.purchaseDate}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Depreciation method</Typography>
                  <Typography fontWeight={600}>
                    {formatAssetStatus(asset.depreciationMethod)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Useful life</Typography>
                  <Typography fontWeight={600}>{asset.usefulLifeMonths} months</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Schedule revision</Typography>
                  <Typography fontWeight={600}>v{asset.scheduleRevision}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Next depreciation period</Typography>
                  <Typography fontWeight={600}>{asset.nextDepreciationPeriod}</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Assignment &amp; Location
              </Typography>
              <Stack spacing={1.4}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Location</Typography>
                  <Typography fontWeight={600}>{asset.location || '—'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Custodian</Typography>
                  <Typography fontWeight={600}>{asset.custodian || '—'}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Vendor</Typography>
                  <Typography fontWeight={600}>{asset.vendorName}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Cost center</Typography>
                  <Typography fontWeight={600}>{asset.costCenterName}</Typography>
                </Stack>
                {asset.projectName && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Project</Typography>
                    <Typography fontWeight={600}>{asset.projectName}</Typography>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Attachments
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {asset.attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No attachments.
                  </Typography>
                ) : (
                  asset.attachments.map((att) => (
                    <Chip
                      key={att.id}
                      label={att.name}
                      variant="outlined"
                      size="small"
                      icon={<Iconify icon="solar:file-text-bold" width={14} />}
                    />
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right column — activity ─────────────────────────────────── */}
        <Grid size={{ xs: 12, xl: 8 }}>
          {/* Lifecycle timeline */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Lifecycle Timeline
              </Typography>
              {asset.timeline.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No events recorded.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {asset.timeline.map((event) => (
                    <Stack
                      key={event.id}
                      spacing={0.4}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="body2" fontWeight={700}>
                          {event.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.date}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {event.description}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Depreciation schedule */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Depreciation Schedule
              </Typography>
              {asset.schedule.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No schedule lines available.
                </Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Period</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Opening value</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Depreciation</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Closing value</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asset.schedule.map((row) => (
                        <tr key={row.id} style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                          <td style={{ padding: '8px 10px' }}>{row.period}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {formatCurrency(row.openingValue)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {formatCurrency(row.depreciationAmount)}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                            {formatCurrency(row.closingValue)}
                          </td>
                          <td style={{ padding: '8px 10px' }}>
                            <Chip
                              label={formatAssetStatus(row.status)}
                              size="small"
                              color={
                                row.status === 'posted'
                                  ? 'success'
                                  : row.status === 'pending'
                                    ? 'warning'
                                    : 'default'
                              }
                              variant={row.status === 'forecast' ? 'outlined' : 'filled'}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Impairments */}
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Asset Impairments
                </Typography>
                <Chip
                  label={asset.impairments.length}
                  size="small"
                  color={asset.impairments.length ? 'error' : 'default'}
                />
              </Stack>
              {asset.impairments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No impairment charges recorded for this asset.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {asset.impairments.map((imp) => (
                    <Stack
                      key={imp.id}
                      spacing={0.5}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="body2" fontWeight={700} color="error.main">
                          {formatCurrency(imp.amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {imp.date}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {imp.reason}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reviewed by {imp.reviewer}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Transfers */}
          {asset.transfers.length > 0 && (
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Transfer History
                </Typography>
                <Stack spacing={1.25}>
                  {asset.transfers.map((trn) => (
                    <Stack
                      key={trn.id}
                      spacing={0.5}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack direction="row" justifyContent="space-between" spacing={2}>
                        <Typography variant="body2" fontWeight={700}>
                          {trn.fromLocation} → {trn.toLocation}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trn.date}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Assignee: {trn.assignee}
                      </Typography>
                      {trn.reason && (
                        <Typography variant="caption" color="text.secondary">
                          {trn.reason}
                        </Typography>
                      )}
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Linked journal entries */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Linked Journal Entries
              </Typography>
              {asset.journalEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No journal entries linked.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {asset.journalEntries.map((entry) => (
                    <Box
                      key={entry.id}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        justifyContent="space-between"
                        spacing={1}
                        sx={{ mb: 1 }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={700}>
                            {entry.number} &bull; {entry.type}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {entry.date} &bull; {entry.memo}
                          </Typography>
                        </Box>
                        <Chip
                          label={formatAssetStatus(entry.status)}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                      <Divider sx={{ mb: 1 }} />
                      <Box sx={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 12 }}>
                                Account
                              </th>
                              <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12 }}>
                                Debit
                              </th>
                              <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: 12 }}>
                                Credit
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.lines.map((line, index) => (
                              <tr
                                key={`${entry.id}-${index}`}
                                style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                              >
                                <td style={{ padding: '8px 6px' }}>
                                  <Stack spacing={0.25}>
                                    <Typography variant="body2">{line.account}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {line.description}
                                    </Typography>
                                  </Stack>
                                </td>
                                <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                                  {formatCurrency(line.debit)}
                                </td>
                                <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                                  {formatCurrency(line.credit)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
