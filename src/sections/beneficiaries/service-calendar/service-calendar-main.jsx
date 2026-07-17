'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Button,
  Dialog,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

const EP = endpoints.beneficiaries;

const EVENT_COLORS = {
  Distribution: 'primary',
  Health: 'success',
  Training: 'info',
  Assessment: 'warning',
};

const EVENT_ICONS = {
  Distribution: 'solar:box-bold',
  Health: 'solar:heart-pulse-bold',
  Training: 'solar:book-bold',
  Assessment: 'solar:clipboard-bold',
};

const INITIAL_FORM = {
  title: '',
  type: 'Distribution',
  status: 'Scheduled',
  date: '',
  location: '',
  beneficiaries: '',
};

export default function ServiceCalendarMain() {
  const { data: rawData, loading } = useGetRequest(EP.service_calendar);
  const SERVICE_CALENDAR = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const createDialog = useBoolean();
  const editDialog = useBoolean();
  const confirm = useBoolean();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    try {
      await axiosInstance.post(EP.service_calendar, formData);
      toast.success('Event created');
      mutate(EP.service_calendar);
      createDialog.onFalse();
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error('Failed to create event');
    }
  }, [formData, createDialog]);

  const handleEdit = (event) => {
    setEditingItem(event);
    setFormData({
      title: event.title || '',
      type: event.type || 'Distribution',
      status: event.status || 'Scheduled',
      date: event.date || '',
      location: event.location || '',
      beneficiaries: event.beneficiaries || '',
    });
    editDialog.onTrue();
  };

  const handleEditSubmit = useCallback(async () => {
    try {
      await axiosInstance.patch(`${EP.service_calendar}${editingItem.id}/`, formData);
      toast.success('Event updated');
      mutate(EP.service_calendar);
      editDialog.onFalse();
      setEditingItem(null);
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error('Failed to update event');
    }
  }, [formData, editDialog, editingItem]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await axiosInstance.delete(`${EP.service_calendar}${deleteId}/`);
      toast.success('Event deleted');
      mutate(EP.service_calendar);
    } catch (err) {
      toast.error('Failed to delete event');
    }
    confirm.onFalse();
  }, [deleteId, confirm]);

  const groupedByDate = useMemo(() => {
    const groups = {};
    SERVICE_CALENDAR.forEach((event) => {
      if (!groups[event.date]) groups[event.date] = [];
      groups[event.date].push(event);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [SERVICE_CALENDAR]);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Service Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Schedule of upcoming service delivery activities and events
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={createDialog.onTrue}
        >
          Add Event
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {groupedByDate.map(([date, events]) => (
          <Grid size={{ xs: 12 }} key={date}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
            <Grid container spacing={2}>
              {events.map((event) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
                  <Card sx={{ p: 2.5, height: '100%' }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: `${EVENT_COLORS[event.type] || 'primary'}.lighter`,
                        }}
                      >
                        <Iconify
                          icon={EVENT_ICONS[event.type] || 'solar:calendar-bold'}
                          width={28}
                          sx={{ color: `${EVENT_COLORS[event.type] || 'primary'}.main` }}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Typography variant="subtitle2">{event.title}</Typography>
                          <Stack direction="row" spacing={0.5}>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleEdit(event)}
                            >
                              <Iconify icon="solar:pen-bold" width={16} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setDeleteId(event.id);
                                confirm.onTrue();
                              }}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                            </IconButton>
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip
                            label={event.type}
                            size="small"
                            color={EVENT_COLORS[event.type] || 'default'}
                          />
                          <Chip label={event.status} size="small" variant="outlined" />
                        </Stack>
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            <Iconify
                              icon="solar:map-point-bold"
                              width={14}
                              sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                            />
                            {event.location}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <Iconify
                              icon="solar:users-group-rounded-bold"
                              width={14}
                              sx={{ mr: 0.5, verticalAlign: 'text-bottom' }}
                            />
                            {event.beneficiaries} beneficiaries
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        ))}
      </Grid>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Event"
        content="Are you sure you want to delete this event?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
            Delete
          </Button>
        }
      />

      {[
        {
          open: createDialog.value,
          onClose: createDialog.onFalse,
          title: 'Add Event',
          onSubmit: handleCreateSubmit,
          btnLabel: 'Create',
        },
        {
          open: editDialog.value,
          onClose: editDialog.onFalse,
          title: 'Edit Event',
          onSubmit: handleEditSubmit,
          btnLabel: 'Update',
        },
      ].map((dlg) => (
        <Dialog key={dlg.title} open={dlg.open} onClose={dlg.onClose} fullWidth maxWidth="sm">
          <DialogTitle>{dlg.title}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleFormChange}
              />
              <Select
                fullWidth
                displayEmpty
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                <MenuItem value="Distribution">Distribution</MenuItem>
                <MenuItem value="Health">Health</MenuItem>
                <MenuItem value="Training">Training</MenuItem>
                <MenuItem value="Assessment">Assessment</MenuItem>
              </Select>
              <Select
                fullWidth
                displayEmpty
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleFormChange}
              />
              <TextField
                fullWidth
                label="Beneficiaries Count"
                name="beneficiaries"
                type="number"
                value={formData.beneficiaries}
                onChange={handleFormChange}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="inherit" onClick={dlg.onClose}>
              Cancel
            </Button>
            <Button variant="contained" onClick={dlg.onSubmit}>
              {dlg.btnLabel}
            </Button>
          </DialogActions>
        </Dialog>
      ))}
    </Box>
  );
}
