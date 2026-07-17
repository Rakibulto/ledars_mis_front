'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Eye, Clock, Search, XCircle, UserPlus, Building2, CheckCircle } from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody } from '../../components/ui/card';
import { useVendorEnlistment, useVendorEnlistmentSummary } from './use-vendor-api';
const statusMap = {
  'pending-review': { variant: 'warning', label: 'Pending Review' },
  'under-evaluation': { variant: 'info', label: 'Under Evaluation' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
};
export function VendorEnlistment() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
  }, [statusFilter]);

  const { data: apiData } = useVendorEnlistment({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch,
    status: statusFilter === 'all' ? '' : statusFilter,
  });
  const { data: summaryData } = useVendorEnlistmentSummary();

  const filtered = useMemo(() => {
    const results = Array.isArray(apiData?.results)
      ? apiData.results
      : Array.isArray(apiData)
        ? apiData
        : [];
    return results.map((v) => ({
      id: v.enlistment_number || String(v.id),
      _id: v.id,
      companyName: v.company_name || '',
      contactPerson: v.contact_person || '',
      email: v.email || '',
      category: typeof v.category === 'object' ? v.category?.name : v.category || '',
      submittedDate: v.submitted_date || '',
      status: v.status || 'pending-review',
      tin: v.tin || '',
      yearsInBusiness: v.years_in_business || 0,
      annualTurnover: v.annual_turnover || '',
    }));
  }, [apiData]);

  const totalCount = apiData?.count ?? filtered.length;
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Vendor Enlistment
          </h1>
          <p className="text-muted-foreground">
            Manage vendor registration and enlistment applications
          </p>
        </div>
        <Link href={paths.dashboard.procurement.vendors.enlistmentNew}>
          <Button variant="primary">
            <UserPlus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Applications"
          value={summaryData?.total ?? totalCount}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Pending Review"
          value={summaryData?.pending ?? 0}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Approved"
          value={summaryData?.approved ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard title="Rejected" value={summaryData?.rejected ?? 0} icon={XCircle} color="red" />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search applications..."
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
              <option value="pending-review">Pending Review</option>
              <option value="under-evaluation">Under Evaluation</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Application ID
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Company</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">Category</th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                    Submitted
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Experience
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Status
                  </th>
                  <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const s = statusMap[a.status] || statusMap['pending-review'];
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 pr-3 text-sm font-medium text-primary">{a.id}</td>
                      <td className="py-3 pr-3">
                        <p className="text-sm font-medium text-foreground">{a.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.contactPerson} • {a.email}
                        </p>
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" size="sm">
                          {a.category}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{a.submittedDate}</td>
                      <td className="py-3 pr-3 text-sm text-center">{a.yearsInBusiness} yrs</td>
                      <td className="py-3 pr-3 text-center">
                        <Badge variant={s.variant} size="sm">
                          {s.label}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <Link href={paths.dashboard.procurement.vendors.enlistmentReview(a.id)}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
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
