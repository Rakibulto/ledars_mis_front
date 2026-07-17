'use client';

import { useMemo, useState } from 'react';
import { Clock, XCircle, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import {
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  BarChart,
  PieChart,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
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

const STATUS_APPROVED = ['Approved', 'Converted to RFQ'];
const STATUS_PIPELINE = ['Pending Approval', 'Finance Review'];

function formatBDT(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)} L`;
  return `৳${n.toLocaleString('en-IN')}`;
}

export function RequisitionReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: formOptionsData } = useGetRequest(
    endpoints.procurement_management.material_requisitions_form_options
  );
  const departments = useMemo(() => formOptionsData?.departments ?? [], [formOptionsData]);

  // Build API URL — no pagination, pass filters as query params
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('created_after', dateFrom);
    if (dateTo) params.set('created_before', dateTo);
    if (departmentFilter) params.set('department_name', departmentFilter);
    if (statusFilter) params.set('status', statusFilter);
    const qs = params.toString();
    return `${endpoints.procurement_management.material_requisitions}${qs ? `?${qs}` : ''}`;
  }, [dateFrom, dateTo, departmentFilter, statusFilter]);

  const { data: rawData, loading } = useGetRequest(apiUrl);
  const rows = useMemo(
    () => (Array.isArray(rawData) ? rawData : (rawData?.results ?? [])),
    [rawData]
  );

  // Compute KPI stats from fetched (filtered) rows
  const stats = useMemo(
    () => ({
      total: rows.length,
      approved: rows.filter((r) => STATUS_APPROVED.includes(r.status)).length,
      pending: rows.filter((r) => STATUS_PIPELINE.includes(r.status)).length,
      rejected: rows.filter((r) => r.status === 'Rejected').length,
      totalValue: rows.reduce((s, r) => s + (parseFloat(r.total_amount) || 0), 0),
    }),
    [rows]
  );

  // Monthly bar chart — group rows by created_at month
  const monthlyData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = {
          month: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
          requisitions: 0,
          value: 0,
          _sort: d.getFullYear() * 100 + d.getMonth(),
        };
      }
      map[key].requisitions += 1;
      map[key].value += parseFloat(r.total_amount) || 0;
    });
    return Object.values(map).sort((a, b) => a._sort - b._sort);
  }, [rows]);

  // Department pie — group rows by department_name
  const departmentData = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const dept = r.department_name || 'Unknown';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);
  const statusBadgeVariant = (s) => {
    if (STATUS_APPROVED.includes(s)) return 'success';
    if (STATUS_PIPELINE.includes(s)) return 'warning';
    if (s === 'Rejected') return 'error';
    return 'default';
  };

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
        <label className="block text-sm font-medium text-foreground mb-2">Department</label>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
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
          <option value="Draft">Draft</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Finance Review">Finance Review</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Converted to RFQ">Converted to RFQ</option>
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
              <p className="text-sm text-muted-foreground mb-1">Total Requisitions</p>
              <p className="text-3xl font-bold text-foreground">{loading ? '…' : stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Approved</p>
              <p className="text-3xl font-bold text-success">{loading ? '…' : stats.approved}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">In Pipeline</p>
              <p className="text-3xl font-bold text-warning">{loading ? '…' : stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-error">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Rejected</p>
              <p className="text-3xl font-bold text-error">{loading ? '…' : stats.rejected}</p>
            </div>
            <XCircle className="w-8 h-8 text-error" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-bold text-primary">
                {loading ? '…' : formatBDT(stats.totalValue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader
          title="Monthly Requisitions"
          description="Requisition volume and total value by month"
        />
        <CardBody>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v) => `৳${(v / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value, name) => (name === 'Value (৳)' ? formatBDT(value) : value)}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="requisitions" fill="#1e40af" name="Requisitions" />
                <Bar yAxisId="right" dataKey="value" fill="#10b981" name="Value (৳)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Department Distribution" description="Requisitions by department/unit" />
        <CardBody>
          {departmentData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );

  const table = (
    <Card>
      <CardHeader
        title="Procurement Pipeline Details"
        description="Material requisitions matching the selected filters"
      />
      <CardBody>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No requisitions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Requisition ID</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Requested By</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Department</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Project</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Date</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Items</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Value</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((req) => (
                  <tr key={req.id} className="border-b border-border">
                    <td className="py-3 text-sm font-mono text-foreground">{req.requisition_no}</td>
                    <td className="py-3 text-sm text-foreground">
                      {req.created_by?.username || '—'}
                    </td>
                    <td className="py-3 text-sm text-foreground">{req.department_name || '—'}</td>
                    <td className="py-3 text-sm font-mono text-muted-foreground">
                      {req.project_info?.name || req.project_info?.code || '—'}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {req.created_at ? req.created_at.split('T')[0] : '—'}
                    </td>
                    <td className="py-3 text-sm text-center text-foreground">
                      {req.item_count ?? '—'}
                    </td>
                    <td className="py-3 text-sm font-semibold text-foreground">
                      {formatBDT(req.total_amount)}
                    </td>
                    <td className="py-3">
                      <Badge variant={statusBadgeVariant(req.status)}>{req.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );

  return (
    <ReportLayout
      title="Procurement Pipeline Report"
      description="End-to-end requisition tracking — Ledars NGO"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
