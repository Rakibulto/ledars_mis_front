'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Button,
  Dialog,
  MenuItem,
  TextField,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  usePatchRequest as patchRequest,
  useCreateRequest as createRequest,
  useDeleteRequest as deleteRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const INDUSTRY_COLORS = {
  IT: '#3b82f6',
  NGO: '#22c55e',
  Construction: '#f59e0b',
  Production: '#8b5cf6',
  Corporate: '#ec4899',
};

const INDUSTRY_ICONS = {
  IT: 'solar:code-bold-duotone',
  NGO: 'solar:hand-heart-bold-duotone',
  Construction: 'solar:buildings-2-bold-duotone',
  Production: 'solar:factory-bold-duotone',
  Corporate: 'solar:buildings-bold-duotone',
};

export function TemplatesList() {
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // CRUD dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', template_type: '' });

  const { data: rawTemplates } = useGetRequest(EP.templates);
  const TEMPLATES = Array.isArray(rawTemplates) ? rawTemplates : rawTemplates?.results || [];

  const filtered = TEMPLATES.filter((t) => {
    const matchSearch = (t.name || '').toLowerCase().includes(search.toLowerCase());
    const matchIndustry = industry === 'all' || t.industry === industry;
    return matchSearch && matchIndustry;
  });

  const industries = [...new Set(TEMPLATES.map((t) => t.industry).filter(Boolean))];

  const handleCreate = async () => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    try {
      await createRequest(EP.templates, form);
      toast.success('Template created');
      mutate(EP.templates);
      setCreateOpen(false);
      setForm({ name: '', description: '', template_type: '' });
    } catch (err) {
      toast.error(err?.message || 'Failed to create template');
    }
  };

  const handleEdit = async () => {
    if (!form.name) {
      toast.error('Name is required');
      return;
    }
    try {
      await patchRequest(EP.template_by_id(selected.id), {
        name: form.name,
        description: form.description,
      });
      toast.success('Template updated');
      mutate(EP.templates);
      setEditOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to update template');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRequest(EP.template_by_id(selected.id));
      toast.success('Template deleted');
      mutate(EP.templates);
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete template');
    }
  };

  const handleApply = async (t) => {
    try {
      await axiosInstance.post(EP.template_apply(t.id));
      toast.success(`Template "${t.name}" applied successfully`);
    } catch (err) {
      toast.error(err?.message || 'Failed to apply template');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Project Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start quickly with pre-built templates for any industry
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Icon icon="solar:add-circle-bold" />}
          onClick={() => {
            setForm({ name: '', description: '', template_type: '' });
            setCreateOpen(true);
          }}
        >
          Create Template
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="solar:magnifer-linear" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="all">All Industries</MenuItem>
            {industries.map((i) => (
              <MenuItem key={i} value={i}>
                {i}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filtered.map((t) => (
          <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card sx={{ '&:hover': { boxShadow: 6 }, transition: 'box-shadow 0.2s' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${INDUSTRY_COLORS[t.industry] || '#9ca3af'}15`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setSelected(t);
                      setPreviewOpen(true);
                    }}
                  >
                    <Icon
                      icon={INDUSTRY_ICONS[t.industry] || 'solar:document-bold-duotone'}
                      width={24}
                      style={{ color: INDUSTRY_COLORS[t.industry] || '#9ca3af' }}
                    />
                  </Box>
                  <Box
                    sx={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => {
                      setSelected(t);
                      setPreviewOpen(true);
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t.category}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelected(t);
                        setForm({ name: t.name, description: t.description || '' });
                        setEditOpen(true);
                      }}
                      title="Edit"
                    >
                      <Icon icon="solar:pen-bold" width={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelected(t);
                        setDeleteOpen(true);
                      }}
                      title="Delete"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" width={16} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleApply(t)}
                      title="Apply Template"
                    >
                      <Icon icon="solar:play-bold" width={16} />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t.description}
                </Typography>
                <Box
                  sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Chip
                    label={t.industry}
                    size="small"
                    sx={{
                      bgcolor: `${INDUSTRY_COLORS[t.industry] || '#9ca3af'}20`,
                      color: INDUSTRY_COLORS[t.industry] || '#9ca3af',
                      fontWeight: 600,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Used {t.usage_count} times
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selected?.description}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={selected?.industry} size="small" />
            <Chip label={selected?.category} size="small" variant="outlined" />
          </Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            This template includes:
          </Typography>
          <Typography variant="body2">- Pre-configured status workflow</Typography>
          <Typography variant="body2">- Sample tasks and checklists</Typography>
          <Typography variant="body2">- Custom fields for the industry</Typography>
          <Typography variant="body2">- Automation rules</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              handleApply(selected);
              setPreviewOpen(false);
            }}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Template Type"
            value={form.template_type}
            onChange={(e) => setForm({ ...form, template_type: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{selected?.name}&quot;? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
