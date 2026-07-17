'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  X,
  Eye,
  Send,
  Plus,
  Edit,
  Clock,
  Users,
  Stamp,
  Globe,
  Search,
  XCircle,
  Download,
  FileText,
  BarChart2,
  DollarSign,
} from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { PageLoader } from '../../components/ui';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// ── status options (exact backend values) ────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'open', label: 'Open for Quotes' },
  { value: 'under_evaluation', label: 'Under Evaluation' },
  { value: 'closed', label: 'Closed' },
  { value: 'awarded', label: 'Awarded' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE_MAP = {
  draft: { variant: 'default', icon: FileText, label: 'Draft' },
  published: { variant: 'info', icon: Send, label: 'Published' },
  open: { variant: 'success', icon: Globe, label: 'Open for Quotes' },
  under_evaluation: { variant: 'warning', icon: BarChart2, label: 'Under Evaluation' },
  closed: { variant: 'primary', icon: Clock, label: 'Closed' },
  awarded: { variant: 'success', icon: Stamp, label: 'Awarded' },
  cancelled: { variant: 'danger', icon: XCircle, label: 'Cancelled' },
};

const URGENCY_BADGE_MAP = {
  critical: 'danger',
  urgent: 'warning',
  normal: 'default',
};

// ── URL builder (omits empty values) ─────────────────────────────────────────
function buildUrl(base, params) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return `${base}?${q}`;
}

// ── small pure helpers ────────────────────────────────────────────────────────
function statusBadge(status) {
  const cfg = STATUS_BADGE_MAP[status] ?? { variant: 'default', icon: FileText, label: status };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} size="sm">
      <Icon className="w-3 h-3 mr-1" />
      {cfg.label}
    </Badge>
  );
}

function urgencyBadge(urgency) {
  return (
    <Badge variant={URGENCY_BADGE_MAP[urgency] ?? 'default'} size="sm">
      {urgency}
    </Badge>
  );
}

function deadlineInfo(deadline) {
  const hours = (new Date(deadline).getTime() - Date.now()) / 3_600_000;
  if (hours < 0) return { text: 'Expired', color: 'text-red-600' };
  if (hours < 24) return { text: `${Math.floor(hours)}h left`, color: 'text-red-600' };
  if (hours < 72) return { text: `${Math.floor(hours / 24)}d left`, color: 'text-orange-600' };
  return { text: `${Math.floor(hours / 24)}d left`, color: 'text-green-600' };
}

