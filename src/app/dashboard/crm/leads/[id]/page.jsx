'use client';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';
import { mutate as swrMutate } from 'swr';
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
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Alert,
  Paper,
  Stack,
  Avatar,
  Button,
  Divider,
  Tooltip,
  Skeleton,
  TextField,
  IconButton,
  Typography,
  CardContent,
  Autocomplete,
  CircularProgress,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import {
  STATUS_COLORS,
  STATUS_LABELS,
  SOURCE_LABELS,
  PROJECT_TYPE_LABELS,
} from 'src/sections/crm/constants';

import { useAuthContext } from 'src/auth/hooks';

// ─────────────────────────────────────────────────────────────────────────────
// PDF styles
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// PDF document
// ─────────────────────────────────────────────────────────────────────────────

function LeadPdfDocument({ lead }) {
  const rows = (pairs) =>
    pairs
      .filter(([, v]) => v)
      .map(([label, value]) => (
        <View key={label} style={ps.row}>
          <Text style={ps.rowLabel}>{label}</Text>
          <Text style={ps.rowValue}>{value}</Text>
        </View>
      ));

  return (
    <Document>
      <PdfPage size="A4" style={ps.page}>
        <View style={ps.headerBlock}>
          <Text style={ps.docTitle}>Lead Report</Text>
          <Text style={ps.docSubtitle}>
            {lead.lead_id} · {lead.name} · Generated {new Date().toLocaleDateString()}
          </Text>
        </View>

        <View style={ps.section}>
          <Text style={ps.sectionTitle}>CUSTOMER INFORMATION</Text>
          {rows([
            ['Name', lead.name],
            ['Phone', lead.phone],
            ['Email', lead.email],
            ['Country', lead.country],
            ['City', lead.city],
            ['Area', lead.area],
            ['Address', lead.address],
            ['Source', SOURCE_LABELS[lead.source] || lead.source],
            ['Link', lead.link],
            ['Remarks', lead.remarks],
          ])}
        </View>

        <View style={ps.section}>
          <Text style={ps.sectionTitle}>PROJECT INFORMATION</Text>
          {rows([
            ['Project Name', lead.project_name],
            ['Project Type', PROJECT_TYPE_LABELS[lead.project_type] || lead.project_type],
            ['Customization', lead.customization],
            ['Status', STATUS_LABELS[lead.status] || lead.status],
          ])}
        </View>

        <View style={ps.section}>
          <Text style={ps.sectionTitle}>ASSIGNMENT</Text>
          {rows([
            ['Created By', lead.created_by_name],
            ['Assigned To', lead.assigned_to_name],
          ])}
        </View>

        <Text style={ps.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — CRM Module
        </Text>
      </PdfPage>
    </Document>
  );
}

function FollowUpsPdfDocument({ lead, followUps }) {
  return (
    <Document>
      <PdfPage size="A4" style={ps.page}>
        <View style={ps.headerBlock}>
          <Text style={ps.docTitle}>Follow-Up Tasks</Text>
          <Text style={ps.docSubtitle}>
            {lead.lead_id} · {lead.name} · Generated {new Date().toLocaleDateString()}
          </Text>
        </View>

        {!followUps || followUps.length === 0 ? (
          <View style={ps.section}>
            <Text style={{ fontSize: 11, color: '#888' }}>No follow-up tasks recorded.</Text>
          </View>
        ) : (
          followUps.map((task, idx) => (
            <View key={task.id} style={ps.section}>
              <Text style={ps.sectionTitle}>
                TASK {idx + 1}: {task.title?.toUpperCase()}
              </Text>
              <View style={ps.row}>
                <Text style={ps.rowLabel}>Description</Text>
                <Text style={ps.rowValue}>{task.description || '—'}</Text>
              </View>
              <View style={ps.row}>
                <Text style={ps.rowLabel}>Next Contact Date</Text>
                <Text style={ps.rowValue}>{task.next_contact_date || '—'}</Text>
              </View>
              <View style={ps.row}>
                <Text style={ps.rowLabel}>Assigned To</Text>
                <Text style={ps.rowValue}>
                  {task.assigned_to?.length > 0
                    ? task.assigned_to.map((u) => u.name).join(', ')
                    : '—'}
                </Text>
              </View>
              <View style={ps.row}>
                <Text style={ps.rowLabel}>Created By</Text>
                <Text style={ps.rowValue}>{task.created_by_name || '—'}</Text>
              </View>
              <View style={ps.row}>
                <Text style={ps.rowLabel}>Created On</Text>
                <Text style={ps.rowValue}>{new Date(task.created_at).toLocaleDateString()}</Text>
              </View>
              <View style={ps.row}>
                <Text style={ps.rowLabel}>Attachments</Text>
                <Text style={ps.rowValue}>
                  {task.attachments?.length > 0
                    ? task.attachments.map((a) => a.file_name).join(', ')
                    : 'None'}
                </Text>
              </View>
            </View>
          ))
        )}

        <Text style={ps.footer}>
          Generated {new Date().toLocaleDateString()} · LEDARS — CRM Module
        </Text>
      </PdfPage>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small reusable components
// ─────────────────────────────────────────────────────────────────────────────

function InfoCard({ icon, iconBg, iconColor, label, value }) {
  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        border: '1px solid #e5e7eb',
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          bgcolor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={22} sx={{ color: iconColor }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}
        >
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {value || '—'}
        </Typography>
      </Box>
    </Card>
  );
}

function SectionTitle({ children }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
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
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        component="div"
        fontWeight={500}
        textAlign="right"
        sx={{ wordBreak: 'break-word' }}
      >
        {value || '—'}
      </Typography>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Follow‑Up Tab component
// ─────────────────────────────────────────────────────────────────────────────

function FollowUpTab({ leadId, lead }) {
  const { user } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [assignedUsers, setAssignedUsers] = useState(
    lead?.assigned_to ? [{ id: lead.assigned_to, username: lead.assigned_to_name || '' }] : []
  );
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: followUps, loading } = useGetRequest(endpoints.crm.followUps(leadId));
  const { data: usersData } = useGetRequest(endpoints.auth.simpleUsers);

  const users = useMemo(() => {
    const raw = Array.isArray(usersData) ? usersData : usersData?.results || [];
    return raw
      .filter((item) => item?.user)
      .map((item) => ({
        id: item.user.id,
        username: item.employee_name || item.user.username,
      }));
  }, [usersData]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description) formData.append('description', description);
      if (nextContactDate) formData.append('next_contact_date', nextContactDate);
      if (assignedUsers.length > 0) {
        assignedUsers.forEach((u) => formData.append('assigned_to', u.id));
      }
      files.forEach((f) => formData.append('attachments', f));

      await axiosInstance.post(endpoints.crm.followUps(leadId), formData);
      toast.success('Follow-up task created');
      setTitle('');
      setDescription('');
      setNextContactDate('');
      setAssignedUsers([]);
      setFiles([]);
      swrMutate(endpoints.crm.followUps(leadId));
    } catch (err) {
      console.error('Follow-up create error:', err?.response?.data || err);
      const detail = err?.response?.data?.detail || err?.detail;
      const msg = detail || err?.message || 'Failed to create follow-up';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* ── Left: Task List (sticky) ── */}
      <Grid
        size={{ xs: 12, md: 7 }}
        sx={{
          position: 'sticky',
          top: 100,
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 140px)',
          overflowY: 'auto',
          pr: 0.5,
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight={700}
          sx={{
            mb: 2,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.default',
            zIndex: 1,
            pt: 0.5,
          }}
        >
          <Iconify
            icon="solar:clipboard-list-bold-duotone"
            width={20}
            sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }}
          />
          Assigned Tasks
        </Typography>

        {loading ? (
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
        ) : !followUps || followUps.length === 0 ? (
          <Paper
            variant="outlined"
            sx={{
              p: 5,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px solid #e5e7eb',
            }}
          >
            <Iconify
              icon="solar:clipboard-list-bold-duotone"
              width={56}
              sx={{ color: 'text.disabled', mb: 1.5 }}
            />
            <Typography variant="body1" color="text.secondary" fontWeight={500}>
              No follow-up tasks yet.
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Use the form on the right to create one.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {followUps.map((task) => (
              <Card
                key={task.id}
                variant="outlined"
                sx={{
                  borderRadius: 2.5,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                }}
              >
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Typography variant="subtitle2" fontWeight={600}>
                      {task.title}
                    </Typography>
                    {task.next_contact_date && (
                      <Chip
                        icon={<Iconify icon="solar:calendar-bold" width={13} />}
                        label={task.next_contact_date}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ height: 22, fontSize: 11, flexShrink: 0 }}
                      />
                    )}
                  </Stack>

                  {task.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.75, whiteSpace: 'pre-wrap' }}
                    >
                      {task.description}
                    </Typography>
                  )}

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mt: 1.5 }}
                    flexWrap="wrap"
                  >
                    <Typography variant="caption" color="text.disabled">
                      by {task.created_by_name}
                    </Typography>
                    {task.assigned_to?.length > 0 && (
                      <>
                        <Divider orientation="vertical" flexItem sx={{ height: 14 }} />
                        {task.assigned_to.map((u) => (
                          <Chip
                            key={u.id}
                            avatar={
                              <Avatar sx={{ width: 18, height: 18, fontSize: 10 }}>
                                {u.name?.charAt(0).toUpperCase()}
                              </Avatar>
                            }
                            label={u.name}
                            size="small"
                            sx={{ height: 22, fontSize: 10 }}
                          />
                        ))}
                      </>
                    )}
                    <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                      {new Date(task.created_at).toLocaleDateString()}
                    </Typography>
                  </Stack>

                  {task.attachments?.length > 0 && <Divider sx={{ my: 1.5 }} />}
                  {task.attachments?.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {task.attachments.map((att) => (
                        <Chip
                          key={att.id}
                          component="a"
                          href={att.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                          icon={<Iconify icon="solar:file-bold" width={14} />}
                          label={att.file_name}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 24,
                            fontSize: 10,
                            maxWidth: 180,
                            textDecoration: 'none',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Grid>

      {/* ── Right: Form ── */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 2.5 }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                <Iconify
                  icon="solar:add-circle-bold"
                  width={20}
                  sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }}
                />
                Add Follow-Up Task
              </Typography>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                startIcon={
                  submitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:add-line" />
                  )
                }
                size="small"
              >
                {submitting ? 'Creating...' : 'Create Task'}
              </Button>
            </Stack>

            <Stack spacing={2.5}>
              <TextField
                size="small"
                label="Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
              />

              <TextField
                size="small"
                label="Description"
                multiline
                minRows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
              />

              <TextField
                size="small"
                type="date"
                label="Next Contact Date"
                InputLabelProps={{ shrink: true }}
                value={nextContactDate}
                onChange={(e) => setNextContactDate(e.target.value)}
                fullWidth
              />

              <Autocomplete
                multiple
                size="small"
                options={users}
                getOptionLabel={(option) => option.username}
                value={assignedUsers}
                onChange={(_, newValue) => setAssignedUsers(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Assign To" placeholder="Select users" />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {option.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2">{option.username}</Typography>
                    </Stack>
                  </li>
                )}
                noOptionsText="No users found"
              />

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Iconify icon="solar:upload-bold" width={18} />}
                  fullWidth
                  sx={{ textTransform: 'none' }}
                >
                  Upload Files
                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                  />
                </Button>
                {files.length > 0 && (
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                    {Array.from(files).map((f, i) => (
                      <Chip
                        key={i}
                        icon={<Iconify icon="solar:file-bold" width={14} />}
                        label={f.name}
                        size="small"
                        variant="outlined"
                        onDelete={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        sx={{ height: 24, fontSize: 11, maxWidth: 200 }}
                      />
                    ))}
                  </Stack>
                )}
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
                startIcon={
                  submitting ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify icon="mingcute:check-line" />
                  )
                }
                size="small"
                fullWidth
                sx={{ textTransform: 'none' }}
              >
                {submitting ? 'Creating...' : 'Save Task'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { user } = useAuthContext();
  const { id } = useParams();
  const router = useRouter();
  const confirm = useBoolean();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const canChangeLead = user?.user_permissions_list?.some((p) => p.codename === 'change_lead');
  const canDeleteLead = user?.user_permissions_list?.some((p) => p.codename === 'delete_lead');

  const { data: lead, loading, error } = useGetRequest(endpoints.crm.leadById(id));
  const { data: rawFollowUps } = useGetRequest(endpoints.crm.followUps(id));
  const followUps = Array.isArray(rawFollowUps) ? rawFollowUps : rawFollowUps?.results || [];

  // ── PDF download ──────────────────────────────────────────────────────────
  const getActivePdfDocument = () =>
    activeTab === 1 ? (
      <FollowUpsPdfDocument lead={lead} followUps={followUps} />
    ) : (
      <LeadPdfDocument lead={lead} />
    );

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      const blob = await pdf(getActivePdfDocument()).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download =
        activeTab === 1 ? `lead-${lead.lead_id}-followups.pdf` : `lead-${lead.lead_id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate PDF.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = async () => {
    setPdfLoading(true);
    try {
      const blob = await pdf(getActivePdfDocument()).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch {
      toast.error('Failed to open print view.');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(endpoints.crm.leadById(id));
      toast.success('Lead deleted successfully.');
      router.push(paths.dashboard.crm.leads.list);
    } catch {
      toast.error('Failed to delete lead.');
    } finally {
      confirm.onFalse();
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={88} sx={{ borderRadius: 2, mb: 2 }} />
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 6, sm: 3 }} key={i}>
              <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (!lead || error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Lead not found or an error occurred.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* ── HEADER ─────────────────────────────────────────────────── */}
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
              href={paths.dashboard.crm.leads.list}
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
                  {lead.name}
                </Typography>
                <Chip
                  label={STATUS_LABELS[lead.status] || lead.status}
                  size="small"
                  color={STATUS_COLORS[lead.status] || 'default'}
                  sx={{ height: 22, fontSize: 11, textTransform: 'capitalize' }}
                />
              </Stack>
              <Stack direction="row" spacing={2.5} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">
                  {lead.lead_id}
                </Typography>
                {lead.phone && (
                  <Typography variant="caption" color="text.secondary">
                    {lead.phone}
                  </Typography>
                )}
                {lead.email && (
                  <Typography variant="caption" color="text.secondary">
                    {lead.email}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Created {new Date(lead.created_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="Open PDF in new tab — use Ctrl+P to print">
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<Iconify icon="solar:printer-bold" width={16} />}
                  onClick={handlePrint}
                  disabled={pdfLoading}
                >
                  Print
                </Button>
              </Tooltip>
              <Tooltip title="Download as PDF">
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  startIcon={<Iconify icon="solar:download-bold" width={16} />}
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? 'Generating…' : 'PDF'}
                </Button>
              </Tooltip>
              {canChangeLead && (
                <Button
                  component={RouterLink}
                  href={paths.dashboard.crm.leads.edit(lead.id)}
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<Iconify icon="solar:pen-bold" width={16} />}
                >
                  Edit
                </Button>
              )}
              {canDeleteLead && (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
                  onClick={confirm.onTrue}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── TABS ───────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ minHeight: 44 }}
        >
          <Tab
            label="Overview"
            icon={<Iconify icon="solar:info-circle-bold" width={18} />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }}
          />
          <Tab
            label="Follow Up"
            icon={<Iconify icon="solar:clipboard-list-bold" width={18} />}
            iconPosition="start"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }}
          />
        </Tabs>
      </Box>

      {/* ── TAB CONTENT ────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <>
          {/* ── QUICK INFO CARDS ────────────────────────────────── */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoCard
                icon="solar:map-point-bold-duotone"
                iconBg="#eff6ff"
                iconColor="#3b82f6"
                label="Area"
                value={lead.area}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoCard
                icon="solar:buildings-bold-duotone"
                iconBg="#f0fdf4"
                iconColor="#10b981"
                label="Project Type"
                value={PROJECT_TYPE_LABELS[lead.project_type] || lead.project_type}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoCard
                icon="solar:user-bold-duotone"
                iconBg="#fdf4ff"
                iconColor="#a855f7"
                label="Assigned To"
                value={lead.assigned_to_name}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoCard
                icon="solar:share-bold-duotone"
                iconBg="#fffbeb"
                iconColor="#f59e0b"
                label="Source"
                value={SOURCE_LABELS[lead.source] || lead.source}
              />
            </Grid>
          </Grid>

          {/* ── DETAIL SECTIONS ─────────────────────────────────── */}
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
              <SectionTitle>Customer Information</SectionTitle>
              <Grid container spacing={0} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
                  <DetailRow label="Full Name" value={lead.name} />
                  <DetailRow label="Phone" value={lead.phone} />
                  <DetailRow label="Email" value={lead.email} />
                  <DetailRow label="Country" value={lead.country} />
                  <DetailRow label="City" value={lead.city} />
                </Grid>
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{
                    pl: { md: 3 },
                    borderLeft: { md: '1px solid' },
                    borderColor: { md: 'divider' },
                  }}
                >
                  <DetailRow label="Area" value={lead.area} />
                  <DetailRow label="Address" value={lead.address} />
                  <DetailRow label="Source" value={SOURCE_LABELS[lead.source] || lead.source} />
                  <DetailRow label="Link" value={lead.link} />
                  <DetailRow label="Remarks" value={lead.remarks} />
                </Grid>
              </Grid>

              <SectionTitle>Project Information</SectionTitle>
              <Grid container spacing={0} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
                  <DetailRow label="Project Name" value={lead.project_name} />
                  <DetailRow
                    label="Project Type"
                    value={PROJECT_TYPE_LABELS[lead.project_type] || lead.project_type}
                  />
                </Grid>
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{
                    pl: { md: 3 },
                    borderLeft: { md: '1px solid' },
                    borderColor: { md: 'divider' },
                  }}
                >
                  <DetailRow label="Customization" value={lead.customization} />
                  <DetailRow
                    label="Status"
                    value={
                      <Chip
                        label={STATUS_LABELS[lead.status] || lead.status}
                        size="small"
                        color={STATUS_COLORS[lead.status] || 'default'}
                        sx={{ height: 22, fontSize: 11, textTransform: 'capitalize' }}
                      />
                    }
                  />
                </Grid>
              </Grid>

              <SectionTitle>Assignment</SectionTitle>
              <Grid container spacing={0}>
                <Grid size={{ xs: 12, md: 6 }} sx={{ pr: { md: 3 } }}>
                  <DetailRow label="Created By" value={lead.created_by_name} />
                </Grid>
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{
                    pl: { md: 3 },
                    borderLeft: { md: '1px solid' },
                    borderColor: { md: 'divider' },
                  }}
                >
                  <DetailRow label="Assigned To" value={lead.assigned_to_name} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 1 && <FollowUpTab leadId={id} lead={lead} />}

      {/* ── DELETE CONFIRM ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete lead"
        content={`Are you sure you want to delete lead ${lead.lead_id}? This action cannot be undone.`}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </Box>
  );
}
