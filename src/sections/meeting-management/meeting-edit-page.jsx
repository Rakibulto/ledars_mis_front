'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Box, Card, Alert, Skeleton, Typography, CardContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetSimpleEmployees } from 'src/actions/employees';
import { useGetRequest, usePatchRequest, useCreateRequest } from 'src/actions/ledars-hook';

import { MeetingForm } from 'src/sections/meeting-management/meeting-form';

import { useAuthContext } from 'src/auth/hooks';

export default function MeetingEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { employees, employeesLoading } = useGetSimpleEmployees(true);

  useEffect(() => {
    if (!user?.user_permissions_list?.some((p) => p.codename === 'change_meeting')) {
      router.replace(paths.page403);
    }
  }, [user, router]);

  const {
    data: meeting,
    loading: meetingLoading,
    error,
  } = useGetRequest(endpoints.meetingManagement.meetingById(id));

  const initialValues = useMemo(() => {
    if (!meeting) return {};
    return {
      title: meeting.title || '',
      description: meeting.description || '',
      date: meeting.date ? dayjs(meeting.date) : null,
      start_time: meeting.start_time ? dayjs(`2000-01-01T${meeting.start_time}`) : null,
      end_time: meeting.end_time ? dayjs(`2000-01-01T${meeting.end_time}`) : null,
      status: meeting.status || 'scheduled',
      location: meeting.location || '',
      meeting_link: meeting.meeting_link || '',
      agenda: meeting.agenda || '',
      minutes: meeting.minutes || '',
      assigned_to: meeting.assigned_to_ids || [],
    };
  }, [meeting]);

  const formatDate = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val.slice(0, 10);
    if (val.format) return val.format('YYYY-MM-DD');
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val.slice(0, 5);
    if (val.format) return val.format('HH:mm');
    const d = new Date(val);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleUpdate = async (values, files) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        date: formatDate(values.date),
        start_time: formatTime(values.start_time),
        end_time: formatTime(values.end_time),
        assigned_to: values.assigned_to?.length > 0 ? values.assigned_to : [user?.id],
        created_by: user?.id,
      };

      await usePatchRequest(endpoints.meetingManagement.meetingById(id), payload);

      if (files && files.length > 0) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          await useCreateRequest(endpoints.meetingManagement.attachments(id), fd);
        }
      }

      toast.success('Meeting updated successfully');
      mutate(endpoints.meetingManagement.meetings);
      mutate(endpoints.meetingManagement.meetingById(id));

      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
      } else {
        window.close();
      }
    } catch (err) {
      toast.error(err?.message || 'Unable to update meeting.');
    } finally {
      setLoading(false);
    }
  };

  if (meetingLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={360} height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!meeting || error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Meeting not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Edit Meeting
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Update meeting details for {meeting.meeting_id} — {meeting.title}
      </Typography>

      <Card
        sx={{
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #e5e7eb', bgcolor: '#f9fafb' }}>
          <Typography variant="h6" fontWeight={600}>
            Meeting Information
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Changes are saved when you submit the form
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <MeetingForm
            initialValues={initialValues}
            onSubmit={handleUpdate}
            submitLabel={loading ? 'Saving…' : 'Save Changes'}
            employees={employees}
            employeesLoading={employeesLoading}
            currentUser={user}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
