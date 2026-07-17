'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Button,
  MenuItem,
  TextField,
  Typography,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

export function DocCreate() {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', space_id: '', content: '' });

  const { data: rawSpaces } = useGetRequest(EP.spaces);
  const SPACES = Array.isArray(rawSpaces) ? rawSpaces : rawSpaces?.results || [];

  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title) {
      toast.error('Document title is required');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post(EP.docs, {
        title: form.title,
        content: form.content,
        space: form.space_id || null,
      });
      const { mutate } = await import('swr');
      mutate(EP.docs);
      toast.success(`Document "${form.title}" created successfully!`);
      router.push(paths.dashboard.projectManagement.docs.root);
    } catch (err) {
      toast.error(err?.message || 'Failed to create document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Create Document
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <TextField
                fullWidth
                label="Document Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Untitled document..."
              />
              <TextField
                fullWidth
                multiline
                rows={20}
                placeholder="Start writing your document..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                Settings
              </Typography>
              <TextField
                fullWidth
                select
                label="Space"
                value={form.space_id}
                onChange={(e) => setForm({ ...form, space_id: e.target.value })}
                sx={{ mb: 2 }}
              >
                {SPACES.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={saving}
                  startIcon={<Icon icon="solar:check-circle-bold" />}
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </Button>
                <Button variant="outlined" fullWidth onClick={() => router.back()}>
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
