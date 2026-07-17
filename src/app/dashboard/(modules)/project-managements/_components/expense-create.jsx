'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import {
  useProjectManagementsApi,
  createProjectManagementExpense,
  transitionProjectManagementExpense,
} from './use-project-managements-api';

function createEmptyItem(index = 0) {
  return {
    id: `draft-${index}-${Date.now()}`,
    title: '',
    analytic: '',
    quantity: 1,
    unitPrice: 0,
  };
}

function formatCurrency(amount, currency = 'BDT') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));
}

export default function ExpenseCreate() {
  const theme = useTheme();
  const router = useRouter();
  const { projects, isLoading, error } = useProjectManagementsApi();

  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    vendorName: '',
    expenseDate: new Date().toISOString().slice(0, 10),
    currency: 'BDT',
    projectId: '',
    planId: '',
  });
  const [items, setItems] = useState([createEmptyItem(0)]);
  const [taxRate, setTaxRate] = useState(5);
  const [submittingMode, setSubmittingMode] = useState(null);

  const selectedProject = useMemo(
    () => projects.find((project) => String(project.id) === String(formValues.projectId)) || null,
    [formValues.projectId, projects]
  );

  const planOptions = useMemo(() => selectedProject?.plans || [], [selectedProject]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );
    const safeTaxRate = Math.max(0, Number(taxRate || 0));
    const taxAmount = subtotal * (safeTaxRate / 100);
    const totalAmount = subtotal + taxAmount;
    const lineCount = items.length;

    return { lineCount, subtotal, taxAmount, totalAmount };
  }, [items, taxRate]);

  function updateFormValue(key, value) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
      ...(key === 'projectId' ? { planId: '' } : {}),
    }));
  }

  function updateItem(index, key, value) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  }

  function addItem() {
    setItems((current) => [...current, createEmptyItem(current.length)]);
  }

  function removeItem(index) {
    setItems((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function validateForm() {
    if (!formValues.title.trim()) {
      toast.error('Expense title is required.');
      return false;
    }

    if (!formValues.projectId) {
      toast.error('Select a project before saving the expense.');
      return false;
    }

    const hasValidItem = items.some((item) => item.title.trim() && Number(item.quantity || 0) > 0);
    if (!hasValidItem) {
      toast.error('Add at least one valid expense line item.');
      return false;
    }

    return true;
  }

  async function handleSubmit(mode = 'draft') {
    if (!validateForm()) return;

    setSubmittingMode(mode);

    try {
      const sanitized = items
        .filter((item) => item.title.trim())
        .map((item, index) => ({
          title: item.title.trim(),
          description: item.analytic.trim() ? `Analytic: ${item.analytic.trim()}` : '',
          quantity: parseFloat(parseFloat(item.quantity ?? 1).toFixed(2)),
          unit_price: parseFloat(parseFloat(item.unitPrice ?? 0).toFixed(2)),
          sort_order: index + 1,
        }));

      const payload = {
        title: formValues.title.trim(),
        description: formValues.description.trim(),
        vendor_name: formValues.vendorName.trim(),
        expense_date: formValues.expenseDate,
        currency: formValues.currency,
        project_id: Number(formValues.projectId),
        plan_id: formValues.planId ? Number(formValues.planId) : null,
        items: sanitized
          .concat(
            Number(taxRate || 0) > 0 && totals.taxAmount > 0
              ? [
                  {
                    title: `Tax (${Number(taxRate || 0)}%)`,
                    description: 'Auto-generated tax line',
                    quantity: 1,
                    unit_price: Number(totals.taxAmount || 0),
                    sort_order: items.filter((item) => item.title.trim()).length + 1,
                  },
                ]
              : []
          ),
      };

      const createdExpense = await createProjectManagementExpense(payload);

      if (mode === 'submitted') {
        await transitionProjectManagementExpense(createdExpense.id, 'Submitted');
      }

      toast.success(
        mode === 'submitted' ? 'Expense saved and submitted.' : 'Expense saved as draft.'
      );
      router.push(paths.dashboard.projectManagements.expenses.root);
    } catch (submitError) {
      toast.error(submitError?.message || submitError?.detail || 'Failed to save expense.');
    } finally {
      setSubmittingMode(null);
    }
  }

  return (
    <Box>
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          overflow: 'hidden',
          color: 'common.white',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 58%, ${theme.palette.secondary.main} 100%)`,
          boxShadow: `0 22px 44px ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2.5}
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Create Expense
              </Typography>
              <Typography
                variant="body1"
                sx={{ mt: 1.1, maxWidth: 860, color: alpha('#ffffff', 0.84) }}
              >
                Record a project-linked expense with task alignment, itemized cost lines, live
                totals, and optional submission for approval.
              </Typography>
            </Box>

            <Button
              component={RouterLink}
              href={paths.dashboard.projectManagements.expenses.root}
              variant="outlined"
              startIcon={<Iconify icon="solar:arrow-left-bold" />}
              sx={{ borderColor: alpha('#ffffff', 0.35), color: 'common.white', borderRadius: 2.5 }}
            >
              Back to Expenses
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {error ? (
        <Typography color="error.main" sx={{ mb: 2 }}>
          Unable to load project options.
        </Typography>
      ) : null}

      {isLoading ? (
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{ py: 8 }}
        >
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading project options...
          </Typography>
        </Stack>
      ) : (
        <Card
          sx={{
            borderRadius: 3.5,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            boxShadow: 'none',
          }}
        >
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={800}>
                Expense Details
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Expense title"
                    value={formValues.title}
                    onChange={(event) => updateFormValue('title', event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Vendor / Payee"
                    value={formValues.vendorName}
                    onChange={(event) => updateFormValue('vendorName', event.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expense date"
                    value={formValues.expenseDate}
                    onChange={(event) => updateFormValue('expenseDate', event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Currency"
                    value={formValues.currency}
                    onChange={(event) => updateFormValue('currency', event.target.value)}
                  >
                    {['BDT', 'USD', 'EUR', 'GBP'].map((currency) => (
                      <MenuItem key={currency} value={currency}>
                        {currency}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    select
                    label="Project"
                    value={formValues.projectId}
                    onChange={(event) => updateFormValue('projectId', event.target.value)}
                  >
                    <MenuItem value="">Select project</MenuItem>
                    {projects.map((project) => (
                      <MenuItem key={project.id} value={String(project.id)}>
                        {project.title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Task / Roadmap step"
                    value={formValues.planId}
                    onChange={(event) => updateFormValue('planId', event.target.value)}
                    disabled={!selectedProject}
                  >
                    <MenuItem value="">No linked task</MenuItem>
                    {planOptions.map((plan) => (
                      <MenuItem key={plan.id} value={String(plan.id)}>
                        {plan.serial_no}. {plan.title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Description"
                    value={formValues.description}
                    onChange={(event) => updateFormValue('description', event.target.value)}
                    placeholder="What is this expense for?"
                  />
                </Grid>
              </Grid>

              <Divider />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={800}>
                  Bill Lines
                </Typography>
                <Button
                  variant="text"
                  startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
                  onClick={addItem}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Add Line
                </Button>
              </Stack>

              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.18)}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: 'minmax(280px, 1.8fr) 88px 120px 140px 120px 36px',
                    },
                    gap: { xs: 1.5, md: 2 },
                    px: 2,
                    py: 1.5,
                    bgcolor: alpha(theme.palette.grey[500], 0.08),
                    borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.14)}`,
                  }}
                >
                  {['Description', 'Qty', 'Unit Price', 'Analytic', 'Amount', ''].map((label) => (
                    <Typography
                      key={label || 'actions'}
                      variant="subtitle2"
                      fontWeight={700}
                      color="text.secondary"
                    >
                      {label}
                    </Typography>
                  ))}
                </Box>

                <Stack spacing={0}>
                  {items.map((item, index) => {
                    const lineTotal = Number(item.quantity || 0) * Number(item.unitPrice || 0);

                    return (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            md: 'minmax(280px, 1.8fr) 88px 120px 140px 120px 36px',
                          },
                          gap: { xs: 1.5, md: 2 },
                          alignItems: 'center',
                          px: 2,
                          py: 1.6,
                          borderBottom:
                            index === items.length - 1
                              ? 'none'
                              : `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                        }}
                      >
                        <TextField
                          fullWidth
                          variant="standard"
                          placeholder="Item description"
                          value={item.title}
                          onChange={(event) => updateItem(index, 'title', event.target.value)}
                        />
                        <TextField
                          fullWidth
                          variant="standard"
                          type="number"
                          value={item.quantity}
                          onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                        <TextField
                          fullWidth
                          variant="standard"
                          type="number"
                          value={item.unitPrice}
                          onChange={(event) => updateItem(index, 'unitPrice', event.target.value)}
                          inputProps={{ min: 0, step: '0.01' }}
                        />
                        <TextField
                          fullWidth
                          variant="standard"
                          placeholder="e.g. Shared"
                          value={item.analytic}
                          onChange={(event) => updateItem(index, 'analytic', event.target.value)}
                        />
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          textAlign={{ xs: 'left', md: 'right' }}
                        >
                          {formatCurrency(lineTotal, formValues.currency)}
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          sx={{ justifySelf: { xs: 'flex-start', md: 'center' } }}
                        >
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              <Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.5}>
                <Typography variant="body2" color="text.secondary">
                  Tax rate %
                </Typography>
                <TextField
                  type="number"
                  size="small"
                  value={taxRate}
                  onChange={(event) => setTaxRate(event.target.value)}
                  inputProps={{ min: 0, step: '0.01' }}
                  sx={{ width: 110 }}
                />
              </Stack>

              <Box
                sx={{
                  ml: { xs: 0, md: 'auto' },
                  width: { xs: '100%', md: 360 },
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.grey[500], 0.08),
                  px: 2.25,
                  py: 1.75,
                }}
              >
                <Stack spacing={1.2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Subtotal
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(totals.subtotal, formValues.currency)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Tax ({Number(taxRate || 0)}%)
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(totals.taxAmount, formValues.currency)}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight={800}>
                      Total
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800}>
                      {formatCurrency(totals.totalAmount, formValues.currency)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.25}
                justifyContent="flex-end"
              >
                <Button
                  variant="contained"
                  onClick={() => handleSubmit('draft')}
                  disabled={Boolean(submittingMode)}
                >
                  {submittingMode === 'draft' ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit('submitted')}
                  disabled={Boolean(submittingMode)}
                >
                  {submittingMode === 'submitted' ? 'Submitting...' : 'Save & Submit'}
                </Button>
                <Button
                  component={RouterLink}
                  href={paths.dashboard.projectManagements.expenses.root}
                  color="inherit"
                >
                  Cancel
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
