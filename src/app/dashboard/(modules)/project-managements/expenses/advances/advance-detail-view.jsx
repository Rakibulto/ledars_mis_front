'use client';

import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';

import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Button,
  Divider,
  Skeleton,
  Typography,
  IconButton,
  CardContent,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { useGetAdvance, deleteAdvance } from 'src/actions/advances';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDIUM_LABELS = { cheque: 'Cheque', direct: 'Direct' };
const MEDIUM_COLORS = { cheque: 'info', direct: 'success' };

const CHECK_META = {
  tick: { icon: 'solar:check-circle-bold', color: 'success.main', label: '✓ Tick' },
  cross: { icon: 'solar:close-circle-bold', color: 'error.main', label: '✗ Cross' },
};

const CHECKLIST_LABELS = [
  {
    key: 'check_outstanding',
    label: 'Is there any outstanding refundable advance against the mentioned employee?',
  },
  {
    key: 'check_adjusted',
    label: 'If any advance was taken in the past, was it adjusted/settled timely?',
  },
  {
    key: 'check_completed',
    label: 'Was the work for which the past advance was taken completed properly?',
  },
];

const SIGNATURE_FIELDS = [
  { key: 'signature_recipient', label: 'Advance Recipient' },
  { key: 'signature_accountant', label: 'Accountant' },
  { key: 'signature_recommender', label: 'Recommender' },
  { key: 'signature_approver', label: 'Approver' },
];

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, mt: 1 }}>
      <Typography variant="subtitle1" fontWeight={700}>
        {children}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Stack>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider', gap: 2 }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 200, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        fontWeight={500}
        textAlign="right"
        sx={{ wordBreak: 'break-word' }}
      >
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdvanceDetailView() {
  const { id } = useParams();
  const router = useRouter();
  const confirm = useBoolean();

  const { advance, advanceLoading, advanceError } = useGetAdvance(id);

  const handleDelete = async () => {
    try {
      await deleteAdvance(id);
      toast.success('Advance deleted successfully');
      router.push(paths.dashboard.projectManagements.expenses.advances.root);
    } catch {
      toast.error('Failed to delete advance.');
    } finally {
      confirm.onFalse();
    }
  };

  // DRF with request context returns absolute URLs for ImageFields.
  // If the URL is somehow relative, prepend the backend origin.
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_HOST_API || 'http://127.0.0.1:8000'}${url}`;
  };

  if (advanceLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!advance || advanceError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Advance record not found or an error occurred.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          mb: 2,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <CardContent sx={{ p: '18px 24px !important' }}>
          <Stack direction="row" alignItems="flex-start" spacing={2} flexWrap="wrap" gap={1}>
            <IconButton
              component={RouterLink}
              href={paths.dashboard.projectManagements.expenses.advances.root}
              sx={{ mt: 0.25, flexShrink: 0 }}
            >
              <Iconify icon="solar:arrow-left-bold" width={20} />
            </IconButton>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                flexWrap="wrap"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="h5" fontWeight={700} noWrap>
                  {advance.from_employee_name || 'Unknown Employee'}
                </Typography>
                <Label variant="soft" color={MEDIUM_COLORS[advance.receive_medium] || 'default'}>
                  {MEDIUM_LABELS[advance.receive_medium] || advance.receive_medium}
                </Label>
              </Stack>
              <Stack direction="row" spacing={2.5} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">
                  {advance.project_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ৳
                  {parseFloat(advance.advance_receivable_amount || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(advance.created_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
              onClick={confirm.onTrue}
            >
              Delete
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* ── DETAIL CONTENT ─────────────────────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          {/* Section 1: Advance Request */}
          <SectionTitle>Advance Request</SectionTitle>
          <Grid container spacing={0} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
              <DetailRow label="Employee" value={advance.from_employee_name} />
              <DetailRow label="Project" value={advance.project_title} />
              <DetailRow label="Cause of Advance" value={advance.cause_of_advance} />
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                pl: { md: 3 },
                borderLeft: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              {advance.from_text && <DetailRow label="From Details" value={advance.from_text} />}
              {advance.to_text && <DetailRow label="To" value={advance.to_text} />}
            </Grid>
          </Grid>

          {/* Section 2: Financial Details */}
          <SectionTitle>Details of Advance</SectionTitle>
          <Grid container spacing={0} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
              <DetailRow label="Advance Receivable Date" value={advance.advance_receivable_date} />
              <DetailRow
                label="Advance Receivable Amount"
                value={`৳${parseFloat(advance.advance_receivable_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
              />
              <DetailRow label="Amount in Words" value={advance.amount_in_words} />
              <DetailRow label="Expected Date" value={advance.expected_date} />
            </Grid>
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                pl: { md: 3 },
                borderLeft: { md: '1px solid' },
                borderColor: { md: 'divider' },
              }}
            >
              <DetailRow
                label="Receive Medium"
                value={
                  <Label variant="soft" color={MEDIUM_COLORS[advance.receive_medium] || 'default'}>
                    {MEDIUM_LABELS[advance.receive_medium] || advance.receive_medium}
                  </Label>
                }
              />
              {advance.receive_medium === 'cheque' && (
                <>
                  <DetailRow label="Bank Name" value={advance.bank_name} />
                  <DetailRow label="Cheque No" value={advance.cheque_no} />
                </>
              )}
              {advance.accountant_remarks && (
                <DetailRow label="Accountant Remarks" value={advance.accountant_remarks} />
              )}
            </Grid>
          </Grid>

          {/* Section 3: Checklist */}
          <SectionTitle>Advance Checklist</SectionTitle>
          <Card
            variant="outlined"
            sx={{ borderRadius: 2, border: '1px solid #e5e7eb', mb: 3, overflow: 'hidden' }}
          >
            {CHECKLIST_LABELS.map(({ key, label }) => {
              const val = advance[key];
              const meta = CHECK_META[val];
              return (
                <Stack
                  key={key}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    py: 1.75,
                    px: 2.5,
                    borderBottom: '1px solid #f3f4f6',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Typography variant="body2" sx={{ flex: 1, pr: 3 }}>
                    {label}
                  </Typography>
                  {meta ? (
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Iconify icon={meta.icon} width={20} sx={{ color: meta.color }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: meta.color }}>
                        {meta.label}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      Not marked
                    </Typography>
                  )}
                </Stack>
              );
            })}
          </Card>

          {/* Section 4: Signatures */}
          <SectionTitle>Signatures</SectionTitle>
          <Grid container spacing={2}>
            {SIGNATURE_FIELDS.map(({ key, label }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={key}>
                <Box
                  sx={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 2,
                    p: 2,
                    textAlign: 'center',
                    minHeight: 180,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    bgcolor: '#fafafa',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {label}
                  </Typography>
                  {advance[key] ? (
                    <Box
                      component="img"
                      src={resolveUrl(advance[key])}
                      alt={label}
                      sx={{
                        maxHeight: 110,
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid #e5e7eb',
                        flex: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        border: '2px dashed #d1d5db',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.disabled">
                        No signature
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ width: '100%' }} />
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete Advance"
        content="Are you sure you want to delete this advance record? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
