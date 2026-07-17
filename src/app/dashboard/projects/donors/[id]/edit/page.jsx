'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import { Box, Card, Alert, Skeleton, Typography, CardContent } from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, usePutRequest } from 'src/actions/ledars-hook';

import { DonorForm, buildFormData } from 'src/sections/projects/donors/donor-form';

export default function DonorEditPage() {
  const { id } = useParams();
  const EP = endpoints.projectManagements;
  const { data: donor, loading } = useGetRequest(EP.donorById(id));

  const initialValues = useMemo(
    () => ({
      ...donor,
    }),
    [donor]
  );

  const handleUpdate = async (values) => {
    try {
      await usePutRequest(EP.donorById(id), buildFormData(values));
      toast.success('Donor updated successfully');
      mutate(EP.donors);
      mutate(EP.donorById(id));
      window.close();
    } catch (error) {
      toast.error(error?.message || 'Unable to update donor.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={240} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={360} height={24} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={480} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!donor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Donor not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Edit Donor
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Update profile details for {donor.name}
        {donor.donor_code ? ` · ${donor.donor_code}` : ''}
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
            Donor Information
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Changes are saved when you submit the form
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <DonorForm
            initialValues={initialValues}
            onSubmit={handleUpdate}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </Box>
  );
}
