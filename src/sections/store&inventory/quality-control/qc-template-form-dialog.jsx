'use client';

import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Box,
  Card,
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  Divider,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogActions,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import {
  normalizeCollection,
  createChecklistItem,
  normalizeBooleanValue,
  buildChecklistFormItems,
  serializeChecklistForPayload,
} from './qc-template-shared';

const EP = endpoints.storeInventory;

function createDefaultFormValues() {
  return {
    name: '',
    category: '',
    is_active: true,
    checklist: [createChecklistItem()],
  };
}

function mapRecordToFormValues(record) {
  return {
    name: record?.name || '',
    category: record?.category ? String(record.category) : '',
    is_active: Boolean(record?.is_active),
    checklist: buildChecklistFormItems(record?.checklist),
  };
}

function sortByLabel(items, getLabel) {
  return [...items].sort((left, right) =>
    getLabel(left).localeCompare(getLabel(right), undefined, { sensitivity: 'base' })
  );
}

export default function QcTemplateFormDialog({ open, mode, qcTemplateId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl = open && isEdit && qcTemplateId ? EP.qc_template_by_id(qcTemplateId) : null;

  const { data: qcTemplate, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawCategories, loading: categoriesLoading } = useGetRequest(
    open ? `${EP.item_category}?pagination=false` : null
  );

  const categoryOptions = useMemo(
    () =>
      sortByLabel(normalizeCollection(rawCategories), (category) => category?.name || 'Unnamed'),
    [rawCategories]
  );

  const [formValues, setFormValues] = useState(createDefaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isEdit) {
      setFormValues(createDefaultFormValues());
    }
  }, [isEdit, open]);

  useEffect(() => {
    if (!open || !isEdit || !qcTemplate?.id) {
      return;
    }

    setFormValues(mapRecordToFormValues(qcTemplate));
  }, [isEdit, open, qcTemplate]);

  const fieldDisabled = submitting || (isEdit && detailLoading);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleChecklistChange = (index, field, value) => {
    setFormValues((current) => ({
      ...current,
      checklist: current.checklist.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      ),
    }));
  };

  const handleAddChecklistItem = () => {
    setFormValues((current) => ({
      ...current,
      checklist: [...current.checklist, createChecklistItem()],
    }));
  };

  const handleRemoveChecklistItem = (index) => {
    setFormValues((current) => {
      const nextChecklist = current.checklist.filter((_, entryIndex) => entryIndex !== index);

      return {
        ...current,
        checklist: nextChecklist.length ? nextChecklist : [createChecklistItem()],
      };
    });
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim()) {
      toast.error('Template name is required.');
      return;
    }

    const checklistPayload = serializeChecklistForPayload(formValues.checklist);

    if (!checklistPayload.length) {
      toast.error('Add at least one checklist item before saving the template.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        category: formValues.category ? Number(formValues.category) : null,
        is_active: Boolean(formValues.is_active),
        checklist: checklistPayload,
      };

      const response = isEdit
        ? await patchRequest(EP.qc_template_by_id(qcTemplateId), payload)
        : await createRequest(EP.qc_templates, payload);

      toast.success(
        isEdit ? 'QC template updated successfully.' : 'QC template created successfully.'
      );
      onSuccess?.(response);
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error?.response?.data || error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={fieldDisabled ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit QC Template' : 'Create QC Template'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Define the checklist that inspection teams will follow for a specific item category, and
            decide which steps are mandatory before stock can move forward.
          </Typography>

          {(categoriesLoading || (isEdit && detailLoading)) && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading QC template lookups...
              </Typography>
            </Stack>
          )}

          {isEdit && detailError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load the selected QC template. Please close the dialog and try again.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Template Name"
                value={formValues.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                disabled={fieldDisabled}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Status"
                value={String(formValues.is_active)}
                onChange={(event) =>
                  handleFieldChange('is_active', normalizeBooleanValue(event.target.value))
                }
                disabled={fieldDisabled}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Category"
                value={formValues.category}
                onChange={(event) => handleFieldChange('category', event.target.value)}
                disabled={fieldDisabled}
              >
                <MenuItem value="">No linked category</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category.id} value={String(category.id)}>
                    {category.name || 'Unnamed category'}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Divider />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={1.5}
            alignItems={{ sm: 'center' }}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                Checklist Design
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Blank rows are ignored on save. Keep mandatory steps for release-critical checks.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleAddChecklistItem}
              disabled={fieldDisabled}
            >
              Add Item
            </Button>
          </Stack>

          <Stack spacing={2}>
            {formValues.checklist.map((entry, index) => (
              <Card
                key={`checklist-${index}`}
                sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}
              >
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                      Checklist Item {index + 1}
                    </Typography>

                    <IconButton
                      color="error"
                      onClick={() => handleRemoveChecklistItem(index)}
                      disabled={fieldDisabled}
                    >
                      <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                    </IconButton>
                  </Stack>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 8 }}>
                      <TextField
                        fullWidth
                        label="Checklist Item"
                        value={entry.item}
                        onChange={(event) =>
                          handleChecklistChange(index, 'item', event.target.value)
                        }
                        disabled={fieldDisabled}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        select
                        label="Requirement"
                        value={String(entry.mandatory)}
                        onChange={(event) =>
                          handleChecklistChange(
                            index,
                            'mandatory',
                            normalizeBooleanValue(event.target.value)
                          )
                        }
                        disabled={fieldDisabled}
                      >
                        <MenuItem value="true">Mandatory</MenuItem>
                        <MenuItem value="false">Optional</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </Stack>
              </Card>
            ))}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={fieldDisabled}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={fieldDisabled || (isEdit && Boolean(detailError))}
        >
          {submitting ? 'Saving...' : isEdit ? 'Update QC Template' : 'Create QC Template'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
