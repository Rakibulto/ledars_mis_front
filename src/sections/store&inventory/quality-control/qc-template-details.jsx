'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { toast } from 'sonner';
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Chip,
  Grid,
  Alert,
  Stack,
  Button,
  Divider,
  Skeleton,
  Typography,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import QcTemplateFormDialog from './qc-template-form-dialog';
import { renderBooleanChip } from '../shared/inventory-desk-page';
import {
  getTemplateNarrative,
  getTemplateOptionalCount,
  getTemplateChecklistCount,
  getTemplateMandatoryCount,
  normalizeChecklistEntries,
} from './qc-template-shared';

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} color="#0f172a">
        {value || 'N/A'}
      </Typography>
    </Box>
  );
}

export default function QcTemplateDetails() {
  const params = useParams();
  const router = useRouter();
  const qcTemplateId = Array.isArray(params?.qcTemplateId)
    ? params.qcTemplateId[0]
    : params?.qcTemplateId;
  const detailUrl = qcTemplateId ? endpoints.storeInventory.qc_template_by_id(qcTemplateId) : null;

  const { data: qcTemplate, loading, error } = useGetRequest(detailUrl);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('edit');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const checklistItems = useMemo(
    () => normalizeChecklistEntries(qcTemplate?.checklist),
    [qcTemplate?.checklist]
  );
  const checklistCount = getTemplateChecklistCount(qcTemplate);
  const mandatoryCount = getTemplateMandatoryCount(qcTemplate);
  const optionalCount = getTemplateOptionalCount(qcTemplate);

  const handleCreate = () => {
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!qcTemplateId) {
      return;
    }

    try {
      await deleteRequest(endpoints.storeInventory.qc_template_by_id(qcTemplateId));
      toast.success('QC template deleted successfully.');
      await mutate(endpoints.storeInventory.qc_templates);
      router.push(paths.dashboard.storeInventory.qcTemplates);
    } catch (deleteError) {
      toast.error(extractErrorMessage(deleteError?.response?.data || deleteError));
    }
  };

  const handleSuccess = async (record) => {
    await Promise.all([
      mutate(endpoints.storeInventory.qc_templates),
      detailUrl ? mutate(detailUrl) : Promise.resolve(),
      record?.id
        ? mutate(endpoints.storeInventory.qc_template_by_id(record.id))
        : Promise.resolve(),
    ]);

    if (formMode === 'create' && record?.id) {
      router.push(paths.dashboard.storeInventory.qcTemplate_detail(record.id));
    }
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      <Stack spacing={3}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          spacing={2}
          alignItems={{ md: 'center' }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ sm: 'center' }}
          >
            <Button
              component={Link}
              href={paths.dashboard.storeInventory.qcTemplates}
              variant="outlined"
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Back to QC Templates
            </Button>

            <Box>
              <Typography variant="h4" fontWeight={700} color="#0f172a">
                {qcTemplate?.name || 'QC Template Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review template coverage, mandatory steps, and checklist design before teams use it
                in live inspections.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:add-circle-bold-duotone" />}
              onClick={handleCreate}
            >
              Create Template
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={handleEdit}
              disabled={loading || Boolean(error) || !qcTemplate}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteOpen(true)}
              disabled={loading || Boolean(error) || !qcTemplate}
            >
              Delete
            </Button>
            {!loading && !error && qcTemplate && (
              <>
                <Chip
                  size="medium"
                  color="primary"
                  label={qcTemplate.category_name || 'No category'}
                  variant="soft"
                />
                {renderBooleanChip(qcTemplate.is_active, 'Active', 'Inactive')}
              </>
            )}
          </Stack>
        </Stack>

        {loading && (
          <Card sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2.5}>
              <Skeleton variant="text" width="35%" height={42} />
              <Skeleton variant="rounded" height={120} />
              <Skeleton variant="rounded" height={280} />
            </Stack>
          </Card>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            Failed to load the selected QC template. Please try again.
          </Alert>
        )}

        {!loading && !error && qcTemplate && (
          <Stack spacing={3}>
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    {qcTemplate.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {qcTemplate.category_name || 'No category linked'}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip label={`${checklistCount} steps`} color="primary" variant="soft" />
                  <Chip label={`${mandatoryCount} mandatory`} color="warning" variant="soft" />
                  {renderBooleanChip(qcTemplate.is_active, 'Active', 'Inactive')}
                </Stack>
              </Stack>
            </Card>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {qcTemplate.category_name || 'Not linked'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Main inspection scope for this template.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Checklist Items
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {checklistCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total inspection steps included in this template.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Mandatory Steps
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {mandatoryCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Required checks before release or approval.
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="overline" color="text.secondary">
                    Optional Steps
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {optionalCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supplemental checks inspectors can complete when needed.
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', height: '100%' }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Template Context
                  </Typography>

                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Template Name" value={qcTemplate.name} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Category"
                        value={qcTemplate.category_name || 'Not linked'}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Checklist Items" value={String(checklistCount)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Mandatory Steps" value={String(mandatoryCount)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField label="Optional Steps" value={String(optionalCount)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <DetailField
                        label="Status"
                        value={qcTemplate.is_active ? 'Active' : 'Inactive'}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1.5 }}>
                    Checklist Blueprint
                  </Typography>

                  <Stack spacing={1.5}>
                    {checklistItems.length ? (
                      checklistItems.map((entry, index) => (
                        <Card
                          key={`${entry.item}-${index}`}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2.5, borderColor: '#e5e7eb' }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            spacing={1.5}
                          >
                            <Box>
                              <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                                Step {index + 1}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {entry.item}
                              </Typography>
                            </Box>

                            {renderBooleanChip(entry.mandatory, 'Mandatory', 'Optional')}
                          </Stack>
                        </Card>
                      ))
                    ) : (
                      <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        No checklist items are configured for this template yet.
                      </Alert>
                    )}
                  </Stack>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb', mb: 3 }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Recommended Use
                  </Typography>
                  <Alert
                    severity={qcTemplate.is_active ? 'info' : 'warning'}
                    sx={{ borderRadius: 2 }}
                  >
                    {getTemplateNarrative(qcTemplate)}
                  </Alert>
                </Card>

                <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e5e7eb' }}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ mb: 2 }}>
                    Checklist Balance
                  </Typography>

                  <Stack spacing={2}>
                    <DetailField
                      label="Mandatory Coverage"
                      value={`${mandatoryCount} required steps`}
                    />
                    <DetailField
                      label="Optional Coverage"
                      value={`${optionalCount} supplemental steps`}
                    />
                    <DetailField
                      label="Template Status"
                      value={qcTemplate.is_active ? 'Active' : 'Inactive'}
                    />
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Stack>
        )}
      </Stack>

      <QcTemplateFormDialog
        open={formOpen}
        mode={formMode}
        qcTemplateId={formMode === 'edit' ? qcTemplateId : null}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete QC Template"
        content={`Are you sure you want to delete ${qcTemplate?.name || 'this QC template'}?`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
