'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { endpoints } from 'src/utils/axios';

import { usePatchRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { MEETING_STATUS_COLORS, MEETING_STATUS_OPTIONS } from './constants';

// ----------------------------------------------------------------------

export function MeetingQuickEditForm({
  currentMeeting,
  open,
  onClose,
  addEntry,
  readOnly = false,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    status: 'scheduled',
    location: '',
    meeting_link: '',
    agenda: '',
    minutes: '',
  });

  useEffect(() => {
    console.log('currentMeeting:', currentMeeting);
    if (currentMeeting) {
      setFormData({
        title: currentMeeting.title || '',
        description: currentMeeting.description || '',
        date: currentMeeting.date || '',
        start_time: currentMeeting.start_time ? currentMeeting.start_time.slice(0, 5) : '',
        end_time: currentMeeting.end_time ? currentMeeting.end_time.slice(0, 5) : '',
        status: currentMeeting.status || 'scheduled',
        location: currentMeeting.location || '',
        meeting_link: currentMeeting.meeting_link || '',
        agenda: currentMeeting.agenda || '',
        minutes: currentMeeting.minutes || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        start_time: '',
        end_time: '',
        status: 'scheduled',
        location: '',
        meeting_link: '',
        agenda: '',
        minutes: '',
      });
    }
  }, [currentMeeting]);

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async () => {
    try {
      await usePatchRequest(endpoints.meetingManagement.meetingById(currentMeeting.id), formData);
      toast.success('Meeting updated successfully');
      mutate(endpoints.meetingManagement.meetings);
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Unable to update meeting.');
    }
  };

  const handleDelete = async () => {
    try {
      await useDeleteRequest(endpoints.meetingManagement.meetingById(currentMeeting.id));
      toast.success('Meeting deleted successfully');
      mutate(endpoints.meetingManagement.meetings);
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Unable to delete meeting.');
    }
  };

  const getStatusColor = (status) => MEETING_STATUS_COLORS[status] || 'default';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          {addEntry ? 'New Meeting' : 'Edit Meeting'}
        </Typography>
        {!addEntry && currentMeeting && (
          <Label variant="soft" color={getStatusColor(currentMeeting.status)}>
            {currentMeeting.status}
          </Label>
        )}
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Meeting Title"
            fullWidth
            value={formData.title}
            onChange={handleChange('title')}
            required
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={handleChange('description')}
          />

          <TextField
            label="Date"
            type="date"
            fullWidth
            value={formData.date}
            onChange={handleChange('date')}
            InputLabelProps={{ shrink: true }}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Start Time"
              type="time"
              fullWidth
              value={formData.start_time}
              onChange={handleChange('start_time')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Time"
              type="time"
              fullWidth
              value={formData.end_time}
              onChange={handleChange('end_time')}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={formData.status} label="Status" onChange={handleChange('status')}>
              {MEETING_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Location"
            fullWidth
            value={formData.location}
            onChange={handleChange('location')}
          />

          <TextField
            label="Meeting Link"
            fullWidth
            value={formData.meeting_link}
            onChange={handleChange('meeting_link')}
            placeholder="https://..."
          />

          <TextField
            label="Agenda"
            fullWidth
            multiline
            rows={3}
            value={formData.agenda}
            onChange={handleChange('agenda')}
          />

          <TextField
            label="Minutes"
            fullWidth
            multiline
            rows={3}
            value={formData.minutes}
            onChange={handleChange('minutes')}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, gap: 1 }}>
        {!addEntry && (
          <Button variant="outlined" color="error" onClick={handleDelete} sx={{ mr: 'auto' }}>
            Delete
          </Button>
        )}
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            {addEntry ? 'Create' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
