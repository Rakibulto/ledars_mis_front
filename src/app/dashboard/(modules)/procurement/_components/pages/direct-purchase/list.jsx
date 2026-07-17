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

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const STATUS_OPTIONS = [
  { value:'', label:'All Status' },
  { value:'Draft', label:'Draft' },
  // { value:'Pending Approval', label:'Pending Approval' },
  { value:'Approved', label:'Approved' },
  { value:'Rejected', label:'Rejected' },
  { value:'Converted to GRN', label:'Converted to GRN' },
];

const PRIORITY_OPTIONS = [
  { value:'', label:'All Priority' },
  { value:'Urgent', label:'Urgent' },
  { value:'High', label:'High' },
  { value:'Medium', label:'Medium' },
  { value:'Low', label:'Low' },
];

const STATUS_BADGE = {
  Draft: { variant:'default', icon:FileText, className:'' },
  'Pending Approval': { variant:'warning', icon:Clock, className:'' },
  Approved: { variant:'success', icon:CheckCircle, className:'' },
  Rejected: { variant:'danger', icon:XCircle, className:'bg-red-100 text-red-700 border-red-400' },
  'Converted to GRN': { variant:'success', icon:ArrowRight, className:'' },
};

const PRIORITY_BADGE = {
  Low:    'bg-blue-100 text-blue-700 border border-blue-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  High:   'bg-orange-100 text-orange-700 border border-orange-200',
  Urgent: 'bg-red-100 text-red-700 border border-red-200',
};

function buildUrl(base, params) {
  const q = Object.entries(params)
    .filter(([,v]) => v!==''&&v!==null&&v!==undefined)
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `${base}?${q}` : base;
}

