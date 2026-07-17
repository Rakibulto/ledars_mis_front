'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Ban, Eye, Plus, Clock, Search, CheckCircle, ShieldAlert } from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
import { useVendorBlacklist, useVendorBlacklistSummary } from './use-vendor-api';
const categoryColors = {
  Fraud: 'danger',
  Performance: 'warning',
  'Conflict of Interest': 'info',
  Quality: 'warning',
  Ethics: 'danger',
};
const statusMap = {
  active: { variant: 'danger', label: 'Blacklisted' },
  expired: { variant: 'success', label: 'Reinstated' },
  pending: { variant: 'warning', label: 'Pending Review' },
};
export function VendorBlacklist() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, categoryFilter]);

  const { data: apiData } = useVendorBlacklist({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch,
    status: statusFilter === 'all' ? '' : statusFilter,
    category: categoryFilter === 'all' ? '' : categoryFilter,
  });
  const { data: summaryData } = useVendorBlacklistSummary();

  const filtered = useMemo(() => {
    const results = Array.isArray(apiData?.results)
      ? apiData.results
      : Array.isArray(apiData)
        ? apiData
        : [];
    return results.map((v) => ({
      id: v.blacklist_number || String(v.id),
      _id: v.id,
      vendorName: v.vendor_name_snapshot || v.supplier?.name || '',
      vendorId: v.supplier?.code || String(v.supplier?.id || ''),
      reason: v.reason || '',
      category: v.category || '',
      blacklistedDate: v.blacklisted_date || '',
      blacklistedBy: v.blacklisted_by_name || '',
      duration: v.duration || '',
      expiryDate: v.expiry_date || null,
      status: (v.status || 'pending').toLowerCase(),
      previousContracts: v.previous_contracts || 0,
    }));
  }, [apiData]);

  const totalCount = apiData?.count ?? filtered.length;
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Vendor Blacklist Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage blacklisted vendors and reinstatement requests
          </p>
        </div>
        <Link href={paths.dashboard.procurement.vendors.blacklistRequest}>
          <Button variant="danger">
            <Plus className="w-4 h-4 mr-2" />
            New Blacklist Request
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Blacklisted"
          value={summaryData?.active ?? 0}
          icon={Ban}
          color="red"
        />
        <StatCard
          title="Pending Review"
          value={summaryData?.pending ?? 0}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Reinstated"
          value={summaryData?.expired ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Total Records"
          value={summaryData?.total ?? totalCount}
          icon={ShieldAlert}
          color="purple"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by vendor name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Blacklisted</option>
              <option value="pending">Pending Review</option>
              <option value="expired">Reinstated</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              <option value="Fraud">Fraud</option>
              <option value="Performance">Performance</option>
              <option value="Quality">Quality</option>
              <option value="Ethics">Ethics</option>
              <option value="Conflict of Interest">Conflict of Interest</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-border">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Vendor</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Category</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Reason</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Duration</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Status
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => {
                  const s = statusMap[v.status] || statusMap.pending;
                  return (
                    <tr
                      key={v.id}
                      className={`border-b border-border hover:bg-secondary/30 transition-colors ${v.status === 'active' ? 'bg-destructive/3' : ''}`}
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                            <Ban className="w-4 h-4 text-destructive" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{v.vendorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {v.vendorId} • {v.previousContracts} past contracts
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={categoryColors[v.category] || 'default'} size="sm">
                          {v.category}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm text-foreground max-w-xs truncate">{v.reason}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm font-medium text-foreground">{v.duration}</p>
                        {v.expiryDate && (
                          <p className="text-xs text-muted-foreground">Expires: {v.expiryDate}</p>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-sm text-muted-foreground">{v.blacklistedDate}</p>
                        <p className="text-xs text-muted-foreground">by {v.blacklistedBy}</p>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <Badge variant={s.variant} size="sm">
                          {s.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <button className="p-1.5 hover:bg-muted rounded transition-colors">
                          <Eye className="w-4 h-4 text-primary" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
