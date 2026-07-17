'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useAssetsWorkspace } from './use-assets-workspace';
import { AssetsWorkspaceToolbar } from './assets-workspace-toolbar';

const initialForm = {
  code: '',
  name: '',
  categoryId: '',
  vendorId: '',
  costCenterId: '',
  purchaseCost: '',
  salvageValue: '',
  usefulLifeYears: '',
  purchaseDate: '2026-03-29',
  location: '',
  custodian: '',
  description: '',
  attachmentInput: '',
  mode: 'capitalized',
};

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

export default function AssetAcquisition() {
  const workspace = useAssetsWorkspace();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Code</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>Name</th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Category
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Vendor
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Purchase Cost
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Purchase Date
          </th>
        </tr>
      </thead>
      <tbody>
        {workspace.acquisitionQueue.map((item) => (
          <tr key={item.id}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {item.categoryName || item.categoryId}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>
              {item.vendorName || item.vendorId}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.purchaseCost}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{item.purchaseDate}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const selectedCategory = workspace.categories.find(
    (category) => String(category.id) === String(form.categoryId)
  );
  const selectedVendor = workspace.vendors.find(
    (vendor) => String(vendor.id) === String(form.vendorId)
  );
  const selectedCostCenter = workspace.costCenters.find(
    (center) => String(center.id) === String(form.costCenterId)
  );
  const attachmentNames = useMemo(
    () =>
      form.attachmentInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    [form.attachmentInput]
  );

  const monthlyDepreciation = useMemo(() => {
    const purchaseCost = Number(form.purchaseCost) || 0;
    const salvageValue = Number(form.salvageValue) || 0;
    const usefulLifeYears = Number(form.usefulLifeYears) || 0;
    const depreciableBase = Math.max(purchaseCost - salvageValue, 0);
    return usefulLifeYears > 0 ? depreciableBase / (usefulLifeYears * 12) : 0;
  }, [form.purchaseCost, form.salvageValue, form.usefulLifeYears]);

  const readyToPost =
    form.code &&
    form.name &&
    form.categoryId &&
    form.vendorId &&
    form.costCenterId &&
    Number(form.purchaseCost) > 0 &&
    Number(form.usefulLifeYears) > 0;

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const queueRows = workspace.acquisitionQueue.slice(0, 5);
  const capitalizationJournal = useMemo(
    () => [
      {
        account: selectedCategory?.asset_account || '1500 - Fixed Assets',
        debit: Number(form.purchaseCost) || 0,
        credit: 0,
        description: `Capitalize ${form.code || 'new asset'}`,
      },
      {
        account: '2105 - Asset Clearing',
        debit: 0,
        credit: Number(form.purchaseCost) || 0,
        description: `Auto-post from ${selectedVendor?.name || 'selected vendor'}`,
      },
    ],
    [form.code, form.purchaseCost, selectedCategory, selectedVendor]
  );

  return (
    <Box>
      <AssetsWorkspaceToolbar printTitle="Asset Acquisition" printContent={printContent} />

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Asset Acquisition
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capitalize new fixed assets, assign stewardship, and push them directly into the shared
            asset register.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          disabled={!readyToPost || submitting}
          onClick={async () => {
            setSubmitting(true);
            const loadingId = toast.loading('Capitalizing asset...');
            try {
              await workspace.actions.createAssetAcquisition({
                code: form.code,
                name: form.name,
                categoryId: Number(form.categoryId),
                vendorId: Number(form.vendorId),
                costCenterId: Number(form.costCenterId),
                purchaseCost: Number(form.purchaseCost),
                salvageValue: Number(form.salvageValue) || 0,
                usefulLifeMonths: Number(form.usefulLifeYears) * 12,
                purchaseDate: form.purchaseDate,
                location: form.location,
                custodian: form.custodian,
                description: form.description,
                attachmentNames,
                mode: form.mode,
              });
              toast.dismiss(loadingId);
              toast.success(
                form.mode === 'draft'
                  ? 'Asset request saved to acquisition queue'
                  : 'Asset capitalized into register'
              );
              setForm(initialForm);
            } catch (error) {
              toast.dismiss(loadingId);
              toast.error(error?.message || 'Capitalization failed');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {form.mode === 'draft' ? 'Save Draft Request' : 'Capitalize Asset'}
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Pending intake"
            value={workspace.acquisitionQueue.length}
            helper="Requests still waiting for capitalization review"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Open queue value"
            value={formatCurrency(
              workspace.acquisitionQueue.reduce((sum, item) => sum + item.purchaseCost, 0)
            )}
            helper="Total pending capitalization commitment"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Latest run book value"
            value={formatCurrency(workspace.overview.bookValue)}
            helper="Current portfolio carrying amount after additions"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <MetricCard
            label="Monthly depreciation impact"
            value={formatCurrency(monthlyDepreciation)}
            helper="Projected monthly charge for this proposed acquisition"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, xl: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Capitalization Form
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Asset code"
                    value={form.code}
                    onChange={handleChange('code')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Asset name"
                    value={form.name}
                    onChange={handleChange('name')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Category"
                    value={form.categoryId}
                    onChange={handleChange('categoryId')}
                  >
                    {workspace.categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Vendor"
                    value={form.vendorId}
                    onChange={handleChange('vendorId')}
                  >
                    {workspace.vendors.map((vendor) => (
                      <MenuItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Cost center"
                    value={form.costCenterId}
                    onChange={handleChange('costCenterId')}
                  >
                    {workspace.costCenters.map((center) => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    select
                    fullWidth
                    label="Posting mode"
                    value={form.mode}
                    onChange={handleChange('mode')}
                  >
                    <MenuItem value="capitalized">Capitalize now</MenuItem>
                    <MenuItem value="draft">Save to draft queue</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purchase cost"
                    value={form.purchaseCost}
                    onChange={handleChange('purchaseCost')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Salvage value"
                    value={form.salvageValue}
                    onChange={handleChange('salvageValue')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Useful life years"
                    value={form.usefulLifeYears}
                    onChange={handleChange('usefulLifeYears')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Purchase date"
                    value={form.purchaseDate}
                    onChange={handleChange('purchaseDate')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Location"
                    value={form.location}
                    onChange={handleChange('location')}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Custodian"
                    value={form.custodian}
                    onChange={handleChange('custodian')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Description"
                    value={form.description}
                    onChange={handleChange('description')}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Attachments"
                    value={form.attachmentInput}
                    onChange={handleChange('attachmentInput')}
                    placeholder="invoice.pdf, approval-note.pdf, warranty-card.pdf"
                    helperText="Comma-separated files to simulate invoice, approval, and commissioning attachments."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Stack spacing={3}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  Capitalization Controls
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    Monthly depreciation will start after capitalization using the configured useful
                    life and salvage value.
                  </Alert>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Depreciable base</Typography>
                    <Typography fontWeight={700}>
                      {formatCurrency(
                        Math.max(
                          (Number(form.purchaseCost) || 0) - (Number(form.salvageValue) || 0),
                          0
                        )
                      )}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Projected monthly charge</Typography>
                    <Typography fontWeight={700}>{formatCurrency(monthlyDepreciation)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Assigned owner</Typography>
                    <Typography fontWeight={700}>{form.custodian || 'Unassigned'}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Vendor auto-posting</Typography>
                    <Typography fontWeight={700}>
                      {selectedVendor?.name || 'Select vendor'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Cost center tagging</Typography>
                    <Typography fontWeight={700}>
                      {selectedCostCenter?.name || 'Select cost center'}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Capitalization Journal Preview
                  </Typography>
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
                        {capitalizationJournal.map((line, index) => (
                          <tr key={`${line.account}-${index}`}>
                            <td style={{ padding: '8px 4px' }}>
                              <Stack spacing={0.25}>
                                <Typography variant="body2">{line.account}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {line.description}
                                </Typography>
                              </Stack>
                            </td>
                            <td align="right" style={{ padding: '8px 4px' }}>
                              {formatCurrency(line.debit)}
                            </td>
                            <td align="right" style={{ padding: '8px 4px' }}>
                              {formatCurrency(line.credit)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                  {attachmentNames.length > 0 && (
                    <>
                      <Divider />
                      <Typography variant="subtitle2" fontWeight={700}>
                        Attachment Pack
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {attachmentNames.map((name) => (
                          <Chip key={name} label={name} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Acquisition Queue
                </Typography>
                <Stack spacing={1.5}>
                  {queueRows.map((item) => (
                    <Stack
                      key={item.id}
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      spacing={1}
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'background.neutral' }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.code} • {item.vendorName}
                        </Typography>
                      </Box>
                      <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
                        <Chip
                          label={item.statusLabel}
                          size="small"
                          color={item.status === 'awaiting_capitalization' ? 'warning' : 'success'}
                        />
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(item.purchaseCost)}
                        </Typography>
                      </Stack>
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
