'use client';

import Link from 'next/link';
import { mutate } from 'swr';
import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  X,
  Eye,
  Plus,
  Edit,
  Clock,
  Search,
  Filter,
  Delete,
  XCircle,
  FileText,
  Download,
  ChevronUp,
  DollarSign,
  ArrowRight,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { endpoints } from 'src/utils/axios';

import { useGetRequest, useDeleteRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

// ─── status values that come from the backend ────────────────────────────────
const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Pending Approval', label: 'Pending Approval' },
  { value: 'Finance Review', label: 'Finance Review' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Converted to RFQ', label: 'Converted to RFQ' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priority' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

// map backend status → badge colour
const STATUS_BADGE = {
  Draft: { variant: 'default', icon: FileText },
  'Pending Approval': { variant: 'warning', icon: Clock },
  'Finance Review': { variant: 'info', icon: DollarSign },
  Approved: { variant: 'success', icon: CheckCircle },
  Rejected: { variant: 'danger', icon: XCircle },
  'Converted to RFQ': { variant: 'success', icon: ArrowRight },
};

const PRIORITY_BADGE = {
  Urgent: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'default',
};

// statuses that count as "fully approved / converted"
const DONE_STATUSES = ['Approved', 'Converted to RFQ'];
// statuses that count as "pending in workflow"
const PENDING_STATUSES = ['Pending Approval', 'Finance Review'];

function buildUrl(base, params) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `${base}?${q}` : base;
}

export function RequisitionList() {
  // ── basic filters ────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState(''); // raw typed value
  const [search, setSearch] = useState(''); // debounced → sent to API
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0); // MUI TablePagination is 0-based
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── extra / "more" filters ───────────────────────────────────────────────
  const [showMore, setShowMore] = useState(false);
  const [requisitionNoFilter, setRequisitionNoFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const [deliveryAfter, setDeliveryAfter] = useState('');
  const [deliveryBefore, setDeliveryBefore] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const deleteRequest = useDeleteRequest;
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // debounce search – reset page on change
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  // reset page whenever any filter changes
  const resetPage = useCallback(() => setPage(0), []);

  // ── build API URL ────────────────────────────────────────────────────────
  const apiUrl = useMemo(
    () =>
      buildUrl(endpoints.procurement_management.material_requisitions, {
        search,
        requisition_no: requisitionNoFilter,
        status: statusFilter,
        priority: priorityFilter,
        department_name: departmentFilter,
        project: projectFilter,
        created_after: createdAfter,
        created_before: createdBefore,
        delivery_after: deliveryAfter,
        delivery_before: deliveryBefore,
        min_amount: minAmount,
        max_amount: maxAmount,
        page: page + 1, // backend is 1-based
        page_size: rowsPerPage,
        pagination: 'true',
      }),
    [
      search,
      requisitionNoFilter,
      statusFilter,
      priorityFilter,
      departmentFilter,
      projectFilter,
      createdAfter,
      createdBefore,
      deliveryAfter,
      deliveryBefore,
      minAmount,
      maxAmount,
      page,
      rowsPerPage,
    ]
  );

  const { data: requisitionsData, loading } = useGetRequest(apiUrl);
  const { data: statsData } = useGetRequest(
    `${endpoints.procurement_management.material_requisitions}stats/`
  );

  console.log('requisitionsData', requisitionsData);
  console.log('statsData', statsData);
  const rows = useMemo(() => requisitionsData?.results ?? [], [requisitionsData]);
  const totalCount = requisitionsData?.count ?? 0;

  // ── derive active filter count (for badge on "More Filters") ─────────────
  const extraFilterCount = [
    requisitionNoFilter,
    priorityFilter,
    departmentFilter,
    projectFilter,
    createdAfter,
    createdBefore,
    deliveryAfter,
    deliveryBefore,
    minAmount,
    maxAmount,
  ].filter(Boolean).length;

  const hasAnyFilter = search || statusFilter || requisitionNoFilter || extraFilterCount > 0;

  function clearAllFilters() {
    setSearchInput('');
    setSearch('');
    setRequisitionNoFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setDepartmentFilter('');
    setProjectFilter('');
    setCreatedAfter('');
    setCreatedBefore('');
    setDeliveryAfter('');
    setDeliveryBefore('');
    setMinAmount('');
    setMaxAmount('');
    setPage(0);
  }

  // ── small helpers ────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const cfg = STATUS_BADGE[status] ?? { variant: 'default', icon: FileText };
    const Icon = cfg.icon;
    return (
      <Badge variant={cfg.variant} size="sm" className="whitespace-nowrap">
        <Icon className="w-3 h-3 mr-1 inline" />
        {status || '—'}
      </Badge>
    );
  };

  const priorityBadge = (priority) => (
    <Badge variant={PRIORITY_BADGE[priority] ?? 'default'} size="sm">
      {priority || '—'}
    </Badge>
  );

  const fmtAmount = (val) => {
    const n = parseFloat(val);
    if (Number.isNaN(n)) return '—';
    return `৳\u202f${n.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return iso.split('T')[0];
  };

  const approverName = (row) => {
    const steps = Array.isArray(row.approval_steps) ? row.approval_steps : [];
    const pendingSteps = steps.filter((step) => step.status === 'Pending');
    if (pendingSteps.length > 0) {
      const names = Array.from(
        new Set(pendingSteps.map((step) => step.approver_name || step.approver).filter(Boolean))
      );
      return names.length > 0 ? names.join(', ') : '—';
    }

    const actedSteps = steps.filter((step) => step.status !== 'Pending');
    if (actedSteps.length > 0) {
      const names = Array.from(
        new Set(actedSteps.map((step) => step.approver_name || step.approver).filter(Boolean))
      );
      return names.length > 0 ? names.join(', ') : '—';
    }

    if (row.approver2_info?.employee_name) return row.approver2_info.employee_name;
    if (row.approver1_info?.employee_name) return row.approver1_info.employee_name;
    return '—';
  };

  const approvalModeLabel = (row) => {
    const steps = Array.isArray(row.approval_steps) ? row.approval_steps : [];
    const mode = steps.find((step) => step.approval_mode)?.approval_mode;
    if (mode === 'any_approver') return 'Independent Approval';
    if (mode === 'all_approvers') return 'Unanimous Approval';
    return null;
  };

  const progressDots = (status) => {
    const STEPS = ['Draft', 'Pending Approval', 'Finance Review', 'Approved'];
    const idx = STEPS.indexOf(status);
    return (
      <div className="flex items-center gap-0.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold
                ${
                  status === 'Rejected'
                    ? 'bg-red-200'
                    : i < idx || i === idx
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                }`}
            >
              {(i < idx || i === idx) && status !== 'Rejected' && (
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              )}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-3 h-0.5 ${i < idx ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const approvalProgress = (row) => {
    const steps = Array.isArray(row.approval_steps) ? row.approval_steps : [];
    if (!steps.length) return progressDots(row.status);

    // If overall status is approved or converted, show all green regardless of individual steps
    if (DONE_STATUSES.includes(row.status)) {
      const levels = Array.from(new Set(steps.map((step) => step.approval_level))).sort(
        (a, b) => a - b
      );
      return (
        <div className="flex items-center gap-1">
          {levels.map((level) => (
            <div
              key={level}
              title={`Level ${level}: Approved`}
              className="w-3.5 h-3.5 rounded-full bg-green-500"
            />
          ))}
        </div>
      );
    }

    // If rejected, show all red
    if (row.status === 'Rejected') {
      const levels = Array.from(new Set(steps.map((step) => step.approval_level))).sort(
        (a, b) => a - b
      );
      return (
        <div className="flex items-center gap-1">
          {levels.map((level) => (
            <div
              key={level}
              title={`Level ${level}: Rejected`}
              className="w-3.5 h-3.5 rounded-full bg-red-500"
            />
          ))}
        </div>
      );
    }

    // For pending statuses, show based on individual step statuses
    const levels = Array.from(new Set(steps.map((step) => step.approval_level))).sort(
      (a, b) => a - b
    );

    return (
      <div className="flex items-center gap-1">
        {levels.map((level) => {
          const levelSteps = steps.filter((step) => step.approval_level === level);
          const hasRejected = levelSteps.some(
            (step) => step.status === 'Rejected' || step.status === 'Returned'
          );
          const hasPending = levelSteps.some((step) => step.status === 'Pending');
          const colorClass = hasRejected
            ? 'bg-red-500'
            : hasPending
              ? 'bg-amber-500'
              : 'bg-green-500';
          const total = levelSteps.length;
          const approved = levelSteps.filter((step) => step.status === 'Approved').length;
          const title = `Level ${level}: ${approved}/${total} approved${hasRejected ? ', rejected' : hasPending ? ', pending' : ''}`;
          return (
            <div key={level} title={title} className={`w-3.5 h-3.5 rounded-full ${colorClass}`} />
          );
        })}
      </div>
    );
  };

  // ── formatted total value label ─────────────────────────────────────────
  const totalValueLabel = useMemo(() => {
    const amt = statsData?.total_amount;
    if (!amt) return '—';
    const n = parseFloat(amt);
    if (n >= 10_000_000) return `৳ ${(n / 10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000) return `৳ ${(n / 100_000).toFixed(2)} L`;
    return `৳ ${n.toLocaleString()}`;
  }, [statsData]);

  return (
    <div className="p-4 md:p-8">
      {/* ── page header ── */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
            Material Requisition Forms
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage MRFs · Pending Approval → Finance Review → Approved → Converted to RFQ
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Link href="/dashboard/procurement/requisitions/create">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New MRF
            </Button>
          </Link>
        </div>
      </div>

      {/* ── stats row from /stats/ endpoint ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total MRFs" value={statsData?.total ?? '—'} icon={FileText} color="blue" />
        <StatCard
          title="Pending Approval"
          value={statsData?.pending_approval ?? '—'}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Approved"
          value={statsData?.approved ?? '—'}
          icon={CheckCircle}
          color="green"
        />
        <StatCard title="Rejected" value={statsData?.rejected ?? '—'} icon={XCircle} color="red" />
        <StatCard title="Total Value" value={totalValueLabel} icon={DollarSign} color="purple" />
      </div>

      {/* ── pipeline summary from /stats/ ── */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">MRF Pipeline Summary</h3>
            <Badge variant="info" size="sm">
              Live
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: 'Draft',
                count: statsData?.draft ?? 0,
                cls: 'bg-gray-50 text-gray-700 border-gray-200',
              },
              {
                label: 'Pending Approval',
                count: statsData?.pending_approval ?? 0,
                cls: 'bg-amber-50 text-amber-700 border-amber-200',
              },
              {
                label: 'Finance Review',
                count: statsData?.finance_review ?? 0,
                cls: 'bg-blue-50 text-blue-700 border-blue-200',
              },
              {
                label: 'Approved',
                count: statsData?.approved ?? 0,
                cls: 'bg-green-50 text-green-700 border-green-200',
              },
              {
                label: 'Rejected',
                count: statsData?.rejected ?? 0,
                cls: 'bg-red-50 text-red-700 border-red-200',
              },
              {
                label: 'Converted to RFQ',
                count: statsData?.converted_to_rfq ?? 0,
                cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
              },
            ].map((s) => (
              <div key={s.label} className={`p-3 rounded-lg border text-center ${s.cls}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* ── filters ── */}
      <Card className="mb-4">
        <CardBody>
          {/* primary row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by MRF no, department, project, requester…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* requisition no exact filter */}
            <div className="relative">
              <input
                type="text"
                placeholder="REQ-2026-XXXX"
                value={requisitionNoFilter}
                onChange={(e) => {
                  setRequisitionNoFilter(e.target.value);
                  resetPage();
                }}
                className="w-44 px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              {requisitionNoFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setRequisitionNoFilter('');
                    resetPage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* more filters toggle */}
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors
                ${showMore ? 'border-primary text-primary bg-primary/5' : 'border-input text-muted-foreground hover:bg-muted'}`}
            >
              <Filter className="w-4 h-4" />
              More Filters
              {extraFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-white">
                  {extraFilterCount}
                </span>
              )}
              {showMore ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {/* clear all */}
            {hasAnyFilter && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* extra filters panel */}
          {showMore && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* priority */}
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Priority</p>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* department */}
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Department</p>
                <input
                  type="text"
                  placeholder="e.g. Finance & Accounts"
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* project */}
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Project</p>
                <input
                  type="text"
                  placeholder="Project name or code"
                  value={projectFilter}
                  onChange={(e) => {
                    setProjectFilter(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* min/max amount */}
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Amount (৳)
                </p>
                <input
                  type="number"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => {
                    setMinAmount(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Amount (৳)
                </p>
                <input
                  type="number"
                  placeholder="No limit"
                  value={maxAmount}
                  onChange={(e) => {
                    setMaxAmount(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* created date range */}
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">
                  Created After
                </p>
                <input
                  type="date"
                  value={createdAfter}
                  onChange={(e) => {
                    setCreatedAfter(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">
                  Created Before
                </p>
                <input
                  type="date"
                  value={createdBefore}
                  onChange={(e) => {
                    setCreatedBefore(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* delivery date range */}
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">
                  Delivery After
                </p>
                <input
                  type="date"
                  value={deliveryAfter}
                  onChange={(e) => {
                    setDeliveryAfter(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">
                  Delivery Before
                </p>
                <input
                  type="date"
                  value={deliveryBefore}
                  onChange={(e) => {
                    setDeliveryBefore(e.target.value);
                    resetPage();
                  }}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── main table card ── */}
      <Card>
        <CardHeader
          title={`MRF List ${totalCount ? `(${totalCount})` : ''}`}
          description="Server-side filtered · paginated list of all Material Requisition Forms"
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
                <FileText className="w-8 h-8 opacity-30" />
                No requisitions found
                {hasAnyFilter && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-primary underline text-xs mt-1"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      #
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      MRF No./version
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Requester/Office
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Project/ Category
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Budget Code
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Workflow Status
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Current Approver
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Progress
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((req, idx) => (
                    <tr
                      key={req.id}
                      className="border-b border-border hover:bg-muted/40 transition-colors"
                    >
                      {/* serial */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {page * rowsPerPage + idx + 1}
                      </td>

                      {/* MRF No + version */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/procurement/requisitions/${req.id}`}
                          className="font-mono font-semibold text-primary hover:underline whitespace-nowrap"
                        >
                          {req.requisition_no}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          v{req.version}
                          {priorityBadge(req?.priority)}
                          {/* {req.priority} */}
                        </div>
                      </td>
                      {/* requester/office */}
                      <td className="px-4 py-3 max-w-[130px]">
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {req?.created_by?.username}
                        </div>
                        <p className="truncate">{req.requesting_office_info?.name || '—'}</p>
                        {req.requesting_office_info?.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {req.requesting_office_info.name}
                          </p>
                        )}
                      </td>

                      {/* project */}
                      <td className="px-4 py-3 max-w-[150px]">
                        <p className="truncate font-medium">{req.project_info?.name || '—'}</p>
                        {req.project_info?.code && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {req.project_info.code}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          v{req.category_name}
                        </div>
                      </td>

                      {/* budget code */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                        {req.budget_code_display?.name || '—'}
                      </td>

                      {/* amount */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                        {fmtAmount(req.total_amount)}
                      </td>

                      {/* workflow status */}
                      <td className="px-4 py-3">{statusBadge(req.status)}</td>

                      {/* current approver */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        <div>{approverName(req)}</div>
                        {approvalModeLabel(req) && (
                          <div className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                            {approvalModeLabel(req)}
                          </div>
                        )}
                      </td>

                      {/* progress dots */}
                      <td className="px-4 py-3">{approvalProgress(req)}</td>

                      {/* actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/procurement/requisitions/${req.requisition_no}`}>
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                          </Link>
                          <Link
                            href={`/dashboard/procurement/requisitions/${req.requisition_no}/timeline`}
                          >
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                              title="Timeline / Audit Trail"
                            >
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </Link>
                          <Link
                            href={`/dashboard/procurement/requisitions/create/?edit=${req?.id}`}
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(req.id)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Delete className="w-4 h-4 text-error" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── MUI TablePagination ── */}
          {!loading && totalCount > 0 && (
            <div className="border-t border-border">
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage="Rows per page:"
                sx={{ fontSize: '0.8rem' }}
              />
            </div>
          )}
        </CardBody>
      </Card>
      {/* ── Delete Confirmation Dialog ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Delete className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Delete Requisition?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This action cannot be undone. The MRF record will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </Button>
              <Button
                variant="error"
                size="sm"
                onClick={async () => {
                  await deleteRequest(
                    `${endpoints.procurement_management.material_requisitions}${confirmDeleteId}/`
                  );
                  mutate(apiUrl);
                  setConfirmDeleteId(null);
                }}
              >
                <Delete className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
