'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Box, Card, Typography, CardContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useCreateRequest } from 'src/actions/ledars-hook';
import { useGetSimpleEmployees } from 'src/actions/employees';

import { MeetingForm } from 'src/sections/meeting-management/meeting-form';

import { useAuthContext } from 'src/auth/hooks';

export default function MeetingCreatePage() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { employees, employeesLoading } = useGetSimpleEmployees(true);
  const router = useRouter();

  useEffect(() => {
    if (!user?.user_permissions_list?.some((p) => p.codename === 'add_meeting')) {
      router.replace(paths.page403);
    }
  }, [user, router]);

  const formatDate = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val.slice(0, 10);
    if (val.format) return val.format('YYYY-MM-DD');
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatTime = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    // dayjs object
    if (val.format) return val.format('HH:mm');
    // JS Date fallback
    const d = new Date(val);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleCreate = async (values, files) => {
    setLoading(true);
    console.log('date value:', values.date, typeof values.date);
    try {
      const payload = {
        ...values,
        date: formatDate(values.date),
        start_time: formatTime(values.start_time),
        end_time: formatTime(values.end_time),
        created_by: user?.id,
        assigned_to: values.assigned_to?.length > 0 ? values.assigned_to : [user?.id],
      };

      const newMeeting = await useCreateRequest(endpoints.meetingManagement.meetings, payload);

      if (files && files.length > 0) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          await useCreateRequest(endpoints.meetingManagement.attachments(newMeeting.id), fd);
        }
      }

      toast.success('Meeting created successfully');
      mutate(endpoints.meetingManagement.meetings);

      if (window.opener && !window.opener.closed) {
        window.opener.focus();
        window.close();
      } else {
        router.push('/dashboard/meeting-management/list/');
      }
    } catch (error) {
      toast.error(error?.message || 'Unable to create meeting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Create Meeting
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Schedule a new meeting with team members
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
            Fields marked with * are required
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <MeetingForm
            onSubmit={handleCreate}
            submitLabel={loading ? 'Saving…' : 'Create Meeting'}
            employees={employees}
            employeesLoading={employeesLoading}
            currentUser={user}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
