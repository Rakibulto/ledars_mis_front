'use client';

import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

import {
  Box,
  Stack,
  Table,
  alpha,
  Dialog,
  Button,
  Divider,
  TableRow,
  useTheme,
  TableBody,
  TableCell,
  TableHead,
  IconButton,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

function formatLong(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_LABEL = {
  draft: 'Draft',
  pending: 'Pending',
  hold: 'On Hold',
  completed: 'Completed',
};

export default function PrintPreviewDialog({ open, onClose, todo }) {
  const theme = useTheme();
  const contentRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: todo?.todo_title || 'Todo Report',
  });

  if (!todo) return null;

  const participants = [
    {
      name: todo.creator_name,
      email: todo.creator_email,
      role: 'Creator',
      count: todo.creator_attachments_count || 0,
    },
    ...(todo.assigned_users || []).map((u) => ({
      name: u.name,
      email: u.email,
      role: 'Assigned',
      count: u.attachments_count || 0,
    })),
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                color: 'primary.main',
              }}
            >
              <Iconify icon="solar:printer-bold" width={22} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                Print Preview
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Review before sending to printer
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ borderRadius: 1.5 }}>
            <Iconify icon="solar:close-circle-bold" width={20} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          bgcolor: 'grey.100',
          py: 4,
          px: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            maxWidth: 760,
            mx: 'auto',
            bgcolor: '#fff',
            borderRadius: 1,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          }}
        >
          <Box ref={contentRef} sx={{ p: { xs: 3, sm: 6 }, color: '#1a1a1a' }}>
            <style>{`
              @page { size: A4; margin: 16mm; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            `}</style>

            <Typography
              variant="overline"
              sx={{ color: '#6b6b6b', letterSpacing: 1.5, fontSize: 11 }}
            >
              Todo Report
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5, mb: 1, color: '#111' }}>
              {todo.todo_title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
              <Box
                sx={{
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '20px',
                  border: '1px solid #ccc',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#333',
                }}
              >
                {STATUS_LABEL[todo.status] || todo.status}
              </Box>
              <Typography variant="caption" sx={{ color: '#777' }}>
                Generated {formatLong(new Date().toISOString())}
              </Typography>
            </Stack>

            <Divider sx={{ borderColor: '#ddd', mb: 3 }} />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Created By
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {todo.creator_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#888' }}>
                  {todo.creator_email}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Created On
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatLong(todo.created_at)}
                </Typography>
              </Box>
              {todo.expected_date && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    Expected Date
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatLong(todo.expected_date)}
                  </Typography>
                </Box>
              )}
            </Box>

            {todo.description && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Description
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: '#222',
                    '& p': { my: 0.5 },
                  }}
                  dangerouslySetInnerHTML={{ __html: todo.description }}
                />
              </Box>
            )}

            <Divider sx={{ borderColor: '#ddd', mb: 2 }} />

            <Typography
              variant="caption"
              sx={{ color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              Participants
            </Typography>
            <Table size="small" sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  {['Name', 'Email', 'Role', 'Updates'].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: '#555',
                        borderColor: '#ddd',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p, idx) => (
                  <TableRow key={`${p.email}-${idx}`}>
                    <TableCell sx={{ fontSize: 13, borderColor: '#eee' }}>{p.name}</TableCell>
                    <TableCell sx={{ fontSize: 13, borderColor: '#eee', color: '#555' }}>
                      {p.email}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, borderColor: '#eee' }}>{p.role}</TableCell>
                    <TableCell sx={{ fontSize: 13, borderColor: '#eee' }}>{p.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ mt: 5, pt: 2, borderTop: '1px solid #eee' }}>
              <Typography variant="caption" sx={{ color: '#aaa' }}>
                This report was generated automatically from the Todo Management system.
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={() => handlePrint()}
          startIcon={<Iconify icon="solar:printer-bold" width={18} />}
          sx={{ borderRadius: 2 }}
        >
          Print
        </Button>
      </DialogActions>
    </Dialog>
  );
}
