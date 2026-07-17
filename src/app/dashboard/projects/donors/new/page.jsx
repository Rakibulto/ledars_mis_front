'use client';

import { useState } from 'react';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Box, Card, CardContent, Typography } from '@mui/material';

import { endpoints } from 'src/utils/axios';
import { useCreateRequest } from 'src/actions/ledars-hook';
import { DonorForm, buildFormData } from 'src/sections/projects/donors/donor-form';

export default function DonorCreatePage() {
  const [loading, setLoading] = useState(false);

  const handleCreate = async (values) => {
    setLoading(true);
    try {
      await useCreateRequest(endpoints.projectManagements.donors, buildFormData(values));
      toast.success('Donor created successfully');
      mutate(endpoints.projectManagements.donors);

      if (window.opener && !window.opener.closed) {
        window.opener.focus();
      }

      window.setTimeout(() => {
        window.close();
      }, 400);
    } catch (error) {
      toast.error(error?.message || 'Unable to create donor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Add New Donor
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Register a new donor profile with contact, donation, and identification details
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
            Fields marked with validation rules are required on submit
          </Typography>
        </Box>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <DonorForm onSubmit={handleCreate} submitLabel={loading ? 'Saving...' : 'Create Donor'} />
        </CardContent>
      </Card>
    </Box>
  );
}
