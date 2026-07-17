'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import {
  Eye,
  Plus,
  Edit,
  Star,
  Clock,
  Search,
  Shield,
  XCircle,
  FileText,
  Building2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import { useVendorList } from './use-vendor-api';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

export function VendorList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
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
  }, [statusFilter, verificationFilter, categoryFilter]);

  const { data: apiData, loading } = useVendorList({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch,
    status: statusFilter,
    verification_state: verificationFilter,
    category: categoryFilter === 'all' ? '' : categoryFilter,
  });

  const vendors = useMemo(() => {
    const results = Array.isArray(apiData?.results)
      ? apiData.results
      : Array.isArray(apiData)
        ? apiData
        : [];
    return results.map((v) => ({
      id: v.id || '',
      _id: v.id,
      companyName: v.name || '',
      contactPerson: v.contact_person || '',
      email: v.email || '',
      phone: v.phone || '',
      categories: (v.categories || []).map((c) => (typeof c === 'object' ? c.name : c)),
      status: (v.status || '').toLowerCase(),
      verificationState: v.verification_state || 'pending',
      registrationDate: v.registration_date || '',
      enlistmentYear: v.enlistment_year ? String(v.enlistment_year) : '',
      totalOrders: v.total_orders || 0,
      totalValue: 0,
      rating: parseFloat(v.rating) || 0,
      tin: v.tax_id || '',
      vatBin: v.bin_number || '',
      tradeLicenseExpiry: v.trade_license_expiry || '',
      location: v.district || v.address || '',
      docExpiring: (() => {
        if (!v.trade_license_expiry) return false;
        const days = (new Date(v.trade_license_expiry) - new Date()) / 86400000;
        return days >= 0 && days <= 90;
      })(),
      allDocsVerified: v.all_docs_verified === true,
    }));
  }, [apiData]);

  const totalCount = apiData?.count ?? vendors.length;
  const summary = apiData?.summary || {};
  const docExpiringCount = summary?.expiring_soon ?? vendors.filter((v) => v.docExpiring).length;
  const filtered = vendors;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'approved':
        return (
          <Badge
            variant="success"
            size="sm"
            className="bg-green-100 text-green-700 border-green-200"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="default" size="sm">
            <XCircle className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm" className="bg-red-100 text-red-600 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {status}
          </Badge>
        );
    }
  };
  const getVerificationBadge = (state) => {
    switch (state) {
      case 'verified':
        return (
          <Badge variant="success" size="sm">
            <Shield className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'under-review':
        return (
          <Badge variant="info" size="sm">
            <AlertCircle className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {state}
          </Badge>
        );
    }
  };
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
            Vendor Management System
          </h1>
          <p className="text-muted-foreground">
            Ledars NGO &mdash; Enlisted vendor database, verification, and category management
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={paths.dashboard.procurement.vendors.enlistment}>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Enlistment Queue
            </Button>
          </Link>
          <Link href={paths.dashboard.procurement.vendors.create}>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Register New Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Document Expiry Alert */}
      {docExpiringCount > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              {docExpiringCount} vendor(s) have documents expiring within 90 days
            </p>
            <p className="text-xs text-orange-700">
              Automated alerts have been sent. Review vendor compliance documents.
            </p>
          </div>
          <Link href={paths.dashboard.procurement.vendors.verification}>
            <Button variant="outline" size="sm">
              Review Documents
            </Button>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Enlisted"
          value={summary?.total ?? totalCount}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Active Vendors"
          value={summary?.active ?? 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Approval"
          value={summary?.pending ?? 0}
          icon={Clock}
          color="orange"
        />
        <StatCard title="Verified" value={summary?.verified ?? 0} icon={Shield} color="purple" />
        <StatCard title="Doc Expiring" value={docExpiringCount} icon={AlertTriangle} color="red" />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by company name, vendor ID, or contact person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="under-review">Under Review</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            >
              <option value="all">All Categories</option>
              <option value="IT Equipment">IT Equipment</option>
              <option value="Construction">Construction</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Medical Supplies">Medical Supplies</option>
              <option value="Furniture">Furniture</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Printing">Printing</option>
              <option value="Relief Supplies">Relief Supplies</option>
              <option value="Security Services">Security Services</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Vendor Table */}
      <Card>
        <CardHeader
          title={`Enlisted Vendors (${totalCount} total)`}
          description="Annual enlistment period: 2025-2026 | Category-based vendor database"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-3 py-3 text-xs font-semibold">Vendor ID</th>
                  <th className="px-3 py-3 text-xs font-semibold">Company</th>
                  <th className="px-3 py-3 text-xs font-semibold">Contact</th>
                  <th className="px-3 py-3 text-xs font-semibold">Categories</th>
                  <th className="px-3 py-3 text-xs font-semibold text-center">Rating</th>
                  <th className="px-3 py-3 text-xs font-semibold text-right">Orders / Value</th>
                  <th className="px-3 py-3 text-xs font-semibold">Documents</th>
                  <th className="px-3 py-3 text-xs font-semibold">Status</th>
                  <th className="px-3 py-3 text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((vendor) => (
                  <tr key={vendor.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <span className="font-mono text-sm font-semibold text-primary">
                        {vendor.id}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{vendor.enlistmentYear}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {vendor.companyName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {vendor.location} | Since {vendor.registrationDate}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-sm text-foreground">{vendor.contactPerson}</p>
                      <p className="text-[10px] text-muted-foreground">{vendor.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {vendor.categories.slice(0, 2).map((cat, idx) => (
                          <Badge key={idx} variant="default" size="sm">
                            {cat}
                          </Badge>
                        ))}
                        {vendor.categories.length > 2 && (
                          <Badge variant="default" size="sm">
                            +{vendor.categories.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {vendor.rating > 0 ? (
                        <span className="flex items-center justify-center gap-0.5 text-sm">
                          <Star className="w-3.5 h-3.5 text-yellow-500" />
                          {vendor.rating}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <p className="text-sm font-semibold">{vendor.totalOrders}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        BDT {(vendor.totalValue / 1000000).toFixed(1)}M
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      {vendor.docExpiring ? (
                        <Badge variant="warning" size="sm">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Expiring
                        </Badge>
                      ) : vendor.allDocsVerified ? (
                        <Badge
                          variant="success"
                          size="sm"
                          className="bg-green-100 text-green-700 border-green-200"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : vendor.verificationState === 'verified' ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {getStatusBadge(vendor.status)}
                        {/* {getVerificationBadge(vendor.verificationState)} */}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <Link href={paths.dashboard.procurement.vendors.detail(vendor.id)}>
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                        </Link>
                        <Link
                          href={`${paths.dashboard.procurement.vendors.create}?edit=${vendor.id}`}
                        >
                          <button
                            type="button"
                            className="p-1.5 hover:bg-muted rounded transition-colors"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </Link>
                      </div>
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
