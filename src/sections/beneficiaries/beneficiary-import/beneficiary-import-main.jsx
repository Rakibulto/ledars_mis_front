'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useState } from 'react';

import { Box, Card, Stack, Alert, Button, Typography, LinearProgress } from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.beneficiaries;

export default function BeneficiaryImportMain() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setProgress(10);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      setProgress(30);

      const response = await axiosInstance.post(EP.beneficiaries_database, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProgress(100);
      setResult({
        success: true,
        message: `Import from "${file.name}" completed successfully!`,
        data: response.data,
      });
      toast.success(`Import from "${file.name}" completed successfully!`);
      mutate(EP.beneficiaries_database);
    } catch (err) {
      setResult({ success: false, message: err.message || 'Import failed' });
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Import Beneficiaries
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Import beneficiary data from external systems or files
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Supported formats: CSV, Excel (.xlsx), KoboToolbox export, ODK export. Maximum file size:
        10MB.
      </Alert>

      {result && (
        <Alert severity={result.success ? 'success' : 'error'} sx={{ mb: 3 }}>
          {result.message}
        </Alert>
      )}

      <Card sx={{ p: 4, textAlign: 'center' }}>
        {importing ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Importing data...
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
            <Typography variant="body2" color="text.secondary">
              {progress}% complete
            </Typography>
          </Box>
        ) : (
          <Box>
            <Iconify
              icon="solar:cloud-upload-bold-duotone"
              width={80}
              sx={{ color: 'primary.main', mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Drop files here or click to browse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              CSV, XLSX, or JSON format
            </Typography>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              ref={fileInputRef}
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => fileInputRef.current?.click()}
                startIcon={<Iconify icon="solar:upload-bold" />}
              >
                Select File
              </Button>
            </Stack>
          </Box>
        )}
      </Card>
    </Box>
  );
}
