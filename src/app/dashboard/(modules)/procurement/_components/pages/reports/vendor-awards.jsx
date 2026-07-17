'use client';

import { useMemo, useState } from 'react';
import { Award, Users, Banknote, TrendingUp } from 'lucide-react';
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

import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const COLORS = ['#1e40af', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
}

export function VendorAwardReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');

  // ── API calls ──────────────────────────────────────────────────────────────
  const { data: summaryData } = useGetRequest(endpoints.procurement_management.award_summary);
  const { data: allAwardsRaw } = useGetRequest(
    `${endpoints.procurement_management.awards}?pagination=false`
  );
  const { data: vendorsRaw } = useGetRequest(
    `${endpoints.procurement_management.vendors_management}?pagination=false`
  );

  // ── Normalise ──────────────────────────────────────────────────────────────
  const allAwards = useMemo(
    () => (Array.isArray(allAwardsRaw) ? allAwardsRaw : []),
    [allAwardsRaw]
  );
  const allVendors = useMemo(() => (Array.isArray(vendorsRaw) ? vendorsRaw : []), [vendorsRaw]);

  // ── Date + vendor filter ───────────────────────────────────────────────────
  const filteredAwards = useMemo(
    () =>
      allAwards.filter((a) => {
        const d = a.awardDate || a.award_date || a.created_at;
        if (dateFrom && d && d < dateFrom) return false;
        if (dateTo && d && d > dateTo) return false;
        if (vendorFilter !== 'all' && String(a.vendor_profile) !== vendorFilter) return false;
        return true;
      }),
    [allAwards, dateFrom, dateTo, vendorFilter]
  );

  // ── Per-vendor aggregation ─────────────────────────────────────────────────
  const awardData = useMemo(() => {
    const map = {};
    for (const a of filteredAwards) {
      const vendorId = a.vendor_profile;
      const vendorName =
        a.vendor?.name || a.vendor_name || a.vendor_profile_name || `Vendor #${vendorId}`;
      if (!vendorId) continue;
      if (!map[vendorId]) map[vendorId] = { vendor: vendorName, awards: 0, value: 0 };
      map[vendorId].awards += 1;
      map[vendorId].value += parseFloat(a.awardedAmount || a.total_amount || 0);
    }
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filteredAwards]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalAwards = summaryData?.total ?? filteredAwards.length;
  const totalValue = summaryData?.total_amount
    ? parseFloat(summaryData.total_amount)
    : filteredAwards.reduce((s, a) => s + parseFloat(a.awardedAmount || a.total_amount || 0), 0);
  const avgAwardValue = totalAwards > 0 ? totalValue / totalAwards : 0;
  const topVendorAwards = awardData.length > 0 ? awardData[0].awards : 0;

  // ── Vendor dropdown options ────────────────────────────────────────────────
  const vendorOptions = useMemo(
    () => allVendors.map((v) => ({ id: String(v.id), name: v.name })),
    [allVendors]
  );

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
        <label className="block text-sm font-medium text-foreground mb-2">Vendor</label>
        <select
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Vendors</option>
          {vendorOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const kpiCards = (
    <div className="grid grid-cols-4 gap-6">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Awards</p>
              <p className="text-3xl font-bold text-foreground">{totalAwards}</p>
            </div>
            <Award className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Value</p>
              <p className="text-xl font-bold text-success">{formatBDT(totalValue)}</p>
            </div>
            <Banknote className="w-8 h-8 text-success" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Award Value</p>
              <p className="text-xl font-bold text-foreground">{formatBDT(avgAwardValue)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-warning" />
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Top Vendor Awards</p>
              <p className="text-3xl font-bold text-primary">{topVendorAwards}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </CardBody>
      </Card>
    </div>
  );

  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader title="Awards by Vendor" description="Distribution of awards — FY 2025-26" />
        <CardBody>
          {awardData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No award data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={awardData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="awards" fill="#1e40af" name="Awards" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Award Value Distribution" description="Value share by vendor" />
        <CardBody>
          {awardData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No award data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={awardData.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(e) => `${e.vendor.split(' ')[0]} ${formatBDT(e.value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {awardData.slice(0, 5).map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatBDT(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardBody>
      </Card>
    </div>
  );

  const table = (
    <Card>
      <CardHeader title="Award Details" description="Complete award breakdown — Ledars NGO" />
      <CardBody>
        {awardData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No award data found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Vendor</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Awards</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Total Value</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Avg Value</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Share</th>
                </tr>
              </thead>
              <tbody>
                {awardData.map((v, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 text-sm text-foreground">{v.vendor}</td>
                    <td className="py-3 text-sm text-center font-semibold text-foreground">
                      {v.awards}
                    </td>
                    <td className="py-3 text-sm font-semibold text-success">
                      {formatBDT(v.value)}
                    </td>
                    <td className="py-3 text-sm text-foreground">
                      {formatBDT(Math.round(v.value / v.awards))}
                    </td>
                    <td className="py-3 text-sm font-semibold text-primary">
                      {totalValue > 0 ? ((v.value / totalValue) * 100).toFixed(1) : '0.0'}%
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
      title="Vendor Award Report"
      description="Award distribution and vendor performance — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
