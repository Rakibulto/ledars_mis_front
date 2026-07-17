'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import {
  pdf,
  Text,
  View,
  Document,
  Page as PDFPage,
  StyleSheet as PDFStyleSheet,
} from '@react-pdf/renderer';

import {
  Box,
  Tab,
  Card,
  Chip,
  Grid,
  Tabs,
  Stack,
  Table,
  Button,
  Avatar,
  Tooltip,
  TableRow,
  Skeleton,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  CardContent,
  TableFooter,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import { resolveDonorPhotoUrl } from 'src/sections/projects/donors/donor-form';

// ---------------------------------------------------------------------------
// Color config for each transaction type pill
// ---------------------------------------------------------------------------
const TX_TYPE_STYLES = {
  donation: { label: 'Donation', bg: '#EAF3DE', color: '#3B6D11' },
  debit: { label: 'Debit', bg: '#FCEBEB', color: '#A32D2D' },
  credit: { label: 'Credit', bg: '#E6F1FB', color: '#185FA5' },
  refund: { label: 'Refund', bg: '#FAEEDA', color: '#854F0B' },
  adjustment: { label: 'Adjustment', bg: '#F3EDF8', color: '#6B3FA0' },
};

// ---------------------------------------------------------------------------
// PDF styles
// ---------------------------------------------------------------------------
const pdfStyles = PDFStyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#333' },
  header: { marginBottom: 24, borderBottom: '2px solid #1976d2', paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1976d2', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976d2',
    borderBottom: '1px solid #eee',
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 160, color: '#666' },
  value: { flex: 1, fontWeight: 'bold' },
  badge: {
    backgroundColor: '#e3f2fd',
    padding: '4 8',
    borderRadius: 4,
    color: '#1976d2',
    fontSize: 9,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  amountBox: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginTop: 4 },
  amountLabel: { fontSize: 9, color: '#666', marginBottom: 2 },
  amountValue: { fontSize: 18, fontWeight: 'bold', color: '#1976d2' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1976d2',
    padding: '6 4',
    marginBottom: 2,
  },
  tableHeaderCell: { color: 'white', fontWeight: 'bold', fontSize: 9 },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #eee', padding: '5 4' },
  tableCell: { fontSize: 9 },
  col1: { width: '15%' },
  col2: { width: '15%' },
  col3: { width: '20%' },
  col4: { width: '20%' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #eee',
    paddingTop: 8,
    color: '#999',
    fontSize: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

// ---------------------------------------------------------------------------
// PDF documents
// ---------------------------------------------------------------------------
function LedgerInvoicePDF({ ledger, donor }) {
  return (
    <Document>
      <PDFPage size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>Donor Ledger Invoice</Text>
          <Text style={pdfStyles.subtitle}>
            {donor?.name} • {donor?.donor_code}
          </Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.badge}>{ledger.transaction_type?.toUpperCase()}</Text>
          <View style={pdfStyles.amountBox}>
            <Text style={pdfStyles.amountLabel}>Amount</Text>
            <Text style={pdfStyles.amountValue}>
              {ledger.currency || donor?.currency || 'BDT'}{' '}
              {Number(ledger.amount || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ledger Details</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Ledger Code</Text>
            <Text style={pdfStyles.value}>{ledger.ledger_code}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Transaction Date</Text>
            <Text style={pdfStyles.value}>{ledger.transaction_date}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Transaction Type</Text>
            <Text style={pdfStyles.value}>{ledger.transaction_type}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Reference</Text>
            <Text style={pdfStyles.value}>{ledger.reference || '—'}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Related Project</Text>
            <Text style={pdfStyles.value}>{ledger.related_project || '—'}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Balance</Text>
            <Text style={pdfStyles.value}>
              {ledger.currency || donor?.currency || 'BDT'}{' '}
              {Number(ledger.balance || 0).toLocaleString()}
            </Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Reconciled</Text>
            <Text style={pdfStyles.value}>{ledger.is_reconciled ? 'Yes' : 'No'}</Text>
          </View>
          {ledger.description && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Description</Text>
              <Text style={pdfStyles.value}>{ledger.description}</Text>
            </View>
          )}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Donor Information</Text>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Donor Name</Text>
            <Text style={pdfStyles.value}>{donor?.name}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Donor Code</Text>
            <Text style={pdfStyles.value}>{donor?.donor_code}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Organization</Text>
            <Text style={pdfStyles.value}>{donor?.organization_name || '—'}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Email</Text>
            <Text style={pdfStyles.value}>{donor?.email || '—'}</Text>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <Text>Generated on {new Date().toLocaleDateString()}</Text>
          <Text>LEDARS — NGO Management System</Text>
        </View>
      </PDFPage>
    </Document>
  );
}

function DonorDetailPDF({ donor, ledgers, projects }) {
  return (
    <Document>
      <PDFPage size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{donor?.name}</Text>
          <Text style={pdfStyles.subtitle}>
            {donor?.donor_code} • {donor?.organization_name || donor?.type}
          </Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Donor Profile</Text>
          {[
            ['Donor Code', donor?.donor_code],
            ['Type', donor?.type],
            ['Status', donor?.status],
            ['Email', donor?.email],
            ['Phone', donor?.phone],
            ['Organization', donor?.organization_name || '—'],
            ['Nationality', donor?.nationality || '—'],
            ['Preferred Contact', donor?.preferred_contact_method || '—'],
            ['Language', donor?.preferred_language || '—'],
            [
              'Total Donated',
              `${donor?.currency || 'BDT'} ${Number(donor?.total_donated_amount || 0).toLocaleString()}`,
            ],
            ['Last Donation Date', donor?.last_donation_date || '—'],
          ].map(([label, value]) => (
            <View key={label} style={pdfStyles.row}>
              <Text style={pdfStyles.label}>{label}</Text>
              <Text style={pdfStyles.value}>{value}</Text>
            </View>
          ))}
        </View>

        {projects?.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Linked Projects ({projects.length})</Text>
            {projects.map((project, i) => (
              <View key={i} style={pdfStyles.row}>
                <Text style={pdfStyles.label}>{project.code}</Text>
                <Text style={pdfStyles.value}>
                  {project.title} — {project.currency}{' '}
                  {Number(project.budget_amount || 0).toLocaleString()} ({project.status})
                </Text>
              </View>
            ))}
          </View>
        )}

        {ledgers?.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Ledger Entries ({ledgers.length})</Text>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col1]}>Date</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col2]}>Type</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col3]}>Reference</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col4]}>Project</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col5]}>Amount</Text>
              <Text style={[pdfStyles.tableHeaderCell, pdfStyles.col6]}>Balance</Text>
            </View>
            {ledgers.map((ledger, i) => (
              <View key={i} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, pdfStyles.col1]}>{ledger.transaction_date}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.col2]}>{ledger.transaction_type}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.col3]}>{ledger.reference || '—'}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.col4]}>
                  {ledger.related_project || '—'}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.col5]}>
                  {Number(ledger.amount || 0).toLocaleString()}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.col6]}>
                  {Number(ledger.balance || 0).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={pdfStyles.footer}>
          <Text>Generated on {new Date().toLocaleDateString()}</Text>
          <Text>LEDARS — NGO Management System</Text>
        </View>
      </PDFPage>
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Small reusable components
// ---------------------------------------------------------------------------
function TabPanel({ value, index, children }) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && children}
    </Box>
  );
}

