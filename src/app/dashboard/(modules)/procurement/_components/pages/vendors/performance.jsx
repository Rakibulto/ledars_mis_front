'use client';

import { useMemo, useState } from 'react';
import {
  Star,
  Award,
  Clock,
  Package,
  Building2,
  BarChart3,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { Badge } from '../../components/ui/badge';
import { StatCard } from '../../components/stat-card';
import { useVendorPerformance } from './use-vendor-api';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorPerformance() {
  const [period, setPeriod] = useState('2025-2026');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data: apiData } = useVendorPerformance({
    page: page + 1,
    pageSize: rowsPerPage,
    year: period.split('-')[0],
  });

  const vendorPerformance = useMemo(() => {
    const results = Array.isArray(apiData?.results)
      ? apiData.results
      : Array.isArray(apiData)
        ? apiData
        : [];
    return results.map((v) => ({
      id: v.supplier?.code || String(v.supplier?.id || v.id),
      companyName: v.supplier_name || v.supplier?.name || '',
      category: v.category || '',
      orders: v.total_orders || 0,
      delivered: v.completed_orders || 0,
      onTime: v.on_time_deliveries || 0,
      avgDays: v.avg_delivery_days || 0,
      totalBDT: parseFloat(v.total_spent) || 0,
      rating: parseFloat(v.overall_rating) || 0,
      trend: 'stable',
      issues: v.issues_count || 0,
    }));
  }, [apiData]);

  const totalCount = apiData?.count ?? vendorPerformance.length;
  const totalOrders = vendorPerformance.reduce((s, v) => s + v.orders, 0);
  const totalDelivered = vendorPerformance.reduce((s, v) => s + v.delivered, 0);
  const totalOnTime = vendorPerformance.reduce((s, v) => s + v.onTime, 0);
  const onTimeRate = totalDelivered > 0 ? Math.round((totalOnTime / totalDelivered) * 100) : 0;
  const totalValue = vendorPerformance.reduce((s, v) => s + v.totalBDT, 0);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
            Vendor Performance Tracking
          </h1>
          <p className="text-muted-foreground">
            KPI monitoring and delivery performance analytics &mdash; {period}
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg text-sm"
        >
          <option value="2025-2026">2025-2026</option>
          <option value="2024-2025">2024-2025</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Orders" value={totalOrders} icon={Package} color="blue" />
        <StatCard title="Delivered" value={totalDelivered} icon={Award} color="green" />
        <StatCard title="On-Time Rate" value={`${onTimeRate}%`} icon={Clock} color="purple" />
        <StatCard
          title="Active Vendors"
          value={vendorPerformance.length}
          icon={Building2}
          color="orange"
        />
        <StatCard
          title="Total Value"
          value={`${(totalValue / 10000000).toFixed(1)}Cr`}
          icon={BarChart3}
          color="blue"
        />
      </div>

      <Card>
        <CardHeader
          title="Vendor Performance Dashboard"
          description="Ranked by overall rating. All values in BDT."
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-3 text-xs font-semibold">#</th>
                  <th className="px-3 py-3 text-xs font-semibold">Vendor</th>
                  <th className="px-3 py-3 text-xs font-semibold">Category</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Orders</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Delivered</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">On-Time %</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Avg Days</th>
                  <th className="px-3 py-3 text-xs font-semibold text-right">Total (BDT)</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Rating</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Trend</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Issues</th>
                </tr>
              </thead>
              <tbody>
                {vendorPerformance
                  .sort((a, b) => b.rating - a.rating)
                  .map((v, idx) => (
                    <tr key={v.id} className="border-b border-border hover:bg-muted/30">
                      <td className="px-3 py-3 text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{v.companyName}</p>
                            <p className="text-[10px] text-muted-foreground">{v.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant="default" size="sm">
                          {v.category}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center text-sm font-medium">{v.orders}</td>
                      <td className="px-3 py-3 text-center text-sm font-medium">{v.delivered}</td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`text-sm font-bold ${v.delivered > 0 && Math.round((v.onTime / v.delivered) * 100) >= 90 ? 'text-green-600' : Math.round((v.onTime / v.delivered) * 100) >= 70 ? 'text-blue-600' : 'text-orange-600'}`}
                        >
                          {v.delivered > 0 ? Math.round((v.onTime / v.delivered) * 100) : 0}%
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-sm">{v.avgDays}</td>
                      <td className="px-3 py-3 text-right text-sm font-mono font-semibold">
                        {(v.totalBDT / 100000).toFixed(1)}L
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star
                            className={`w-3.5 h-3.5 ${v.rating >= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                          <span className="text-sm font-bold">{v.rating}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {v.trend === 'up' && (
                          <TrendingUp className="w-4 h-4 text-green-500 mx-auto" />
                        )}
                        {v.trend === 'down' && (
                          <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />
                        )}
                        {v.trend === 'stable' && (
                          <span className="text-xs text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {v.issues > 0 ? (
                          <Badge variant="danger" size="sm">
                            {v.issues}
                          </Badge>
                        ) : (
                          <span className="text-xs text-green-600">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </div>
  );
}
