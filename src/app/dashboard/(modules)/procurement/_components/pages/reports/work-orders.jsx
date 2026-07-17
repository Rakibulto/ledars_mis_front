'use client';

import { useMemo, useState } from 'react';
import { Clock, Banknote, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react';
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

function formatBDT(amount) {
  const n = Number(amount) || 0;
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)} L`;
  return `৳${n.toLocaleString('en-IN')}`;
}

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

const getStatusVariant = (s) => {
  const v = (s || '').toLowerCase();
  if (v === 'completed') return 'success';
  if (
    v === 'in progress' ||
    v === 'in-progress' ||
    v === 'sent to vendor' ||
    v === 'accepted by vendor'
  )
    return 'warning';
  if (v === 'pending approval' || v === 'draft') return 'default';
  if (v === 'cancelled' || v === 'rejected') return 'error';
  if (v === 'approved') return 'info';
  return 'default';
};

export function WorkOrderReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch all WOs without pagination; apply status filter server-side
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.append('status', statusFilter);
    const qs = params.toString();
    return `${endpoints.procurement_management.work_orders}${qs ? `?${qs}` : ''}`;
  }, [statusFilter]);

  const { data: rawData, loading } = useGetRequest(apiUrl);

  // rawData is a flat array (pagination=false by default)
  const allWOs = useMemo(
    () => (Array.isArray(rawData) ? rawData : (rawData?.results ?? [])),
    [rawData]
  );

  // Client-side date filtering on orderDate
  const woList = useMemo(() => {
    if (!dateFrom && !dateTo) return allWOs;
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;
    return allWOs.filter((wo) => {
      if (!wo.orderDate) return true;
      const d = new Date(wo.orderDate);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [allWOs, dateFrom, dateTo]);

  // KPI stats — computed client-side from filtered WO list
  // Completed:   status === "Approved"  AND  vendorStatus === "Accepted"
  // In Progress: status === "Approved"  OR   vendorStatus === "Accepted"  (either changed)
  // Pending:     everything else
  const stats = useMemo(() => {
    const completed = woList.filter(
      (wo) => wo.status === 'Approved' && wo.vendorStatus === 'Accepted'
    ).length;
    const inProgress = woList.filter(
      (wo) =>
        (wo.status === 'Approved' || wo.vendorStatus === 'Accepted') &&
        !(wo.status === 'Approved' && wo.vendorStatus === 'Accepted')
    ).length;
    const pending = woList.filter(
      (wo) => wo.status !== 'Approved' && wo.vendorStatus !== 'Accepted'
    ).length;
    const totalValue = woList.reduce((sum, wo) => sum + (Number(wo.totalAmount) || 0), 0);
    return {
      totalWOs: woList.length,
      completed,
      inProgress,
      pending,
      totalValue,
    };
  }, [woList]);

  // Monthly chart: group filtered WOs by orderDate month
  const monthlyData = useMemo(() => {
    const map = {};
    woList.forEach((wo) => {
      if (!wo.orderDate) return;
      const d = new Date(wo.orderDate);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { year: d.getFullYear(), monthIdx: d.getMonth(), wos: 0, value: 0 };
      map[key].wos += 1;
      map[key].value += Number(wo.totalAmount) || 0;
    });
    return Object.values(map)
      .sort((a, b) => a.year - b.year || a.monthIdx - b.monthIdx)
      .map((m) => ({ month: `${MONTH_NAMES[m.monthIdx]} ${m.year}`, wos: m.wos, value: m.value }));
  }, [woList]);
  const filters = (
    <div className="grid grid-cols-3 gap-4">
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
        <label className="block text-sm font-medium text-foreground mb-2">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Approved">Approved</option>
          <option value="Sent to Vendor">Sent to Vendor</option>
          <option value="Accepted by Vendor">Accepted by Vendor</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
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
              <p className="text-sm text-muted-foreground mb-1">Total WO/PO</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalWOs}</p>
            </div>
            <Clipboard className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold text-success">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">In Progress</p>
              <p className="text-3xl font-bold text-warning">{stats.inProgress}</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-danger">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-3xl font-bold text-danger">{stats.pending}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-bold text-primary">{formatBDT(stats.totalValue)}</p>
            </div>
            <Banknote className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader
          title="Monthly Work Order Issuance"
          description="Work Order trends by issue date"
        />
        <CardBody>
          {monthlyData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              {loading ? 'Loading…' : 'No data for selected filters'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="wos" fill="#1e40af" name="Work Orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Monthly Value Trend" description="WO total value over time (৳)" />
        <CardBody>
          {monthlyData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              {loading ? 'Loading…' : 'No data for selected filters'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `৳${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(value) => formatBDT(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Value (৳)"
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
      <CardHeader
        title={`WO Tracking Details (${woList.length})`}
        description="All Work Orders — filtered by selected criteria"
      />
      <CardBody>
        {loading && woList.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            Loading work orders…
          </div>
        ) : woList.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No work orders found for the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">WO Number</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Title</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Vendor</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Category</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Issue Date</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Value</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Delivery</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {woList.map((wo) => (
                  <tr key={wo.id} className="border-b border-border">
                    <td className="py-3 text-sm font-mono text-foreground">
                      {wo.workOrderNumber || '—'}
                    </td>
                    <td
                      className="py-3 text-sm text-foreground max-w-[200px] truncate"
                      title={wo.title}
                    >
                      {wo.title || '—'}
                    </td>
                    <td className="py-3 text-sm text-foreground">{wo.vendor?.name || '—'}</td>
                    <td className="py-3 text-sm text-muted-foreground">{wo.category || '—'}</td>
                    <td className="py-3 text-sm text-muted-foreground">{wo.orderDate || '—'}</td>
                    <td className="py-3 text-sm font-semibold text-foreground">
                      {formatBDT(wo.totalAmount)}
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {wo.deliveryDeadline || '—'}
                    </td>
                    <td className="py-3">
                      <Badge variant={getStatusVariant(wo.status)}>{wo.status || 'Unknown'}</Badge>
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
      title="WO/PO Tracking Report"
      description="Work Order & Purchase Order lifecycle monitoring — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