function DetailRow({ label, value }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 180 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500} textAlign="right">
        {value ?? '—'}
      </Typography>
    </Stack>
  );
}

function StatCard({ label, value, sub, icon }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: 120,
        borderRadius: 3,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        transition: 'all .2s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'primary.lighter',
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={24} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Typography>

        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            lineHeight: 1.2,
            mt: 0.5,
          }}
        >
          {value}
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block',
            minHeight: 18,
          }}
        >
          {sub || ' '}
        </Typography>
      </Box>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DonorDetailPage() {
  const { id } = useParams();
  const EP = endpoints.projectManagements;

  const { data: donor, loading: donorLoading } = useGetRequest(EP.donorById(id));
  const { data: rawLedgers, loading: ledgersLoading } = useGetRequest(
    `${EP.donorLedgers}?donor=${id}`
  );
  const { data: rawProjects } = useGetRequest(`${EP.projects}?donor=${id}`);

  const donorProjects = useMemo(() => {
    if (!rawProjects) return [];
    return Array.isArray(rawProjects) ? rawProjects : rawProjects.results || [];
  }, [rawProjects]);

  const ledgers = useMemo(() => {
    if (!rawLedgers) return [];
    return Array.isArray(rawLedgers) ? rawLedgers : rawLedgers.results || [];
  }, [rawLedgers]);

  const totalCredits = useMemo(
    () =>
      ledgers
        .filter((l) => ['donation', 'credit'].includes(l.transaction_type))
        .reduce((sum, l) => sum + Number(l.amount || 0), 0),
    [ledgers]
  );

  const totalDebits = useMemo(
    () =>
      ledgers
        .filter((l) => !['donation', 'credit'].includes(l.transaction_type))
        .reduce((sum, l) => sum + Number(l.amount || 0), 0),
    [ledgers]
  );

  const closingBalance = useMemo(() => {
    if (ledgers.length === 0) return 0;
    const sorted = [...ledgers].sort(
      (a, b) =>
        new Date(a.transaction_date) - new Date(b.transaction_date) ||
        new Date(a.created_at) - new Date(b.created_at)
    );
    return sorted.reduce((bal, l) => {
      const amt = Number(l.amount || 0);
      return bal + (['donation', 'credit'].includes(l.transaction_type) ? amt : -amt);
    }, 0);
  }, [ledgers]);

  const [tab, setTab] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'switchDonorTab' && typeof e.data.tabIndex === 'number') {
        setTab(e.data.tabIndex);
        mutate((key) => typeof key === 'string' && key.startsWith(EP.donorLedgers));
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPage = async () => {
    setDownloading(true);
    try {
      const blob = await pdf(
        <DonorDetailPDF donor={donor} ledgers={ledgers} projects={donorProjects} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donor-${donor?.donor_code || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await pdf(
        <DonorDetailPDF donor={donor} ledgers={ledgers} projects={donorProjects} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const win = window.open(url);

      if (win) {
        win.onload = () => {
          win.print();
          URL.revokeObjectURL(url);
        };
      } else {
        toast.error('Popup blocked');
      }
    } catch {
      toast.error('Failed to open print view');
    }
  };

  const handleDownloadLedgerInvoice = async (ledger) => {
    try {
      const blob = await pdf(<LedgerInvoicePDF ledger={ledger} donor={donor} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ledger-invoice-${ledger.ledger_code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate invoice PDF');
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (donorLoading || ledgersLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={88} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid size={{ xs: 6, sm: 3 }} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (!donor) {
    return (
      <Box sx={{ p: 3 }}>
        <Card
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: 3,
            textAlign: 'center',
            border: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Donor not found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The donor record you are looking for does not exist or has been removed.
          </Typography>
        </Card>
      </Box>
    );
  }

  const statusColor =
    donor.status === 'active' ? 'success' : donor.status === 'inactive' ? 'default' : 'warning';

  return (
    <Box sx={{ p: 3 }}>
      <IconButton component={RouterLink} href={paths.dashboard.projects.donors.root} sx={{ mb: 1 }}>
        <Iconify icon="solar:arrow-left-bold" />
      </IconButton>
      {/* ── HEADER CARD ─────────────────────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          mb: 2,
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <CardContent sx={{ p: '20px 24px !important' }}>
          <Stack direction="row" alignItems="flex-start" spacing={2} flexWrap="wrap" gap={1}>
            <Avatar
              src={resolveDonorPhotoUrl(donor.photo)}
              alt={donor.name}
              sx={{
                width: 56,
                height: 56,
                fontSize: 22,
                bgcolor: 'primary.lighter',
                color: 'primary.dark',
              }}
            >
              {donor.name?.charAt(0).toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                flexWrap="wrap"
                sx={{ mb: 0.5 }}
              >
                <Typography variant="h5" fontWeight={700}>
                  {donor.name}
                </Typography>
                {donor.status && (
                  <Chip
                    label={donor.status}
                    size="small"
                    color={statusColor}
                    sx={{ height: 22, fontSize: 11, textTransform: 'capitalize' }}
                  />
                )}
                {donor.type && (
                  <Chip
                    label={donor.type}
                    size="small"
                    variant="outlined"
                    sx={{ height: 22, fontSize: 11, textTransform: 'capitalize' }}
                  />
                )}
              </Stack>

              <Stack direction="row" spacing={2.5} flexWrap="wrap">
                {donor.donor_code && (
                  <Typography variant="caption" color="text.secondary">
                    {donor.donor_code}
                  </Typography>
                )}
                {donor.email && (
                  <Typography variant="caption" color="text.secondary">
                    {donor.email}
                  </Typography>
                )}
                {donor.phone && (
                  <Typography variant="caption" color="text.secondary">
                    {donor.phone}
                  </Typography>
                )}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="Print donor details">
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:printer-bold" />}
                  onClick={handlePrint}
                >
                  Print
                </Button>
              </Tooltip>

              <Tooltip title="Download donor details as PDF">
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:download-bold" />}
                  onClick={handleDownloadPage}
                  disabled={downloading}
                >
                  {downloading ? 'Generating...' : 'Download PDF'}
                </Button>
              </Tooltip>

              <Button
                component="a"
                href={paths.dashboard.projects.donors.edit(id)}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="solar:pen-bold" />}
              >
                Edit
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── STATS ROW ───────────────────────────────────────────────── */}
      {/* These 4 cards give a donor-level snapshot and are always visible across all tabs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Total Donated"
            value={`${donor.currency || 'USD'} ${Number(donor.total_donated_amount || 0).toLocaleString()}`}
            sub={donor.last_donation_date ? `Last on ${donor.last_donation_date}` : undefined}
            icon="solar:money-bag-bold-duotone"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Closing Balance"
            value={`${donor.currency || 'USD'} ${closingBalance.toLocaleString()}`}
            sub={`${donor.currency || 'USD'} ${totalCredits.toLocaleString()} credits · ${donor.currency || 'USD'} ${totalDebits.toLocaleString()} debits`}
            icon="solar:wallet-bold-duotone"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Projects"
            value={donorProjects.length}
            sub="Linked projects"
            icon="solar:folder-bold-duotone"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            label="Collections"
            value={ledgers.length}
            sub="Ledger entries"
            icon="solar:document-text-bold-duotone"
          />
        </Grid>
      </Grid>

      {/* ── TABS + CONTENT (single card) ────────────────────────────── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            minHeight: 46,
            bgcolor: '#f9fafb',
          }}
        >
          <Tab label="Overview" sx={{ fontSize: 13, minHeight: 46, textTransform: 'none' }} />
          <Tab
            label={`Collections (${ledgers.length})`}
            sx={{ fontSize: 13, minHeight: 46, textTransform: 'none' }}
          />
          <Tab
            label={`Projects (${donorProjects.length})`}
            sx={{ fontSize: 13, minHeight: 46, textTransform: 'none' }}
          />
        </Tabs>

        {/* ── TAB 0 · Overview ─────────────────────────── */}
        <TabPanel value={tab} index={0}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          >
            {/* ── LEFT: Contact Details ───────────────────────── */}
            <Box sx={{ flex: 1, borderRight: { md: '1px solid' }, borderColor: { md: 'divider' } }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ px: 3, pt: 2.5, pb: 2 }}>
                Contact Details
              </Typography>
              {[
                ['Donor Code', donor.donor_code],
                ['Type', donor.type],
                ['Status', donor.status, 'status'],
                ['Email', donor.email],
                ['Phone', donor.phone],
                ['Organization', donor.organization_name],
                ['Preferred Contact', donor.preferred_contact_method],
                ['Language', donor.preferred_language],
              ].map(([label, value, type]) => (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {label}
                  </Typography>
                  {type === 'status' && value ? (
                    <Chip
                      label={value}
                      size="small"
                      color={value === 'active' ? 'success' : 'default'}
                      sx={{
                        height: 22,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    />
                  ) : (
                    <Typography
                      variant="body2"
                      fontWeight={value ? 700 : 400}
                      color={value ? 'text.primary' : 'text.secondary'}
                      textAlign="right"
                    >
                      {value ?? '—'}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Box>

            {/* ── RIGHT: Personal Details + Notes ─────────────── */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ px: 3, pt: 2.5, pb: 2 }}>
                Personal Details
              </Typography>
              {[
                ['Date of Birth', donor.date_of_birth],
                ['Gender', donor.gender],
                ['Nationality', donor.nationality],
                ['National ID', donor.national_id_number],
                ['Registration No.', donor.registration_number],
                ['Website', donor.website],
                [
                  'Emergency Contact',
                  donor.emergency_contact_name
                    ? `${donor.emergency_contact_name}${donor.emergency_contact_phone ? ` · ${donor.emergency_contact_phone}` : ''}`
                    : null,
                ],
              ].map(([label, value]) => (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    gap: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={value ? 700 : 400}
                    color={value ? 'text.primary' : 'text.secondary'}
                    textAlign="right"
                  >
                    {value ?? '—'}
                  </Typography>
                </Stack>
              ))}

              {donor.description && (
                <>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{
                      px: 3,
                      pt: 2.5,
                      pb: 2,
                      mt: 1,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    Notes
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ px: 3, pb: 3, lineHeight: 1.75 }}
                  >
                    {donor.description}
                  </Typography>
                </>
              )}
            </Box>
          </Stack>
        </TabPanel>

        {/* ── TAB 1 · Collections ─────────────────────────────────── */}
        <TabPanel value={tab} index={1}>
          {ledgers.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No ledger entries found for this donor.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              {/*
               * Summary cards — ledger-specific breakdown only.
               * "Total Donated" and "Closing Balance" are intentionally
               * omitted here; they are already shown in the top stat cards
               * visible across all tabs.
               */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: (theme) =>
                        `0 2px 8px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.15)'}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.lighter',
                        color: 'primary.dark',
                      }}
                    >
                      <Iconify icon="solar:document-text-bold-duotone" width={22} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                      >
                        Total Entries
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25, lineHeight: 1.2 }}>
                        {ledgers.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ledgers.filter((l) => l.is_reconciled).length} reconciled
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: (theme) =>
                        `0 2px 8px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.15)'}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'success.lighter',
                        color: 'success.dark',
                      }}
                    >
                      <Iconify icon="solar:dollar-bold" width={22} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                      >
                        Total Credits
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25, lineHeight: 1.2 }}>
                        {donor.currency || 'BDT'} {totalCredits.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        donations &amp; credits
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: (theme) =>
                        `0 2px 8px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.15)'}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'error.lighter',
                        color: 'error.dark',
                      }}
                    >
                      <Iconify icon="solar:card-send-bold-duotone" width={22} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                      >
                        Total Debits
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25, lineHeight: 1.2 }}>
                        {donor.currency || 'BDT'} {totalDebits.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        refunds, adjustments &amp; debits
                      </Typography>
                    </Box>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      boxShadow: (theme) =>
                        `0 2px 8px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.15)'}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: closingBalance >= 0 ? 'success.lighter' : 'error.lighter',
                        color: closingBalance >= 0 ? 'success.dark' : 'error.dark',
                      }}
                    >
                      <Iconify icon="solar:chart-bold-duotone" width={22} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                      >
                        Net Flow
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mt: 0.25,
                          lineHeight: 1.2,
                          color: closingBalance >= 0 ? 'success.dark' : 'error.main',
                        }}
                      >
                        {closingBalance >= 0 ? '+' : ''}
                        {donor.currency || 'BDT'} {closingBalance.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        credits minus debits
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              </Grid>

              {/* Table Container */}
              <Card
                variant="outlined"
                sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper' }}
              >
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 950 }}>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: 'background.neutral',
                          '& th': {
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: 'text.secondary',
                            py: 1.5,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                          },
                        }}
                      >
                        <TableCell sx={{ width: 110 }}>Date</TableCell>
                        <TableCell sx={{ width: 150 }}>Ledger Code</TableCell>
                        <TableCell>Description / Project</TableCell>
                        <TableCell sx={{ width: 120 }}>Reference</TableCell>
                        <TableCell align="right" sx={{ width: 130 }}>
                          Debit
                        </TableCell>
                        <TableCell align="right" sx={{ width: 130 }}>
                          Credit
                        </TableCell>
                        <TableCell align="right" sx={{ width: 140 }}>
                          Balance
                        </TableCell>
                        <TableCell align="center" sx={{ width: 64 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ledgers.map((ledger) => {
                        const isCredit = ['donation', 'credit'].includes(ledger.transaction_type);
                        const txStyle = TX_TYPE_STYLES[ledger.transaction_type] || {
                          label: ledger.transaction_type,
                          bg: '#f5f5f5',
                          color: '#555',
                        };
                        const cur = ledger.currency || donor.currency || 'BDT';
                        const amt = `${cur} ${Number(ledger.amount || 0).toLocaleString()}`;

                        return (
                          <TableRow
                            key={ledger.id}
                            hover
                            sx={{
                              '& td': {
                                py: 1.5,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                fontSize: 13,
                              },
                              '&:last-child td': {
                                borderBottom: 'none',
                              },
                            }}
                          >
                            <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              {ledger.transaction_date}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontFamily: 'monospace',
                                  bgcolor: 'background.neutral',
                                  color: 'text.secondary',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 0.75,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  fontWeight: 600,
                                }}
                              >
                                {ledger.ledger_code}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.75}>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  flexWrap="wrap"
                                  useFlexGap
                                >
                                  <Chip
                                    label={txStyle.label}
                                    size="small"
                                    sx={{
                                      bgcolor: txStyle.bg,
                                      color: txStyle.color,
                                      fontWeight: 700,
                                      fontSize: 10,
                                      height: 18,
                                      textTransform: 'uppercase',
                                      borderRadius: 0.5,
                                    }}
                                  />
                                  {ledger.is_reconciled && (
                                    <Chip
                                      icon={
                                        <Iconify
                                          icon="solar:check-circle-bold"
                                          width={12}
                                          style={{ color: 'inherit' }}
                                        />
                                      }
                                      label="Reconciled"
                                      size="small"
                                      sx={{
                                        bgcolor: 'success.lighter',
                                        color: 'success.dark',
                                        fontWeight: 600,
                                        fontSize: 10,
                                        height: 18,
                                        borderRadius: 0.5,
                                        '& .MuiChip-icon': {
                                          color: 'inherit',
                                          ml: 0.5,
                                          mr: -0.25,
                                        },
                                      }}
                                    />
                                  )}
                                </Stack>
                                {(ledger.related_project || ledger.description) && (
                                  <Typography
                                    variant="body2"
                                    color="text.primary"
                                    sx={{
                                      fontWeight: 500,
                                      maxWidth: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {ledger.related_project || ledger.description}
                                  </Typography>
                                )}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {ledger.reference ? (
                                <Typography
                                  variant="body2"
                                  sx={{ color: 'text.secondary', fontWeight: 500 }}
                                >
                                  {ledger.reference}
                                </Typography>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{ color: 'text.disabled', fontStyle: 'italic' }}
                                >
                                  —
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: isCredit ? 'text.disabled' : 'error.main',
                                fontWeight: isCredit ? 400 : 600,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {isCredit ? '—' : `- ${amt}`}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: isCredit ? 'success.dark' : 'text.disabled',
                                fontWeight: isCredit ? 600 : 400,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {isCredit ? `+ ${amt}` : '—'}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                color: 'text.primary',
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {cur} {Number(ledger.balance || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Download invoice PDF">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadLedgerInvoice(ledger)}
                                  sx={{
                                    color: 'primary.main',
                                    bgcolor: 'primary.lighter',
                                    '&:hover': {
                                      bgcolor: 'primary.main',
                                      color: 'primary.contrastText',
                                    },
                                    transition: 'all 0.2s',
                                    width: 28,
                                    height: 28,
                                  }}
                                >
                                  <Iconify icon="solar:download-bold" width={14} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                    <TableFooter>
                      <TableRow
                        sx={{
                          bgcolor: 'background.neutral',
                          '& td': {
                            py: 1.5,
                            borderTop: '2px solid',
                            borderColor: 'divider',
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <TableCell sx={{ width: 110 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                          >
                            Entries
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {ledgers.length}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ width: 120 }} />
                        <TableCell />
                        <TableCell sx={{ width: 120 }} />

                        <TableCell align="right" sx={{ width: 130 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                          >
                            Total Debits
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="error.main"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            - {donor.currency || 'BDT'} {totalDebits.toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ width: 130 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                          >
                            Total Credits
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="success.dark"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            + {donor.currency || 'BDT'} {totalCredits.toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" sx={{ width: 140 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                            sx={{ fontWeight: 600, textTransform: 'uppercase' }}
                          >
                            Closing Balance
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {donor.currency || 'BDT'} {closingBalance.toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ width: 64 }} />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </Box>
              </Card>
            </Box>
          )}
        </TabPanel>

        {/* ── TAB 2 · Projects ────────────────────────────────────── */}
        <TabPanel value={tab} index={2}>
          <Box sx={{ p: 3 }}>
            {donorProjects.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No projects linked to this donor.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Summary strip */}
                <Stack
                  direction="row"
                  spacing={3}
                  sx={{
                    mb: 2.5,
                    pb: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total projects
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {donorProjects.length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Combined budget
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {donor.currency || 'BDT'}{' '}
                      {donorProjects
                        .reduce((sum, p) => sum + Number(p.budget_amount || 0), 0)
                        .toLocaleString()}
                    </Typography>
                  </Box>
                </Stack>

                {/* Project cards grid */}
                <Grid container spacing={2}>
                  {donorProjects.map((project) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={project.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: '1px solid #e5e7eb',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box sx={{ minWidth: 0, flex: 1, mr: 1 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {project.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {project.code}
                            </Typography>
                          </Box>
                          {project.status && (
                            <Chip
                              label={project.status}
                              size="small"
                              color={project.status === 'active' ? 'success' : 'default'}
                              sx={{
                                height: 20,
                                fontSize: 10,
                                textTransform: 'capitalize',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </Stack>
                        {project.budget_amount && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: 'block' }}
                          >
                            Budget: {project.currency || donor.currency || 'USD'}{' '}
                            {Number(project.budget_amount).toLocaleString()}
                          </Typography>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<Iconify icon="solar:add-circle-bold" width={16} />}
                          onClick={() => {
                            const url = `${paths.dashboard.projects.donors.ledgerCreate(id)}?projectId=${project.id}&projectTitle=${encodeURIComponent(project.title)}`;
                            window.open(url, '_blank');
                          }}
                          sx={{ mt: 1.5, fontSize: 11, minHeight: 28 }}
                        >
                          Create Ledger
                        </Button>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
}
