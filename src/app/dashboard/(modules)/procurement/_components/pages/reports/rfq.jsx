'use client';

import { useMemo, useState } from 'react';
import { Users, Clock, CheckCircle, MessageSquare, AlertTriangle } from 'lucide-react';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const STATUS_BADGE_MAP = {
  draft: { variant: 'default', label: 'Draft' },
  published: { variant: 'info', label: 'Published' },
  open: { variant: 'success', label: 'Open' },
  under_evaluation: { variant: 'warning', label: 'Under Evaluation' },
  closed: { variant: 'primary', label: 'Closed' },
  awarded: { variant: 'success', label: 'Awarded' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
};

const ACTIVE_STATUSES = ['published', 'open', 'under_evaluation'];

function formatBDT(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `à§³${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `à§³${(n / 100000).toFixed(2)} L`;
  return `à§³${n.toLocaleString('en-IN')}`;
}

export function RFQReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // â”€â”€ API URLs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('published_after', dateFrom);
    if (dateTo) params.set('published_before', dateTo);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryFilter) params.set('category_name', categoryFilter);
    const qs = params.toString();
    return `${endpoints.procurement_management.rfqs}simple_rfq/${qs ? `?${qs}` : ''}`;
  }, [dateFrom, dateTo, statusFilter, categoryFilter]);

  const summaryUrl = `${endpoints.procurement_management.rfqs}rfq_summary/`;
  const categoriesUrl = `${endpoints.procurement_management.item_category}?status=Active&pagination=false`;

  const { data: rawData, loading } = useGetRequest(apiUrl);
  const { data: summaryData } = useGetRequest(summaryUrl);
  const { data: categoriesRaw } = useGetRequest(categoriesUrl);

  const rows = useMemo(
    () => (Array.isArray(rawData) ? rawData : (rawData?.results ?? [])),
    [rawData]
  );
  const summary = summaryData ?? {};
  const categoryOptions = useMemo(
    () => (Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw?.results ?? [])),
    [categoriesRaw]
  );

  // â”€â”€ KPI stats from summary endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const stats = useMemo(
    () => ({
      total: summary.total ?? 0,
      active: (summary.published ?? 0) + (summary.open ?? 0) + (summary.under_evaluation ?? 0),
      closed: (summary.closed ?? 0) + (summary.awarded ?? 0),
      cancelled: summary.cancelled ?? 0,
      totalEstValue: Number(summary.total_estimated_value) || 0,
      avgResponseRate: (() => {
        const totalInvited = rows.reduce((s, r) => s + (r.vendors_count || 0), 0);
        const totalSubmitted = rows.reduce((s, r) => s + (r.submitted_vendors_count || 0), 0);
        return totalInvited > 0 ? Math.round((totalSubmitted / totalInvited) * 100) : 0;
      })(),
    }),
    [summary, rows]
  );

  // â”€â”€ Monthly bar + line chart data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const monthlyData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const dateStr = r.published_date || r.submission_deadline;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = {
          month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
          rfqs: 0,
          totalInvited: 0,
          totalResponses: 0,
          _sort: d.getFullYear() * 100 + d.getMonth(),
        };
      }
      map[key].rfqs += 1;
      map[key].totalInvited += r.vendors_count || 0;
      map[key].totalResponses += r.submitted_vendors_count || 0;
    });
    return Object.values(map)
      .sort((a, b) => a._sort - b._sort)
      .map((m) => ({
        month: m.month,
        rfqs: m.rfqs,
        responses: m.totalResponses,
        responseRate:
          m.totalInvited > 0 ? Math.round((m.totalResponses / m.totalInvited) * 100) : 0,
      }));
  }, [rows]);

  // â”€â”€ Status badge helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const statusBadge = (s) => {
    const cfg = STATUS_BADGE_MAP[s?.toLowerCase()] ?? { variant: 'default', label: s };
    return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  };

  // â”€â”€ Filters JSX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filters = (
    <div className="grid grid-cols-4 gap-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Date To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="open">Open for Quotes</option>
          <option value="under_evaluation">Under Evaluation</option>
          <option value="closed">Closed</option>
          <option value="awarded">Awarded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );

  const kpiCards = (
    <div className="grid grid-cols-5 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total RFQs</p>
              <p className="text-3xl font-bold text-foreground">{loading ? 'â€¦' : stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active</p>
              <p className="text-3xl font-bold text-warning">{loading ? 'â€¦' : stats.active}</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Closed / Awarded</p>
              <p className="text-3xl font-bold text-success">{loading ? 'â€¦' : stats.closed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Response Rate</p>
              <p className="text-3xl font-bold text-primary">
                {loading ? 'â€¦' : `${stats.avgResponseRate}%`}
              </p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Est. Value</p>
              <p className="text-xl font-bold text-foreground">
                {loading ? 'â€¦' : formatBDT(stats.totalEstValue)}
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader title="Monthly RFQs Issued" description="RFQ issuance and responses by month" />
        <CardBody>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rfqs" fill="#1e40af" name="RFQs Issued" />
                <Bar dataKey="responses" fill="#10b981" name="Responses Received" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Vendor Response Rate Trend"
          description="Monthly vendor response rate %"
        />
        <CardBody>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Response Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );

  const table = (
    <Card>
      <CardHeader title="RFQ Status Details" description="All RFQs matching the selected filters" />
      <CardBody>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loadingâ€¦</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No RFQs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">RFQ Number</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Title</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Category</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Vendors</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Responses</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Rate</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Est. Value</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Deadline</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((rfq) => {
                  const invited = rfq.vendors_count || 0;
                  const received = rfq.submitted_vendors_count || 0;
                  const rate = invited > 0 ? Math.round((received / invited) * 100) : 0;
                  return (
                    <tr key={rfq.id} className="border-b border-border">
                      <td className="py-3 text-sm font-mono text-foreground">
                        {rfq.rfq_number || 'â€”'}
                      </td>
                      <td className="py-3 text-sm text-foreground max-w-[200px] truncate">
                        {rfq.rfq_title || rfq.title || 'â€”'}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {rfq.category_name || 'â€”'}
                      </td>
                      <td className="py-3 text-sm text-center text-foreground">{invited}</td>
                      <td className="py-3 text-sm text-center text-foreground">{received}</td>
                      <td className="py-3 text-sm text-center font-semibold text-primary">
                        {rate}%
                      </td>
                      <td className="py-3 text-sm font-semibold text-foreground">
                        {formatBDT(rfq.total_estimated_value)}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {rfq.submission_deadline ? rfq.submission_deadline.split('T')[0] : 'â€”'}
                      </td>
                      <td className="py-3">{statusBadge(rfq.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );

  return (
    <ReportLayout
      title="RFQ Status Report"
      description="Request for Quotation tracking and response analytics â€” Ledars NGO"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
