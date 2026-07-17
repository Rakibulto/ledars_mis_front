'use client';

import { toast } from 'sonner';
import React, { useMemo, useState, useEffect } from 'react';

import {
  Grid,
  Alert,
  Stack,
  Button,
  Dialog,
  MenuItem,
  TextField,
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

import { normalizeCollection } from './quality-team-shared';

const EP = endpoints.storeInventory;

function createDefaultFormValues() {
  return {
    name: '',
    leader: '',
    members: [],
    category: '',
    description: '',
    is_active: true,
  };
}

function mapRecordToFormValues(record) {
  return {
    name: record?.name || '',
    leader: record?.leader ? String(record.leader) : '',
    members: Array.isArray(record?.members) ? record.members.map((member) => String(member)) : [],
    category: record?.category ? String(record.category) : '',
    description: record?.description || '',
    is_active: Boolean(record?.is_active),
  };
}

function sortByLabel(items, getLabel) {
  return [...items].sort((left, right) =>
    getLabel(left).localeCompare(getLabel(right), undefined, { sensitivity: 'base' })
  );
}

function getUserLabel(user) {
  const username = user?.username || 'Unknown user';
  const email = user?.email;

  return email ? `${username} (${email})` : username;
}

function normalizeMultiSelectValue(value) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeBooleanValue(value) {
  if (value === true || value === 'true') {
    return true;
  }

  return false;
}

export default function QualityTeamFormDialog({ open, mode, teamId, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const detailUrl = open && isEdit && teamId ? EP.quality_team_by_id(teamId) : null;

  const { data: team, loading: detailLoading, error: detailError } = useGetRequest(detailUrl);
  const { data: rawUsers, loading: usersLoading } = useGetRequest(
    open ? endpoints.auth.simpleUsers : null
  );
  const { data: rawCategories, loading: categoriesLoading } = useGetRequest(
    open ? `${EP.item_category}?pagination=false` : null
  );

  const userOptions = useMemo(
    () => sortByLabel(normalizeCollection(rawUsers), getUserLabel),
    [rawUsers]
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
    if (!open || !isEdit || !team?.id) {
      return;
    }

    setFormValues(mapRecordToFormValues(team));
  }, [isEdit, open, team]);

  const fieldDisabled = submitting || (isEdit && detailLoading);

  const handleFieldChange = (field, value) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim()) {
      toast.error('Team name is required.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name: formValues.name.trim(),
        leader: formValues.leader ? Number(formValues.leader) : null,
        members: formValues.members.map((memberId) => Number(memberId)),
        category: formValues.category ? Number(formValues.category) : null,
        description: formValues.description.trim() || null,
        is_active: Boolean(formValues.is_active),
      };

      const response = isEdit
        ? await patchRequest(EP.quality_team_by_id(teamId), payload)
        : await createRequest(EP.quality_teams, payload);

      toast.success(
        isEdit ? 'Quality team updated successfully.' : 'Quality team created successfully.'
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
      <DialogTitle>{isEdit ? 'Edit Quality Team' : 'Create Quality Team'}</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Define who leads inspections, which category the team specializes in, and which users
            can be assigned to live quality work.
          </Typography>

          {(usersLoading || categoriesLoading || (isEdit && detailLoading)) && (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading quality team lookups...
              </Typography>
            </Stack>
          )}

          {isEdit && detailError && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Failed to load the selected quality team. Please close the dialog and try again.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Team Name"
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                label="Leader"
                value={formValues.leader}
                onChange={(event) => handleFieldChange('leader', event.target.value)}
                disabled={fieldDisabled}
              >
                <MenuItem value="">No assigned leader</MenuItem>
                {userOptions.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {getUserLabel(user)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                label="Members"
                value={formValues.members}
                onChange={(event) =>
                  handleFieldChange('members', normalizeMultiSelectValue(event.target.value))
                }
                disabled={fieldDisabled}
                helperText="Assign all users who can own inspections and escalation for this team."
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) => {
                    const selectedMembers = normalizeMultiSelectValue(selected);

                    if (!selectedMembers.length) {
                      return 'No members selected';
                    }

                    return selectedMembers
                      .map((memberId) => {
                        const matchedUser = userOptions.find(
                          (user) => String(user.id) === String(memberId)
                        );

                        return matchedUser ? getUserLabel(matchedUser) : memberId;
                      })
                      .join(', ');
                  },
                }}
              >
                {userOptions.map((user) => (
                  <MenuItem key={user.id} value={String(user.id)}>
                    {getUserLabel(user)}
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
                onChange={(event) => handleFieldChange('description', event.target.value)}
                disabled={fieldDisabled}
                helperText="Use the description to explain the team scope, escalation coverage, or inspection specialty."
              />
            </Grid>
          </Grid>
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
          {submitting ? 'Saving...' : isEdit ? 'Update Quality Team' : 'Create Quality Team'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
