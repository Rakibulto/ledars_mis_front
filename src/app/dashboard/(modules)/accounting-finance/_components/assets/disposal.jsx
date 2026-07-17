'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { formatAssetStatus } from './mock-data';
import { useAssetsWorkspace } from './use-assets-workspace';
import { AssetsWorkspaceToolbar } from './assets-workspace-toolbar';

function DisposalMetric({ label, value, helper }) {
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

export default function AssetDisposal() {
  const workspace = useAssetsWorkspace();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    assetId: '',
    disposalDate: '2026-03-29',
    method: 'sale',
    saleAmount: '',
    costOfRemoval: '0',
    proceedsHandling: 'Bank receipt into treasury clearing account',
    notes: '',
  });

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Asset</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Date</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Method
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Book Value
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Proceeds
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Gain/Loss
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.disposals.map((item) => (
          <tr key={item.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.assetName}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.disposalDate}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.methodLabel}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.bookValue}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.saleAmount}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.gainOrLoss}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const availableAssets = useMemo(
    () => workspace.assets.filter((asset) => asset.status !== 'disposed'),
    [workspace.assets]
  );
  const selectedAsset = useMemo(
    () => availableAssets.find((item) => String(item.id) === String(form.assetId)) || null,
    [availableAssets, form.assetId]
  );
  const disposalGainLoss = useMemo(() => {
    if (!selectedAsset) return 0;
    return (
      (Number(form.saleAmount) || 0) -
      (Number(form.costOfRemoval) || 0) -
      selectedAsset.currentValue
    );
  }, [form.costOfRemoval, form.saleAmount, selectedAsset]);

  const disposalJournalPreview = useMemo(() => {
    if (!selectedAsset) return [];

    const proceeds = Number(form.saleAmount) || 0;
    const removalCost = Number(form.costOfRemoval) || 0;
    const lines = [];

    if (proceeds > 0) {
      lines.push({
        account: '1010 - Main Operating Bank',
        debit: proceeds,
        credit: 0,
        description: 'Sale proceeds received',
      });
    }

    lines.push({
      account: '1599 - Accumulated Depreciation',
      debit: selectedAsset.accumulatedDepreciation,
      credit: 0,
      description: `${selectedAsset.code} accumulated depreciation release`,
    });
    lines.push({
      account: selectedAsset.assetAccount,
      debit: 0,
      credit: selectedAsset.purchaseCost,
      description: `${selectedAsset.code} asset disposal`,
    });

    if (removalCost > 0) {
      lines.push({
        account: '6205 - Disposal Handling Cost',
        debit: removalCost,
        credit: 0,
        description: 'Disposal cost accrued',
      });
    }

    if (disposalGainLoss > 0) {
      lines.push({
        account: '7801 - Gain on Disposal',
        debit: 0,
        credit: disposalGainLoss,
        description: 'Recognized gain on disposal',
      });
    } else if (disposalGainLoss < 0) {
      lines.push({
        account: '6801 - Loss on Disposal',
        debit: Math.abs(disposalGainLoss),
        credit: 0,
        description: 'Recognized loss on disposal',
      });
    }

    return lines;
  }, [disposalGainLoss, form.costOfRemoval, form.saleAmount, selectedAsset]);

  return (
    <Box>
      <AssetsWorkspaceToolbar printTitle="Asset Disposal" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Asset Disposal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Retire, sell, or write off assets with gain or loss visibility and a clear disposal
            history.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={() => setOpen(true)}
        >
          Dispose Asset
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <DisposalMetric
            label="Disposed assets"
            value={workspace.disposals.length}
            helper="Completed lifecycle exits recorded in the workspace"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <DisposalMetric
            label="Disposal proceeds"
            value={formatCurrency(
              workspace.disposals.reduce((sum, item) => sum + item.saleAmount, 0)
            )}
            helper="Cash or recovery value from completed disposals"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <DisposalMetric
            label="Recoverable gain/loss"
            value={formatCurrency(disposalGainLoss)}
            helper="Preview against selected asset carrying value"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <DisposalMetric
            label="Assets still active"
            value={workspace.overview.activeCount}
            helper="Remaining assets still in use or awaiting full depreciation"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Assets Available For Exit
              </Typography>
              <Stack spacing={1.5}>
                {availableAssets.map((asset) => (
                  <Stack
                    key={asset.id}
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {asset.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {asset.code} • {asset.location}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end" spacing={0.75}>
                      <Chip
                        label={formatAssetStatus(asset.status)}
                        size="small"
                        color={asset.status === 'fully_depreciated' ? 'warning' : 'success'}
                      />
                      <Typography variant="body2" fontWeight={700}>
                        {formatCurrency(asset.currentValue)}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          setForm((current) => ({ ...current, assetId: String(asset.id) }));
                          setOpen(true);
                        }}
                      >
                        Dispose
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Disposal History
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th align="left">Asset</th>
                      <th align="left">Date</th>
                      <th align="left">Method</th>
                      <th align="right">Book value</th>
                      <th align="right">Proceeds</th>
                      <th align="right">Gain / loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.disposals.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '12px 8px' }}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" fontWeight={700}>
                              {item.assetName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.assetCode}
                            </Typography>
                          </Stack>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{item.disposalDate}</td>
                        <td style={{ padding: '12px 8px' }}>{item.methodLabel}</td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(item.bookValue)}
                        </td>
                        <td align="right" style={{ padding: '12px 8px' }}>
                          {formatCurrency(item.saleAmount)}
                        </td>
                        <td
                          align="right"
                          style={{
                            padding: '12px 8px',
                            fontWeight: 700,
                            color: item.gainOrLoss >= 0 ? '#15803d' : '#b91c1c',
                          }}
                        >
                          {formatCurrency(item.gainOrLoss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          {selectedAsset && (
            <Card sx={{ borderRadius: 3, mt: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Disposal Journal Preview
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Selected asset</Typography>
                    <Typography fontWeight={700}>
                      {selectedAsset.code} • {selectedAsset.name}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Book value</Typography>
                    <Typography fontWeight={700}>
                      {formatCurrency(selectedAsset.currentValue)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Disposal result</Typography>
                    <Typography
                      fontWeight={700}
                      color={disposalGainLoss >= 0 ? '#15803d' : '#b91c1c'}
                    >
                      {formatCurrency(disposalGainLoss)}
                    </Typography>
                  </Stack>
                </Stack>
                <Box sx={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th align="left">Account</th>
                        <th align="right">Debit</th>
                        <th align="right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disposalJournalPreview.map((line, index) => (
                        <tr key={`${line.account}-${index}`}>
                          <td style={{ padding: '8px 6px' }}>
                            <Stack spacing={0.25}>
                              <Typography variant="body2">{line.account}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {line.description}
                              </Typography>
                            </Stack>
                          </td>
                          <td align="right" style={{ padding: '8px 6px' }}>
                            {formatCurrency(line.debit)}
                          </td>
                          <td align="right" style={{ padding: '8px 6px' }}>
                            {formatCurrency(line.credit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dispose Asset</DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Asset"
              value={form.assetId}
              onChange={(event) =>
                setForm((current) => ({ ...current, assetId: event.target.value }))
              }
            >
              {availableAssets.map((asset) => (
                <MenuItem key={asset.id} value={asset.id}>
                  {asset.code} • {asset.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="date"
              label="Disposal date"
              value={form.disposalDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, disposalDate: event.target.value }))
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              fullWidth
              label="Method"
              value={form.method}
              onChange={(event) =>
                setForm((current) => ({ ...current, method: event.target.value }))
              }
            >
              <MenuItem value="sale">Sale</MenuItem>
              <MenuItem value="retirement">Retirement</MenuItem>
              <MenuItem value="write_off">Write-off</MenuItem>
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Sale proceeds"
              value={form.saleAmount}
              onChange={(event) =>
                setForm((current) => ({ ...current, saleAmount: event.target.value }))
              }
            />
            <TextField
              fullWidth
              type="number"
              label="Cost of removal"
              value={form.costOfRemoval}
              onChange={(event) =>
                setForm((current) => ({ ...current, costOfRemoval: event.target.value }))
              }
            />
            <TextField
              fullWidth
              label="Proceeds handling"
              value={form.proceedsHandling}
              onChange={(event) =>
                setForm((current) => ({ ...current, proceedsHandling: event.target.value }))
              }
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Narration"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={submitting || !form.assetId || !form.notes}
            onClick={async () => {
              setSubmitting(true);
              const loadingId = toast.loading('Posting disposal...');
              try {
                await workspace.actions.disposeAsset(Number(form.assetId), form);
                toast.dismiss(loadingId);
                toast.success('Asset disposed');
                setOpen(false);
                setForm({
                  assetId: '',
                  disposalDate: '2026-03-29',
                  method: 'sale',
                  saleAmount: '',
                  costOfRemoval: '0',
                  proceedsHandling: 'Bank receipt into treasury clearing account',
                  notes: '',
                });
              } catch (error) {
                toast.dismiss(loadingId);
                toast.error(error?.message || 'Disposal failed');
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Confirm Disposal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
