'use client';

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
  DialogContentText,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

const ROLE_LABELS = {
  supervisor: 'Supervisor',
  finance: 'Finance Person',
  management: 'Management Person',
};

export default function SignatureDialog({ open, onClose, onConfirm, role, currentUser, loading }) {
  const roleLabel = ROLE_LABELS[role] || role;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="solar:pen-bold-duotone" />
        Confirm Signature
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ mb: 2, fontWeight: 'bold', color: 'warning.main' }}>
          ⚠️ Attention
        </DialogContentText>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Are you sure you want to sign as <strong>{roleLabel}</strong>?
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Your information that will be recorded:
        </Typography>

        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">
              <strong>Name:</strong> {currentUser?.name || ''}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {currentUser?.email || ''}
            </Typography>
            <Typography variant="body2">
              <strong>Role:</strong> {roleLabel}
            </Typography>
            <Typography variant="body2">
              <strong>Time:</strong> {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Paper>

        <Typography variant="body2" color="error">
          This action cannot be undone.
        </Typography>
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
