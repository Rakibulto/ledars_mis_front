'use client';

import Alert from '@mui/material/Alert';
import {
  Box,
  Paper,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import { CONFIG } from 'src/config-global';

import { Iconify } from 'src/components/iconify';

const SIGN_ROLES = {
  prepared_by: 'Prepared By',
  reviewed_by: 'Reviewed By',
  finance_by: 'Finance By',
  approved_by: 'Approved By',
};

function getFullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (CONFIG.serverUrl || '').replace(/\/+$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export default function PerdiumSignatureDialog({
  open,
  onClose,
  onConfirm,
  role,
  currentUser,
  employeeData,
  loading,
}) {
  const roleLabel = SIGN_ROLES[role] || role;
  const signatureImage = employeeData?.signature_image;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="solar:pen-bold-duotone" />
        Confirm Signature — {roleLabel}
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You are about to sign as <strong>{roleLabel}</strong>. This cannot be undone.
        </Alert>

        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {currentUser?.name || currentUser?.displayName || ''}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {currentUser?.email || ''}
            </Typography>
            <Typography variant="body2">
              <strong>Signature:</strong>
            </Typography>
            {signatureImage ? (
              <Box
                component="img"
                src={getFullUrl(signatureImage)}
                alt="Signature"
                sx={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', mt: 0.5 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No signature on file
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Date & Time:</strong> {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={16} /> : <Iconify icon="solar:pen-bold-duotone" />
          }
        >
          Yes, Sign
        </Button>
      </DialogActions>
    </Dialog>
  );
}
