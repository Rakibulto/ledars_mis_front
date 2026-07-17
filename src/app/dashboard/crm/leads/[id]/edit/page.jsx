'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Box, Card, Alert, Skeleton, Typography, CardContent } from '@mui/material';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetSimpleEmployees } from 'src/actions/employees';
import { useGetRequest, usePutRequest } from 'src/actions/ledars-hook';

import { LeadForm } from 'src/sections/crm/lead-form';

import { useAuthContext } from 'src/auth/hooks';

export default function EditLeadPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuthContext();
  const { employees, employeesLoading } = useGetSimpleEmployees(true);

  useEffect(() => {
    if (!user?.user_permissions_list?.some((p) => p.codename === 'change_lead')) {
      router.replace(paths.page403);
    }
  }, [user, router]);

  const { data: lead, loading: leadLoading, error } = useGetRequest(endpoints.crm.leadById(id));

  const initialValues = useMemo(() => {
    if (!lead) return {};
    return {
      ...lead,
      assigned_to: lead.assigned_to || '',
    };
  }, [lead]);

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        created_by: user?.id,
        assigned_to: values.assigned_to || user?.id,
      };
      delete payload.lead_id;
      delete payload.created_at;
      delete payload.updated_at;
      await usePutRequest(endpoints.crm.leadById(id), payload);
      toast.success('Lead updated successfully');
      mutate(endpoints.crm.leads);
      mutate(endpoints.crm.leadById(id));
      router.push(paths.dashboard.crm.leads.detail(id));
    } catch (error) {
      toast.error(error?.message || 'Unable to update lead.');
    } finally {
      setLoading(false);
    }
  };

  if (leadLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={360} height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!lead || error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Lead not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Edit Lead
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Update lead details for {lead.lead_id} — {lead.name}
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
            Changes are saved when you submit the form
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <LeadForm
            initialValues={initialValues}
            onSubmit={handleUpdate}
            submitLabel={loading ? 'Saving...' : 'Save Changes'}
            employees={employees}
            employeesLoading={employeesLoading}
            currentUser={user}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
