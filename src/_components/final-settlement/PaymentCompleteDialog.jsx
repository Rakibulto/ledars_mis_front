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

export default function PaymentCompleteDialog({ open, onClose, onConfirm, loading }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Payment Completion</DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to mark this settlement as Payment Completed?
          <br />
          This action is final and cannot be reversed.
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          No, Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          Yes, Mark Completed
        </Button>
      </DialogActions>
    </Dialog>
  );
}
