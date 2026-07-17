'use client';

import {
  Dialog,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  DialogContentText,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

export default function DeleteConfirmDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Iconify icon="solar:trash-bin-trash-bold-duotone" color="error.main" />
        Delete Movement
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this movement record? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <Iconify icon="solar:trash-bin-trash-bold-duotone" />
            )
          }
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
