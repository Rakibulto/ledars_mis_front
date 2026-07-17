'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Avatar,
  Dialog,
  Button,
  Typography,
  IconButton,
  CardContent,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

const EP = endpoints.pm;

const TYPE_ICONS = {
  space: 'solar:folder-with-files-bold-duotone',
  list: 'solar:checklist-bold-duotone',
  doc: 'solar:document-bold-duotone',
  view: 'solar:eye-bold-duotone',
  task: 'solar:clipboard-check-bold-duotone',
  dashboard: 'solar:chart-square-bold-duotone',
};

const TYPE_COLORS = {
  space: '#3b82f6',
  list: '#8b5cf6',
  doc: '#06b6d4',
  view: '#f59e0b',
  task: '#22c55e',
  dashboard: '#ec4899',
};

function FavoritesPage() {
  const { data: rawFavorites } = useGetRequest(EP.favorites);
  const RAW = Array.isArray(rawFavorites) ? rawFavorites : rawFavorites?.results || [];

  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const items = RAW;

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(EP.favorite_by_id(deleteId));
      mutate(EP.favorites);
      toast.success('Removed from favorites');
      setDeleteId(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to remove favorite');
    } finally {
      setSaving(false);
    }
  };

  const grouped = {};
  items.forEach((f) => {
    if (!grouped[f.type]) grouped[f.type] = [];
    grouped[f.type].push(f);
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Favorites
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quick access to your starred items
        </Typography>
      </Box>

      {Object.entries(grouped).map(([type, groupItems]) => (
        <Box key={type} sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1, textTransform: 'capitalize' }}
          >
            {type}s ({groupItems.length})
          </Typography>
          <Grid container spacing={2}>
            {groupItems.map((f) => (
              <Grid key={f.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s',
                  }}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: `${TYPE_COLORS[f.type]}20`,
                        color: TYPE_COLORS[f.type],
                        width: 40,
                        height: 40,
                      }}
                    >
                      <Icon icon={TYPE_ICONS[f.type] || 'solar:star-bold'} width={20} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {f.name}
                      </Typography>
                      <Chip
                        label={f.type}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.65rem',
                          textTransform: 'capitalize',
                          bgcolor: `${TYPE_COLORS[f.type]}15`,
                          color: TYPE_COLORS[f.type],
                        }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteId(f.id)}
                      sx={{ color: '#f59e0b' }}
                    >
                      <Icon icon="solar:star-bold" width={18} />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {items.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Icon icon="solar:star-bold-duotone" width={48} style={{ color: '#f59e0b' }} />
          <Typography variant="body1" sx={{ mt: 1 }}>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Star items from tasks, spaces, docs, and more for quick access.
          </Typography>
        </Box>
      )}

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove Favorite</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this from favorites?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FavoritesPage;