// ─────────────────────────────────────────────────────────────────────────────
export function RFQList() {
  const router = useRouter();

  // ── filter state ─────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // debounced
  const [rfqNumberFilter, setRfqNumberFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // ── pagination (MUI is 0-based) ───────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── debounce search → reset page ─────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetPage = useCallback(() => setPage(0), []);

  // ── build API URL ─────────────────────────────────────────────────────────
  const apiUrl = useMemo(
    () =>
      buildUrl(`${endpoints.procurement_management.rfqs}simple_rfq/`, {
        search,
        rfq_number: rfqNumberFilter,
        status: statusFilter,
        category_name: categoryFilter,
        page: page + 1, // backend is 1-based
        page_size: rowsPerPage,
        pagination: 'true',
      }),
    [search, rfqNumberFilter, statusFilter, categoryFilter, page, rowsPerPage]
  );

  // summary + categories endpoints
  const summaryUrl = `${endpoints.procurement_management.rfqs}rfq_summary/`;
  const categoriesUrl = `${endpoints.procurement_management.item_category}?status=Active&pagination=false`;

  const { data: rfqData, loading } = useGetRequest(apiUrl);
  const { data: summaryData } = useGetRequest(summaryUrl);
  const { data: categoriesRaw } = useGetRequest(categoriesUrl);

  const categoryOptions = useMemo(
    () => (Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw?.results ?? [])),
    [categoriesRaw]
  );

  const rows = useMemo(() => rfqData?.results ?? [], [rfqData]);
  console.log('Fetched RFQ rows:', rows);
  const totalCount = rfqData?.count ?? 0;

  // ── map raw rows → display objects ───────────────────────────────────────
  const rfqs = useMemo(
    () =>
      rows.map((r) => ({
        id: String(r.id),
        rfqNumber: r.rfq_number || '',
        mrfRef:
          r.requisition_no || r.requisition_no || r.linked_requisitions?.[0]?.requisition_no || '',
        title: r.rfq_title || r.title || '',
        department: r.department_name || '',
        total_item_count: r.total_item_count ?? 0,
        category: r.category_name || '',
        estimatedAmount: Number(r.total_estimated_value) || 0,
        deadline: r.submission_deadline || '',
        publishedDate: r.published_date || '',
        invitedVendors: r.vendors_count || 0,
        submittedQuotes: r.submitted_vendors_count ?? 0,
        status: (r.status || 'draft').toLowerCase(),
        urgency: (r.urgency || 'normal').toLowerCase(),
        createdBy: r.created_by_name || '',
        autoRouted: (r.linked_requisitions?.length || 0) > 0,
      })),
    [rows]
  );

  // ── summary stats (from dedicated endpoint) ───────────────────────────────
  const summary = summaryData ?? {};
  // ── clear all filters ─────────────────────────────────────────────────────
  function clearAll() {
    setSearchInput('');
    setSearch('');
    setRfqNumberFilter('');
    setStatusFilter('');
    setCategoryFilter('');
    setPage(0);
  }
  const hasFilter = !!(search || rfqNumberFilter || statusFilter || categoryFilter);

  // ── MUI pagination handlers ───────────────────────────────────────────────
  const handleChangePage = useCallback((_, newPage) => setPage(newPage), []);
  const handleChangeRowsPerPage = useCallback((e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  }, []);

  // ── CSV export (fetches ALL matching rows, respects active filters) ────────
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const exportUrl = buildUrl(endpoints.procurement_management.rfqs, {
        search,
        rfq_number: rfqNumberFilter,
        status: statusFilter,
        category_name: categoryFilter,
        pagination: 'false', // fetch all records
      });
      const res = await axiosInstance.get(exportUrl);
      const allRows = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);

      const headers = [
        'RFQ Number',
        'Title',
        'MRF Ref',
        'Category',
        'Department',
        'Status',
        'Urgency',
        'Estimated Amount (BDT)',
        'Invited Vendors',
        'Submitted Quotes',
        'Submission Deadline',
        'Published Date',
        'Created By',
      ];

      const escape = (v) => {
        const s = String(v ?? '');
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const csvRows = [
        headers.join(','),
        ...allRows.map((r) =>
          [
            r.rfq_number || '',
            r.rfq_title || r.title || '',
            r.mr_number || r.requisition_no || '',
            r.category_name || '',
            r.department_name || '',
            r.status || '',
            r.urgency || '',
            r.total_estimated_value ?? 0,
            r.suppliers_count ?? 0,
            r.responses_received ?? 0,
            r.submission_deadline || '',
            r.published_date || '',
            r.created_by_name || '',
          ]
            .map(escape)
            .join(',')
        ),
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().slice(0, 10);
      link.download = `rfq-list-${today}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [search, rfqNumberFilter, statusFilter, categoryFilter]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return <PageLoader message="Loading RFQ list..." />;
  }
  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">RFQ Management</h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage Request for Quotations from approved MRFs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(paths.dashboard.procurement.rfq.distribution)}
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Distribution
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(paths.dashboard.procurement.rfq.monitoring)}
          >
            <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
            Monitoring
          </Button>
          <div className="w-px h-5 bg-border" />
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Link href={paths.dashboard.procurement.rfq.create}>
            <Button variant="primary" size="sm">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create New RFQ
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats from summary endpoint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <StatCard title="Total RFQs" value={summary.total ?? 0} icon={FileText} color="blue" />
        <StatCard
          title="Open / Published"
          value={(summary.open ?? 0) + (summary.published ?? 0)}
          icon={Globe}
          color="green"
        />
        <StatCard
          title="Under Evaluation"
          value={summary.under_evaluation ?? 0}
          icon={BarChart2}
          color="orange"
        />
        <StatCard title="Awarded" value={summary.awarded ?? 0} icon={Stamp} color="purple" />
        <StatCard
          title="Vendors Invited"
          value={summary.total_vendors ?? 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Value"
          value={`BDT ${((summary.total_estimated_value ?? 0) / 100000).toFixed(1)}L`}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Pipeline strip */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">RFQ Pipeline</h3>
            <Badge variant="info" size="sm">
              Live
            </Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              {
                label: 'Draft',
                count: summary.draft ?? 0,
                color: 'bg-gray-100   text-gray-700   border-gray-200',
              },
              {
                label: 'Published',
                count: summary.published ?? 0,
                color: 'bg-blue-50    text-blue-700   border-blue-200',
              },
              {
                label: 'Open for Quotes',
                count: summary.open ?? 0,
                color: 'bg-green-50   text-green-700  border-green-200',
              },
              {
                label: 'Under Evaluation',
                count: summary.under_evaluation ?? 0,
                color: 'bg-orange-50  text-orange-700 border-orange-200',
              },
              {
                label: 'Closed',
                count: summary.closed ?? 0,
                color: 'bg-purple-50  text-purple-700 border-purple-200',
              },
              {
                label: 'Awarded',
                count: summary.awarded ?? 0,
                color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              },
              {
                label: 'Cancelled',
                count: summary.cancelled ?? 0,
                color: 'bg-red-50     text-red-700    border-red-200',
              },
            ].map((s) => (
              <button
                type="button"
                key={s.label}
                onClick={() => {
                  setStatusFilter(
                    s.label === 'Open for Quotes'
                      ? 'open'
                      : s.label === 'Under Evaluation'
                        ? 'under_evaluation'
                        : s.label.toLowerCase()
                  );
                  resetPage();
                }}
                className={`p-3 rounded-lg border text-center transition-opacity hover:opacity-80 ${s.color}`}
              >
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-[10px] font-medium mt-1">{s.label}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card className="mb-6 border-border/60">
        <CardBody className="py-4">
          {/* Label row */}
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Filters
            </span>
            {hasFilter && (
              <span className="ml-1 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <input
                type="text"
                placeholder="Search title or RFQ number…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-9 py-2 text-sm bg-muted/40 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-border" />

            {/* Status */}
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  resetPage();
                }}
                className="w-full pl-3 pr-8 py-2 text-sm bg-muted/40 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                <svg
                  className="w-3.5 h-3.5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {statusFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('');
                    resetPage();
                  }}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category */}
            <div className="relative min-w-[160px]">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  resetPage();
                }}
                className="w-full pl-3 pr-8 py-2 text-sm bg-muted/40 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all appearance-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                <svg
                  className="w-3.5 h-3.5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {categoryFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('');
                    resetPage();
                  }}
                  className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Clear all */}
            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-destructive  border border-destructive/30 hover:border-destructive rounded-lg transition-all whitespace-nowrap"
              >
                <X className="w-3 h-3" /> Clear All
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title={`RFQ List (${totalCount})`}
          description="Auto-generated from approved MRFs with vendor category-based distribution"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground">RFQ No / MRF Ref</th>
                  <th className="pb-3 text-xs font-semibold text-foreground">Title</th>
                  <th className="pb-3 text-xs font-semibold text-foreground">Items</th>
                  <th className="pb-3 text-xs font-semibold text-foreground">Category</th>
                  <th className="pb-3 text-xs font-semibold text-foreground text-right">
                    Est. Amount
                  </th>
                  <th className="pb-3 pl-6 text-xs font-semibold text-foreground">Deadline</th>
                  <th className="pb-3 text-xs font-semibold text-foreground text-center">
                    Vendors
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground">Status</th>
                  <th className="pb-3 text-xs font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && rfqs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      No RFQs found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  rfqs.map((rfq) => {
                    const dl = deadlineInfo(rfq.deadline);
                    return (
                      <tr
                        key={rfq.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3">
                          <Link
                            href={paths.dashboard.procurement.rfq.detail(rfq.rfqNumber)}
                            className="font-mono font-semibold text-primary hover:underline text-sm"
                          >
                            {rfq.rfqNumber}
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Badge variant="default" size="sm">
                              {rfq.mrfRef}
                            </Badge>
                            {rfq.autoRouted && (
                              <Badge variant="info" size="sm">
                                Auto-routed
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground max-w-[200px] truncate">
                            {rfq.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{rfq.department}</p>
                        </td>
                        <td className="py-3">
                          <p className="text-sm font-medium text-foreground max-w-[200px] truncate">
                            {rfq.total_item_count}
                          </p>
                        </td>
                        <td className="py-3">
                          <Badge variant="default" size="sm">
                            {rfq.category}
                          </Badge>
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <span className="text-sm font-semibold">
                            BDT {rfq.estimatedAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 pl-6">
                          <p className="text-xs">
                            {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : '—'}
                          </p>
                          {rfq.deadline && (
                            <p className={`text-xs font-medium ${dl.color}`}>{dl.text}</p>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-sm font-bold text-primary">
                              {rfq.submittedQuotes}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              / {rfq.invitedVendors}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">submitted</p>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col gap-1">
                            {statusBadge(rfq.status)}
                            {urgencyBadge(rfq.urgency)}
                          </div>
                        </td>
                        <td className="py-3">
                          <Link href={paths.dashboard.procurement.rfq.detail(rfq.rfqNumber)}>
                            <button
                              type="button"
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                            </button>
                          </Link>
                          <Link
                            href={`${paths.dashboard.procurement.rfq.create}?edit_rfq=${rfq.rfqNumber}`}
                          >
                            <button
                              type="button"
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="View"
                            >
                              <Edit className="w-3.5 h-3.5 text-primary" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* MUI Pagination */}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Rows:"
            sx={{ borderTop: '1px solid var(--border)', mt: 1 }}
          />
        </CardBody>
      </Card>

      {/* Notice */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-blue-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Category-Based Vendor Visibility —</strong> RFQs
              are visible ONLY to vendors registered under selected categories. Non-matching vendors
              cannot view or respond.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
