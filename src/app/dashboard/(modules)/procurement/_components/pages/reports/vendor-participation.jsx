'use client';

import { Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  XAxis,
  YAxis,
  Radar,
  Legend,
  Tooltip,
  BarChart,
  PolarGrid,
  RadarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { ReportLayout } from '../../components/report-layout';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  if (amount >= 10000000) return `৳${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `৳${(amount / 100000).toFixed(2)} L`;
  return `৳${amount.toLocaleString('en-IN')}`;
}

function getRatingLetter(rating) {
  const r = parseFloat(rating || 0);
  if (r >= 4.5) return 'A+';
  if (r >= 3.5) return 'A';
  if (r >= 2.5) return 'B+';
  if (r >= 1.5) return 'B';
  return 'C';
}

export function VendorParticipationReport() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('all');

  // ── API calls ─────────────────────────────────────────────────────────────
  const { data: vendorsPaged } = useGetRequest(endpoints.procurement_management.vendors_management);
  const { data: activeVendorsPaged } = useGetRequest(
    `${endpoints.procurement_management.vendors_management}?status=Approved`
  );
  const { data: allVendors } = useGetRequest(
    `${endpoints.procurement_management.vendors_management}?pagination=false`
  );
  const { data: allQuotations } = useGetRequest(
    `${endpoints.procurement_management.quotations}?pagination=false`
  );
  const { data: allAwards } = useGetRequest(
    `${endpoints.procurement_management.awards}?pagination=false`
  );
  const { data: rfqsPaged } = useGetRequest(endpoints.procurement_management.rfqs);
  const { data: perfSummary } = useGetRequest(
    endpoints.procurement_management.vendor_performance_summary
  );

  // ── Normalise flat arrays ─────────────────────────────────────────────────
  const vendors = useMemo(() => (Array.isArray(allVendors) ? allVendors : []), [allVendors]);
  const quotations = useMemo(
    () => (Array.isArray(allQuotations) ? allQuotations : []),
    [allQuotations]
  );
  const awards = useMemo(() => (Array.isArray(allAwards) ? allAwards : []), [allAwards]);

  const totalRFQs = rfqsPaged?.count || 0;

  // ── Date filter helper ────────────────────────────────────────────────────
  const inRange = (dateStr) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (dateFrom && d < new Date(dateFrom)) return false;
    if (dateTo && d > new Date(dateTo)) return false;
    return true;
  };

  const filteredQuotations = useMemo(
    () => quotations.filter((q) => inRange(q.submission_date || q.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quotations, dateFrom, dateTo]
  );
  const filteredAwards = useMemo(
    () => awards.filter((a) => inRange(a.award_date || a.created_at)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [awards, dateFrom, dateTo]
  );

  // ── Per-vendor aggregation ────────────────────────────────────────────────
  const vendorData = useMemo(
    () =>
      vendors
        .map((vendor) => {
          const vQuotes = filteredQuotations.filter((q) => q.vendor === vendor.id);
          const vAwards = filteredAwards.filter((a) => a.vendor_profile === vendor.id);
          const quotationsSubmitted = vQuotes.length;
          const awardsWon = vAwards.length;
          const totalAwarded = vAwards.reduce((sum, a) => sum + parseFloat(a.total_amount || 0), 0);
          const participationRate =
            totalRFQs > 0 ? Math.min(100, Math.round((quotationsSubmitted / totalRFQs) * 100)) : 0;
          const ratingVal = parseFloat(vendor.rating || 0);
          // Derive delivery & quality from rating (scale 0–5 → 0–100)
          const deliveryScore = ratingVal > 0 ? Math.round(ratingVal * 18 + 10) : null;
          const qualityScore = ratingVal > 0 ? Math.round(ratingVal * 16 + 14) : null;

          return {
            vendor: vendor.name,
            code: vendor.code,
            rfqsInvited: totalRFQs,
            quotationsSubmitted,
            participationRate,
            awardsWon,
            totalAwarded,
            deliveryScore,
            qualityScore,
            rating: getRatingLetter(vendor.rating),
          };
        })
        .filter((v) => v.quotationsSubmitted > 0 || v.awardsWon > 0)
        .sort((a, b) => b.quotationsSubmitted - a.quotationsSubmitted)
        .slice(0, 20),
    [vendors, filteredQuotations, filteredAwards, totalRFQs]
  );

  // ── KPI stats ─────────────────────────────────────────────────────────────
  const totalVendors = vendorsPaged?.count ?? vendors.length;
  const activeVendorCount = activeVendorsPaged?.count ?? 0;
  const totalQuotations = filteredQuotations.length;
  const avgParticipation =
    vendorData.length > 0
      ? Math.round(vendorData.reduce((s, v) => s + v.participationRate, 0) / vendorData.length)
      : 0;
  const avgDeliveryScore =
    perfSummary?.total_orders && perfSummary?.total_on_time
      ? Math.round((perfSummary.total_on_time / perfSummary.total_orders) * 100)
      : vendorData.filter((v) => v.deliveryScore).length > 0
        ? Math.round(
            vendorData.filter((v) => v.deliveryScore).reduce((s, v) => s + v.deliveryScore, 0) /
              vendorData.filter((v) => v.deliveryScore).length
          )
        : 0;
  const avgQualityScore = perfSummary?.avg_compliance
    ? Math.round(perfSummary.avg_compliance)
    : vendorData.filter((v) => v.qualityScore).length > 0
      ? Math.round(
          vendorData.filter((v) => v.qualityScore).reduce((s, v) => s + v.qualityScore, 0) /
            vendorData.filter((v) => v.qualityScore).length
        )
      : 0;

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = useMemo(
    () =>
      vendorData.slice(0, 8).map((v) => ({
        name: v.vendor.split(' ')[0],
        participation: v.participationRate,
        delivery: v.deliveryScore ?? 0,
        quality: v.qualityScore ?? 0,
      })),
    [vendorData]
  );

  const radarData = useMemo(() => {
    const top3 = vendorData.slice(0, 3);
    if (top3.length === 0) return [];
    return [
      {
        metric: 'Participation',
        ...Object.fromEntries(top3.map((v) => [v.vendor.split(' ')[0], v.participationRate])),
      },
      {
        metric: 'Delivery',
        ...Object.fromEntries(top3.map((v) => [v.vendor.split(' ')[0], v.deliveryScore ?? 0])),
      },
      {
        metric: 'Quality',
        ...Object.fromEntries(top3.map((v) => [v.vendor.split(' ')[0], v.qualityScore ?? 0])),
      },
      {
        metric: 'Awards Won',
        ...Object.fromEntries(
          top3.map((v) => [v.vendor.split(' ')[0], Math.min(100, v.awardsWon * 10)])
        ),
      },
      {
        metric: 'Quotations',
        ...Object.fromEntries(
          top3.map((v) => [v.vendor.split(' ')[0], Math.min(100, v.quotationsSubmitted * 10)])
        ),
      },
    ];
  }, [vendorData]);

  const radarColors = ['#1e40af', '#f59e0b', '#10b981'];
  const top3Keys = useMemo(
    () => vendorData.slice(0, 3).map((v) => v.vendor.split(' ')[0]),
    [vendorData]
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
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Categories</option>
          <option value="it">IT Equipment</option>
          <option value="construction">Construction</option>
          <option value="medical">Medical Supplies</option>
          <option value="office">Office Supplies</option>
        </select>
      </div>
    </div>
  );
  const kpiCards = (
    <div className="grid grid-cols-6 gap-4">
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Vendors</p>
            <p className="text-2xl font-bold text-foreground">{totalVendors}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-success">{activeVendorCount}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Participation</p>
            <p className="text-2xl font-bold text-primary">{avgParticipation}%</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-warning">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total Quotations</p>
            <p className="text-2xl font-bold text-foreground">{totalQuotations}</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-success">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Delivery</p>
            <p className="text-2xl font-bold text-success">{avgDeliveryScore}%</p>
          </div>
        </CardBody>
      </Card>
      <Card className="border-l-4 border-l-primary">
        <CardBody>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Avg Quality</p>
            <p className="text-2xl font-bold text-primary">{avgQualityScore}%</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
  const charts = (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader
          title="Vendor Performance Comparison"
          description="Participation, delivery, and quality scores"
        />
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="participation" fill="#1e40af" name="Participation %" />
              <Bar dataKey="delivery" fill="#10b981" name="Delivery Score" />
              <Bar dataKey="quality" fill="#f59e0b" name="Quality Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
      <Card>
        <CardHeader
          title="Top Vendor Radar Analysis"
          description="Multi-dimensional performance comparison"
        />
        <CardBody>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis domain={[0, 100]} />
                {top3Keys.map((key, i) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={radarColors[i]}
                    fill={radarColors[i]}
                    fillOpacity={0.2}
                  />
                ))}
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No vendor data available
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
  const table = (
    <Card>
      <CardHeader
        title="Vendor Performance Details"
        description="Comprehensive vendor engagement and quality metrics — Ledars NGO"
      />
      <CardBody>
        {vendorData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No vendor participation data found for the selected period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-semibold text-foreground">Vendor</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Code</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Total RFQs</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Quotes</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Participation</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Awards</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Total Awarded</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Delivery</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Quality</th>
                  <th className="pb-3 text-sm font-semibold text-foreground">Rating</th>
                </tr>
              </thead>
              <tbody>
                {vendorData.map((v, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-3 text-sm text-foreground">{v.vendor}</td>
                    <td className="py-3 text-sm font-mono text-muted-foreground">{v.code}</td>
                    <td className="py-3 text-sm text-center text-foreground">{v.rfqsInvited}</td>
                    <td className="py-3 text-sm text-center text-foreground">
                      {v.quotationsSubmitted}
                    </td>
                    <td className="py-3 text-sm text-center font-semibold text-primary">
                      {v.participationRate}%
                    </td>
                    <td className="py-3 text-sm text-center font-semibold text-success">
                      {v.awardsWon}
                    </td>
                    <td className="py-3 text-sm font-semibold text-foreground">
                      {formatBDT(v.totalAwarded)}
                    </td>
                    <td className="py-3 text-sm text-center">
                      {v.deliveryScore !== null ? (
                        <Badge
                          variant={
                            v.deliveryScore >= 85
                              ? 'success'
                              : v.deliveryScore >= 75
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {v.deliveryScore}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-center">
                      {v.qualityScore !== null ? (
                        <Badge
                          variant={
                            v.qualityScore >= 85
                              ? 'success'
                              : v.qualityScore >= 75
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {v.qualityScore}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-sm font-bold ${v.rating === 'A+' ? 'text-success' : v.rating === 'A' ? 'text-primary' : 'text-warning'}`}
                      >
                        <Star className="w-3 h-3 inline mr-1" />
                        {v.rating}
                      </span>
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
      title="Vendor Performance Report"
      description="Vendor participation, delivery, and quality analytics — Ledars NGO FY 2025-26"
      filters={filters}
      kpiCards={kpiCards}
      charts={charts}
      table={table}
    />
  );
}