export function DirectPurchaseList() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showMore, setShowMore] = useState(false);
  const [dpNoFilter, setDpNoFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [shopFilter, setShopFilter] = useState('');
  const [createdAfter, setCreatedAfter] = useState('');
  const [createdBefore, setCreatedBefore] = useState('');
  const [deliveryAfter, setDeliveryAfter] = useState('');
  const [deliveryBefore, setDeliveryBefore] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const deleteRequest = useDeleteRequest;

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(0); }, 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  const resetPage = useCallback(() => setPage(0), []);

  const apiUrl = useMemo(() => buildUrl(endpoints.procurement_management.direct_purchases, {
    search, dp_number: dpNoFilter, status: statusFilter, priority: priorityFilter,
    department_name: departmentFilter, shop: shopFilter,
    created_after: createdAfter, created_before: createdBefore,
    delivery_after: deliveryAfter, delivery_before: deliveryBefore,
    min_amount: minAmount, max_amount: maxAmount,
    page: page + 1, page_size: rowsPerPage, pagination: 'true',
  }), [search, dpNoFilter, statusFilter, priorityFilter, departmentFilter, shopFilter,
      createdAfter, createdBefore, deliveryAfter, deliveryBefore, minAmount, maxAmount, page, rowsPerPage]);

  const { data: dpData, loading } = useGetRequest(apiUrl);
  const { data: statsData } = useGetRequest(`${endpoints.procurement_management.direct_purchases}summary/`);

  const rows = useMemo(() => dpData?.results ?? [], [dpData]);
  const totalCount = dpData?.count ?? 0;

  const extraFilterCount = [dpNoFilter, priorityFilter, departmentFilter, shopFilter,
    createdAfter, createdBefore, deliveryAfter, deliveryBefore, minAmount, maxAmount].filter(Boolean).length;
  const hasAnyFilter = search || statusFilter || extraFilterCount > 0;

  function clearAllFilters() {
    setSearchInput(''); setSearch(''); setDpNoFilter('');
    setStatusFilter('');
    setPriorityFilter(''); setDepartmentFilter(''); setShopFilter('');
    setCreatedAfter(''); setCreatedBefore('');
    setDeliveryAfter(''); setDeliveryBefore('');
    setMinAmount(''); setMaxAmount(''); setPage(0);
  }

  const statusBadge = (st) => {
    const cfg = STATUS_BADGE[st] ?? { variant:'default', icon:FileText, className:'' };
    const Icon = cfg.icon;
    return <Badge variant={cfg.variant} size="sm" className={`whitespace-nowrap ${cfg.className ?? ''}`}><Icon className="w-3 h-3 mr-1 inline" />{st||'—'}</Badge>;
  };

  const priorityBadge = (p) => (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[p] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {p || '—'}
    </span>
  );

  const fmtAmount = (val) => {
    const n = parseFloat(val);
    if (Number.isNaN(n)) return '—';
    return `৳\u202f${n.toLocaleString('en-BD',{maximumFractionDigits:2})}`;
  };

  const fmtDate = (iso) => { if (!iso) return '—'; return iso.split('T')[0]; };

  const totalValueLabel = useMemo(() => {
    const amt = statsData?.total_amount;
    if (!amt) return '—';
    const n = parseFloat(amt);
    if (n >= 10_000_000) return `৳ ${(n/10_000_000).toFixed(2)} Cr`;
    if (n >= 100_000) return `৳ ${(n/100_000).toFixed(2)} L`;
    return `৳ ${n.toLocaleString()}`;
  }, [statsData]);

  return (
    <div className="p-4 md:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
            Direct Purchase List
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage Direct Purchases · Draft → Approved → Converted to GRN
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Link href={paths.dashboard.procurement.directPurchase.create}>
            <Button variant="primary" size="sm"><Plus className="w-4 h-4 mr-2" />New DP</Button>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total DPs" value={statsData?.total ?? '—'} icon={FileText} color="blue" />
        <StatCard title="Approved" value={statsData?.approved ?? '—'} icon={CheckCircle} color="green" />
        <StatCard title="Rejected" value={statsData?.rejected ?? '—'} icon={XCircle} color="red" />
        <StatCard title="Total Value" value={totalValueLabel} icon={DollarSign} color="purple" />
      </div>

      {/* Pipeline Summary */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">DP Pipeline Summary</h3>
            <Badge variant="info" size="sm">Live</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Draft', count:statsData?.draft??0, cls:'bg-gray-50 text-gray-700 border-gray-200' },
              { label:'Approved', count:statsData?.approved??0, cls:'bg-green-50 text-green-700 border-green-200' },
              { label:'Rejected', count:statsData?.rejected??0, cls:'bg-red-50 text-red-700 border-red-200' },
              { label:'Converted to GRN', count:statsData?.converted_to_grn??0, cls:'bg-emerald-50 text-emerald-700 border-emerald-200' },
            ].map((s) => (
              <div key={s.label} className={`p-3 rounded-lg border text-center ${s.cls}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card className="mb-4">
        <CardBody>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search by DP no, shop, department…" value={searchInput}
                onChange={(e)=>setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="relative">
              <input type="text" placeholder="DP-2026-XXX" value={dpNoFilter}
                onChange={(e)=>{setDpNoFilter(e.target.value);resetPage();}}
                className="w-40 px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono" />
              {dpNoFilter && (
                <button type="button" onClick={()=>{setDpNoFilter('');resetPage();}} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={(e)=>{setStatusFilter(e.target.value);resetPage();}}
                options={STATUS_OPTIONS}
              />
            </div>
            <button type="button" onClick={()=>setShowMore((v)=>!v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showMore?'border-primary text-primary bg-primary/5':'border-input text-muted-foreground hover:bg-muted'}`}>
              <Filter className="w-4 h-4" />More Filters
              {extraFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-white">{extraFilterCount}</span>
              )}
              {showMore ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {hasAnyFilter && (
              <button type="button" onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <X className="w-4 h-4" />Clear Filters
              </button>
            )}
          </div>

          {showMore && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Priority</p>
                <select value={priorityFilter} onChange={(e)=>{setPriorityFilter(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
                  {PRIORITY_OPTIONS.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Department</p>
                <input type="text" placeholder="Department name" value={departmentFilter}
                  onChange={(e)=>{setDepartmentFilter(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Shop / Seller</p>
                <input type="text" placeholder="Shop name" value={shopFilter}
                  onChange={(e)=>{setShopFilter(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Min Amount (৳)</p>
                <input type="number" placeholder="0" value={minAmount}
                  onChange={(e)=>{setMinAmount(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Max Amount (৳)</p>
                <input type="number" placeholder="No limit" value={maxAmount}
                  onChange={(e)=>{setMaxAmount(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Created After</p>
                <input type="date" value={createdAfter} onChange={(e)=>{setCreatedAfter(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Created Before</p>
                <input type="date" value={createdBefore} onChange={(e)=>{setCreatedBefore(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Delivery After</p>
                <input type="date" value={deliveryAfter} onChange={(e)=>{setDeliveryAfter(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <p className="block text-xs font-medium text-muted-foreground mb-1">Delivery Before</p>
                <input type="date" value={deliveryBefore} onChange={(e)=>{setDeliveryBefore(e.target.value);resetPage();}}
                  className="w-full px-3 py-2 text-sm border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader
          title={`DP List ${totalCount ? `(${totalCount})` : ''}`}
          description="Server-side filtered · paginated list of all Direct Purchases"
        />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 mr-2 animate-spin" />Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-sm gap-2">
                <FileText className="w-8 h-8 opacity-30" />
                No direct purchases found
                {hasAnyFilter && (
                  <button type="button" onClick={clearAllFilters} className="text-primary underline text-xs mt-1">Clear all filters</button>
                )}
              </div>
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">DP Number</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Shop / Seller</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Department</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Priority</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right whitespace-nowrap">Total Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Purchase Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Delivery By</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((dp, idx) => (
                    <tr key={dp.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{page * rowsPerPage + idx + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={paths.dashboard.procurement.directPurchase.detail(dp.id)}
                          className="font-mono font-semibold text-primary hover:underline whitespace-nowrap">
                          {dp.dp_number || `DP-${dp.id}`}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {dp.item_count != null ? `${dp.item_count} item${dp.item_count!==1?'s':''}` : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground truncate max-w-[130px]">{dp.shop_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{dp.reference_number || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground truncate max-w-[120px]">{dp.department_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{dp.category_name || ''}</p>
                      </td>
                      <td className="px-4 py-3">{priorityBadge(dp.priority)}</td>
                      <td className="px-4 py-3">{statusBadge(dp.status)}</td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{fmtAmount(dp.total_amount)}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(dp.purchase_date)}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(dp.expected_delivery_date)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={paths.dashboard.procurement.directPurchase.detail(dp.id)}>
                            <button className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          <Link href={`${paths.dashboard.procurement.directPurchase.create}?edit=${dp.id}`}>
                            <button className="rounded p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="border-t border-border">
              <TablePagination
                component="div"
                count={totalCount}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[10, 25, 50, 100]}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
