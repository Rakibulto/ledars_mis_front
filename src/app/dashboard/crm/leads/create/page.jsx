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

import { LeadForm } from 'src/sections/crm/lead-form';

import { useAuthContext } from 'src/auth/hooks';

export default function CreateLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { employees, employeesLoading } = useGetSimpleEmployees(true);

  useEffect(() => {
    if (!user?.user_permissions_list?.some((p) => p.codename === 'add_lead')) {
      router.replace(paths.page403);
    }
  }, [user, router]);

  const handleCreate = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        created_by: user?.id,
        assigned_to: values.assigned_to || user?.id,
      };
      await useCreateRequest(endpoints.crm.leads, payload);
      toast.success('Lead created successfully');
      mutate(endpoints.crm.leads);
      if (window.opener && !window.opener.closed) {
        window.opener.focus();
      }
      window.close();
    } catch (error) {
      toast.error(error?.message || 'Unable to create lead.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Create Lead
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Register a new sales lead with customer and project information
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
            Lead Information
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Fields marked with * are required
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <LeadForm
            onSubmit={handleCreate}
            submitLabel={loading ? 'Saving...' : 'Create Lead'}
            employees={employees}
            employeesLoading={employeesLoading}
            currentUser={user}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
