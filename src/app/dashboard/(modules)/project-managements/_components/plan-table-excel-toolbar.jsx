'use client';

import { useRef, useState } from 'react';

import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

export function PlanTableExcelToolbar({
  onDownload,
  onUpload,
  downloadLabel = 'Download XLSX',
  uploadLabel = 'Upload XLSX',
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleDownload = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await onDownload?.();
    } catch (downloadError) {
      setError(downloadError?.message || 'Failed to export Excel file.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const message = await onUpload?.(file);
      setSuccess(message || 'Excel file imported successfully.');
    } catch (uploadError) {
      setError(uploadError?.message || 'Failed to import Excel file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={1} alignItems={{ xs: 'stretch', sm: 'flex-end' }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || loading}
          startIcon={
            loading ? <CircularProgress size={14} color="inherit" /> : <Iconify icon="solar:download-bold" width={16} />
          }
          onClick={handleDownload}
        >
          {downloadLabel}
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={disabled || loading}
          startIcon={<Iconify icon="solar:upload-bold" width={16} />}
          onClick={() => inputRef.current?.click()}
        >
          {uploadLabel}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={handleFileChange}
        />
      </Stack>
      {error ? (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      ) : null}
    </Stack>
  );
}
