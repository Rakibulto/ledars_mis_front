'use client';

import { useMemo, useState, useEffect } from 'react';
import { Tag, Plus, Edit, Search, Building2, CheckCircle, AlertCircle } from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { useVendorCategories } from './use-vendor-api';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
export function VendorCategories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: apiData } = useVendorCategories({
    page: page + 1,
    pageSize: rowsPerPage,
    search: debouncedSearch,
  });

  const categories = useMemo(() => {
    const results = Array.isArray(apiData?.results)
      ? apiData.results
      : Array.isArray(apiData)
        ? apiData
        : [];
    return results.map((c) => ({
      id: String(c.id),
      name: c.name || '',
      code: c.code || '',
      description: c.description || '',
      vendors: c.vendor_count || 0,
      activeRFQs: c.active_rfqs || 0,
      status: c.is_active !== false ? 'active' : 'inactive',
    }));
  }, [apiData]);

  const totalCount = apiData?.count ?? categories.length;
  const filtered = categories;
  const totalVendorAssignments = categories.reduce((s, c) => s + c.vendors, 0);
  const categoriesWithVendors = categories.filter((c) => c.vendors > 0).length;
  const emptyCategories = categories.filter((c) => c.vendors === 0).length;
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-1">
            Vendor Categories
          </h1>
          <p className="text-muted-foreground">
            Manage {totalCount} procurement categories for vendor classification and RFQ visibility
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Categories" value={totalCount} icon={Tag} color="blue" />
        <StatCard
          title="With Vendors"
          value={categoriesWithVendors}
          icon={Building2}
          color="green"
        />
        <StatCard
          title="Empty Categories"
          value={emptyCategories}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="Total Assignments"
          value={totalVendorAssignments}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search categories by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Categories (${totalCount} total)`}
          description="Each vendor can be assigned to one or multiple categories"
        />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold">Category Name</th>
                  <th className="px-4 py-3 text-xs font-semibold">Code</th>
                  <th className="px-4 py-3 text-xs font-semibold">Description</th>
                  <th className="px-4 py-3 text-xs font-semibold text-center">Vendors</th>
                  <th className="px-4 py-3 text-xs font-semibold text-center">Active RFQs</th>
                  <th className="px-4 py-3 text-xs font-semibold">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{cat.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="default" size="sm">
                        {cat.code}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                      {cat.description}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-sm font-semibold ${cat.vendors > 0 ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        {cat.vendors}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cat.activeRFQs > 0 ? (
                        <Badge variant="info" size="sm">
                          {cat.activeRFQs}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" size="sm">
                        Active
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </button>
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
