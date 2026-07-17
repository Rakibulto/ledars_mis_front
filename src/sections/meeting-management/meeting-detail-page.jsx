'use client';

import dayjs from 'dayjs';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  pdf,
  View,
  Text,
  Document,
  Page as PdfPage,
  StyleSheet as PdfStyleSheet,
} from '@react-pdf/renderer';

import {
  Box,
  Card,
  Grid,
  Stack,
  Alert,
  Avatar,
  Button,
  Tooltip,
  Skeleton,
  Typography,
  IconButton,
  CardContent,
  AvatarGroup,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

const ps = PdfStyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  headerBlock: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
  },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', marginBottom: 3, color: '#111' },
  docSubtitle: { fontSize: 10, color: '#777' },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#888',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e8e8e8',
    borderBottomStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    borderBottomStyle: 'solid',
  },
  rowLabel: { width: '38%', color: '#666' },
  rowValue: { flex: 1, fontFamily: 'Helvetica-Bold' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#bbb',
    borderTopWidth: 0.5,
    borderTopColor: '#e0e0e0',
    borderTopStyle: 'solid',
    paddingTop: 8,
  },
});

function MeetingPdfDocument({ meeting }) {
  const rows = (pairs) =>
    pairs
      .filter(([, v]) => v)
      .map(([label, value]) => (
        <View key={label} style={ps.row}>
          <Text style={ps.rowLabel}>{label}</Text>
          <Text style={ps.rowValue}>{value}</Text>
        </View>
      ));

  const assignedNames = meeting.assigned_to?.map((u) => u.name).join(', ') || 'Unassigned';

  return (
    <Document>
      <PdfPage size="A4" style={ps.page}>
        <View style={ps.headerBlock}>
          <Text style={ps.docTitle}>Meeting Report</Text>
          <Text style={ps.docSubtitle}>
            {meeting.meeting_id} · {meeting.title} · Generated {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View style={ps.section}>
          <Text style={ps.sectionTitle}>MEETING INFORMATION</Text>
          {rows([
            ['Meeting ID', meeting.meeting_id],
            ['Title', meeting.title],
            ['Description', meeting.description],
            ['Date', meeting.date ? dayjs(meeting.date).format('dddd, MMMM D, YYYY') : '—'],
            [
              'Start Time',
              meeting.start_time ? dayjs(meeting.start_time, 'HH:mm:ss').format('hh:mm A') : '—',
            ],
            [
              'End Time',
              meeting.end_time ? dayjs(meeting.end_time, 'HH:mm:ss').format('hh:mm A') : '—',
            ],
            [
              'Status',
              meeting.status
                ? meeting.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
                : '—',
            ],
            ['Location', meeting.location],
            ['Meeting Link', meeting.meeting_link],
            ['Agenda', meeting.agenda],
            ['Minutes', meeting.minutes],
          ])}
        </View>

        <View style={ps.section}>
          <Text style={ps.sectionTitle}>ASSIGNMENT</Text>
          {rows([
            ['Assigned To', assignedNames],
            ['Created By', meeting.created_by_name || '—'],
            [
              'Created At',
              meeting.created_at ? dayjs(meeting.created_at).format('MMM D, YYYY h:mm A') : '—',
            ],
            [
              'Updated At',
              meeting.updated_at ? dayjs(meeting.updated_at).format('MMM D, YYYY h:mm A') : '—',
            ],
          ])}
        </View>

        <Text style={ps.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — Meeting Management Module
        </Text>
      </PdfPage>
    </Document>
  );
}

const cardSx = {
  borderRadius: 3,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e5e7eb',
  overflow: 'hidden',
  height: '100%',
};

const cardHeaderSx = {
  px: 3,
  py: 2.5,
  borderBottom: '1px solid #e5e7eb',
  bgcolor: '#f9fafb',
};

const cardContentSx = {
  p: { xs: 2.5, md: 3 },
};

function InfoCard({ icon, label, value, color = 'text.primary' }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor: '#f8fafc',
        border: '1px solid #e2e8f0',
        height: '100%',
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 1.5,
          bgcolor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={22} sx={{ color }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.3 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} color={color} sx={{ wordBreak: 'break-word' }}>
          {value || '—'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function MeetingDetailPage() {
  const { user } = useAuthContext();
  const { id } = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const canChangeMeeting = user?.user_permissions_list?.some(
    (p) => p.codename === 'change_meeting'
  );
  const canDeleteMeeting = user?.user_permissions_list?.some(
    (p) => p.codename === 'delete_meeting'
  );

  const {
    data: meeting,
    loading,
    error,
  } = useGetRequest(endpoints.meetingManagement.meetingById(id));

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await useDeleteRequest(endpoints.meetingManagement.meetingById(id));
      toast.success('Meeting deleted successfully');
      mutate(endpoints.meetingManagement.meetings);
      router.push(paths.dashboard.meetingManagement.list);
    } catch (err) {
      toast.error(err?.message || 'Unable to delete meeting.');
    } finally {
      setDeleting(false);
      confirm.onFalse();
    }
  };

  const handlePrint = async () => {
    setPdfLoading(true);
    try {
      const blob = await pdf(<MeetingPdfDocument meeting={meeting} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to generate print view.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePdfDownload = async () => {
    setPdfLoading(true);
    try {
      const blob = await pdf(<MeetingPdfDocument meeting={meeting} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = `meeting-${meeting.meeting_id || meeting.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width={320} height={40} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={240} height={24} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mt: 3 }} />
      </Box>
    );
  }

  if (!meeting || error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Meeting not found.
        </Alert>
      </Box>
    );
  }

  const assignedUsers = meeting.assigned_to || [];
  const statusCapitalized = meeting.status
    ? meeting.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '—';
  const statusColor =
    {
      scheduled: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error',
      postponed: 'secondary',
    }[meeting.status] || 'default';

  return (
    <Box sx={{ p: 3 }}>
      <IconButton
        component={RouterLink}
        href={paths.dashboard.meetingManagement.list}
        sx={{ mt: 0.25, flexShrink: 0 }}
      >
        <Iconify icon="solar:arrow-left-bold" width={20} />
      </IconButton>
      <CustomBreadcrumbs
        heading="Meeting Details"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Meeting Management', href: paths.dashboard.meetingManagement.list },
          { name: meeting.meeting_id || 'Detail' },
        ]}
        sx={{ mb: 3 }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 0.5 }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
            <Typography variant="h4" fontWeight={700}>
              {meeting.title}
            </Typography>
            <Label variant="soft" color={statusColor}>
              {statusCapitalized}
            </Label>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              {meeting.meeting_id}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              ·
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created by {meeting.created_by_name || '—'}
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.meetingManagement.list}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:arrow-left-bold" width={18} />}
          >
            Back
          </Button>
          <Tooltip title="Open print view">
            <span>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:printer-bold" width={18} />}
                onClick={handlePrint}
                disabled={pdfLoading}
              >
                Print
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Download PDF">
            <span>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:file-download-bold" width={18} />}
                onClick={handlePdfDownload}
                disabled={pdfLoading}
              >
                {pdfLoading ? '…' : 'PDF'}
              </Button>
            </span>
          </Tooltip>
          {canChangeMeeting && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:pen-bold" width={18} />}
              onClick={() => window.open(paths.dashboard.meetingManagement.edit(id), '_blank')}
            >
              Edit
            </Button>
          )}
          {canDeleteMeeting && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />}
              onClick={confirm.onTrue}
            >
              Delete
            </Button>
          )}
        </Stack>
      </Stack>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1, mb: 3 }}>
        {[
          {
            icon: 'solar:calendar-bold-duotone',
            label: 'Date',
            value: meeting.date ? dayjs(meeting.date).format('dddd, MMMM D, YYYY') : '—',
            color: '#3b82f6',
          },
          {
            icon: 'solar:clock-circle-bold-duotone',
            label: 'Time',
            value:
              meeting.start_time && meeting.end_time
                ? `${dayjs(meeting.start_time, 'HH:mm:ss').format('hh:mm A')} - ${dayjs(meeting.end_time, 'HH:mm:ss').format('hh:mm A')}`
                : '—',
            color: '#f59e0b',
          },
          {
            icon: 'solar:flag-bold-duotone',
            label: 'Status',
            value: statusCapitalized,
            color:
              statusColor === 'success'
                ? '#10b981'
                : statusColor === 'warning'
                  ? '#f59e0b'
                  : statusColor === 'error'
                    ? '#ef4444'
                    : statusColor === 'info'
                      ? '#3b82f6'
                      : '#6b7280',
          },
          {
            icon: 'solar:map-point-bold-duotone',
            label: 'Location',
            value: meeting.location || 'Not specified',
            color: '#10b981',
          },
          {
            icon: 'solar:link-bold-duotone',
            label: 'Meeting Link',
            value: meeting.meeting_link || 'Not specified',
            color: '#8b5cf6',
          },
        ].map((item) => (
          <Box key={item.label} sx={{ flex: '1 1 180px', minWidth: 150 }}>
            <InfoCard {...item} />
          </Box>
        ))}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Typography variant="h6" fontWeight={600}>
                Description
              </Typography>
            </Box>
            <CardContent sx={cardContentSx}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {meeting.description || 'No description provided.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Typography variant="h6" fontWeight={600}>
                Assigned Members
              </Typography>
            </Box>
            <CardContent sx={cardContentSx}>
              {assignedUsers.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Iconify
                    icon="solar:users-group-rounded-bold-duotone"
                    width={40}
                    sx={{ color: 'text.disabled', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No members assigned.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  <AvatarGroup max={5} sx={{ justifyContent: 'flex-start', mb: 1 }}>
                    {assignedUsers.map((u) => (
                      <Avatar
                        key={u.id}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: '#3b82f6',
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                  {assignedUsers.map((u) => (
                    <Stack key={u.id} direction="row" alignItems="center" spacing={1.5}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: '#e2e8f0',
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#475569',
                        }}
                      >
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {u.name}
                        </Typography>
                        {u.email && (
                          <Typography variant="caption" color="text.secondary">
                            {u.email}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Typography variant="h6" fontWeight={600}>
                Agenda
              </Typography>
            </Box>
            <CardContent sx={cardContentSx}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {meeting.agenda || 'No agenda provided.'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Typography variant="h6" fontWeight={600}>
                Attachments
              </Typography>
            </Box>
            <CardContent sx={cardContentSx}>
              {!meeting.attachments?.length ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Iconify
                    icon="solar:file-bold-duotone"
                    width={40}
                    sx={{ color: 'text.disabled', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    No attachments.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {meeting.attachments?.map((att) => (
                    <Stack
                      key={att.id}
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <Iconify
                        icon="solar:file-bold"
                        width={20}
                        sx={{ color: '#3b82f6', flexShrink: 0 }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {att.file_name || 'Attachment'}
                        </Typography>
                        {att.file_size && (
                          <Typography variant="caption" color="text.secondary">
                            {att.file_size > 1024
                              ? `${(att.file_size / 1024).toFixed(1)} KB`
                              : `${att.file_size} B`}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={0.5} flexShrink={0}>
                        <Tooltip title="Preview">
                          <IconButton
                            size="small"
                            component="a"
                            href={`http://127.0.0.1:8000${att.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.lighter' },
                            }}
                          >
                            <Iconify icon="solar:eye-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                        {/* <Tooltip title="Download">
                          <IconButton
                            size="small"
                            component="a"
                            href={`http://127.0.0.1:8000${att.file}`}
                            download={att.file_name || true}
                            sx={{ color: 'success.main', '&:hover': { bgcolor: 'success.lighter' } }}
                          >
                            <Iconify icon="solar:download-bold" width={16} />
                          </IconButton>
                        </Tooltip> */}
                      </Stack>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {meeting.minutes && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={cardSx}>
              <Box sx={cardHeaderSx}>
                <Typography variant="h6" fontWeight={600}>
                  Minutes
                </Typography>
              </Box>
              <CardContent sx={cardContentSx}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {meeting.minutes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={cardSx}>
            <Box sx={cardHeaderSx}>
              <Typography variant="h6" fontWeight={600}>
                Timeline
              </Typography>
            </Box>
            <CardContent sx={cardContentSx}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Iconify
                    icon="solar:clock-circle-bold-duotone"
                    width={20}
                    sx={{ color: '#3b82f6' }}
                  />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {meeting.created_at
                        ? dayjs(meeting.created_at).format('MMM D, YYYY [at] h:mm A')
                        : '—'}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Iconify icon="solar:refresh-bold-duotone" width={20} sx={{ color: '#10b981' }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {meeting.updated_at
                        ? dayjs(meeting.updated_at).format('MMM D, YYYY [at] h:mm A')
                        : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete meeting"
        content="Are you sure you want to delete this meeting? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </Box>
  );
}
