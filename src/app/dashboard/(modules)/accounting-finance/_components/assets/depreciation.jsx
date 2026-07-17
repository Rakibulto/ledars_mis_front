'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { formatAssetStatus } from './mock-data';
import { useAssetsWorkspace } from './use-assets-workspace';
import { AssetsWorkspaceToolbar } from './assets-workspace-toolbar';

function InsightCard({ label, value, helper }) {
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

export default function AssetDepreciation() {
  const workspace = useAssetsWorkspace();
  const [selectedAssetId, setSelectedAssetId] = useState(workspace.assets[0]?.id || '');
  const [runForm, setRunForm] = useState({
    period: 'Apr 2026',
    owner: 'Finance Manager',
    note: 'Month-end asset depreciation',
    postDate: '2026-04-30',
  });
  const [submitting, setSubmitting] = useState(false);

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Asset</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Period
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Method
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.depreciationQueue.map((row) => (
          <tr key={row.assetId}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.assetName}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.period}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.methodLabel}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{row.amount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const selectedAsset = useMemo(
    () =>
      workspace.assets.find((asset) => String(asset.id) === String(selectedAssetId)) ||
      workspace.assets[0],
    [selectedAssetId, workspace.assets]
  );

  const scheduleRows = selectedAsset?.schedule || [];
  const pendingCharge = workspace.depreciationQueue.reduce(
    (sum, row) => sum + row.monthlyDepreciation,
    0
  );
  const lastRun = workspace.depreciationRuns[0];
  const postedRows = scheduleRows.filter((row) => row.status === 'posted');
  const pendingRows = scheduleRows.filter(
    (row) => row.status === 'pending' || row.status === 'scheduled'
  );

  return (
    <Box>
      <AssetsWorkspaceToolbar printTitle="Asset Depreciation" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Asset Depreciation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run monthly depreciation batches, inspect the forward schedule, and reconcile book value
            movement from one workspace.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:play-circle-bold" />}
          disabled={submitting || !workspace.depreciationQueue.length}
          onClick={async () => {
            setSubmitting(true);
            const loadingId = toast.loading('Posting monthly depreciation...');
            try {
              await workspace.actions.runMonthlyDepreciationBatch(runForm);
              toast.dismiss(loadingId);
              toast.success('Depreciation batch posted');
            } catch (error) {
              toast.dismiss(loadingId);
              toast.error(error?.message || 'Depreciation run failed');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          Run Monthly Batch
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <InsightCard
            label="Assets in schedule"
            value={workspace.depreciationQueue.length}
            helper="Assets due for the next periodic posting"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <InsightCard
            label="Pending depreciation"
            value={formatCurrency(pendingCharge)}
            helper="Unposted amount still waiting in the queue"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <InsightCard
            label="Last batch period"
            value={lastRun?.period || 'None'}
            helper={
              lastRun
                ? `${lastRun.owner} posted ${formatCurrency(lastRun.totalAmount)}`
                : 'No monthly batch has been posted yet'
            }
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <InsightCard
            label="Portfolio accumulated depreciation"
            value={formatCurrency(workspace.overview.accumulatedDepreciation)}
            helper="Recognized depreciation across all capitalized assets"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Batch Controls
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Posting period"
                    value={runForm.period}
                    onChange={(event) =>
                      setRunForm((current) => ({ ...current, period: event.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Posted by"
                    value={runForm.owner}
                    onChange={(event) =>
                      setRunForm((current) => ({ ...current, owner: event.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Post date"
                    type="date"
                    value={runForm.postDate}
                    onChange={(event) =>
                      setRunForm((current) => ({ ...current, postDate: event.target.value }))
                    }
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Narration"
                    value={runForm.note}
                    onChange={(event) =>
                      setRunForm((current) => ({ ...current, note: event.target.value }))
                    }
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Depreciation Queue
                </Typography>
                <Stack spacing={1.5}>
                  {workspace.depreciationQueue.slice(0, 6).map((row) => (
                    <Stack
                      key={row.assetId}
                      direction="row"
                      justifyContent="space-between"
                      spacing={2}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {row.assetName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.period} • {row.methodLabel}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(row.amount)}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={() => setSelectedAssetId(row.assetId)}
                        >
                          Inspect
                        </Button>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Posted periods</Typography>
                  <Typography fontWeight={700}>{postedRows.length}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Pending and scheduled</Typography>
                  <Typography fontWeight={700}>{pendingRows.length}</Typography>
                </Stack>
                <Button
                  sx={{ mt: 2 }}
                  fullWidth
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:restart-bold" />}
                  onClick={async () => {
                    if (!selectedAsset) return;
                    const loadingId = toast.loading('Recalculating schedule...');
                    try {
                      await workspace.actions.recalculateAssetSchedule(selectedAsset.id);
                      toast.dismiss(loadingId);
                      toast.success(`${selectedAsset.code} schedule recalculated`);
                    } catch (error) {
                      toast.dismiss(loadingId);
                      toast.error(error?.message || 'Schedule recalculation failed');
                    }
                  }}
                >
                  Recalculate Selected Asset
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    select
                    fullWidth
                    label="Inspect asset schedule"
                    value={selectedAsset?.id || ''}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                  >
                    {workspace.assets.map((asset) => (
                      <MenuItem key={asset.id} value={asset.id}>
                        {asset.code} • {asset.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack direction="row" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Chip
                      label={selectedAsset ? formatAssetStatus(selectedAsset.status) : 'N/A'}
                      color={
                        selectedAsset?.status === 'disposed'
                          ? 'error'
                          : selectedAsset?.status === 'fully_depreciated'
                            ? 'warning'
                            : 'success'
                      }
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Projected Depreciation Schedule
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Seq</th>
                      <th align="left">Period</th>
                      <th align="right">Opening</th>
                      <th align="right">Charge</th>
                      <th align="right">Closing</th>
                      <th align="left">Status</th>
                      <th align="left">Journal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows.map((row, index) => (
                      <tr key={`${row.period}-${index}`}>
                        <td style={{ padding: '12px 8px' }}>{row.sequence}</td>
                        <td style={{ padding: '12px 8px' }}>{row.period}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.openingValue)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(row.depreciationAmount)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {formatCurrency(row.closingValue)}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <Chip
                            label={formatAssetStatus(row.status)}
                            size="small"
                            variant="outlined"
                          />
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {row.journalEntry || 'Pending post'}
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
                Batch History
              </Typography>
              <Stack spacing={1.5}>
                {workspace.depreciationRuns.map((run) => (
                  <Stack
                    key={run.id}
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={1.5}
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {run.period}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {run.owner} • {run.postedOn || 'Awaiting posting'}
                      </Typography>
                    </Box>
                    <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                      <Chip
                        label={formatAssetStatus(run.status)}
                        size="small"
                        color={run.status === 'posted' ? 'success' : 'warning'}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(run.totalAmount)}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
