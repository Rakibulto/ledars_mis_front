'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Eye,
  Plus,
  Clock,
  Search,
  Package,
  XCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

function formatBDT(amount) {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} Lakh`;
  return `৳${value.toLocaleString('en-IN')}`;
}

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const toList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const getStatusVariant = (status) => {
  switch (status) {
    case 'Verified':
      return 'success';
    case 'Rejected':
      return 'error';
    case 'Pending Verification':
    case 'Partially Verified':
      return 'warning';
    default:
      return 'default';
  }
};

export function GRNList({ isPendingMode = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: grnResponse, loading } = useGetRequest(
    `${endpoints.procurement_management.grns}?pagination=false`
  );
  const { data: summary = {} } = useGetRequest(endpoints.procurement_management.grn_summary);

  const grns = useMemo(() => toList(grnResponse), [grnResponse]);

  const modeScopedGrns = useMemo(() => {
    if (isPendingMode) {
      return grns.filter((grn) => grn.status !== 'Verified');
    }
    return grns.filter((grn) => grn.status === 'Verified');
  }, [grns, isPendingMode]);

  const filteredGRNs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return modeScopedGrns.filter((grn) => {
      const matchesStatus = statusFilter === 'all' || grn.status === statusFilter;
      const searchable = [
        grn.grn_number,
        grn.wo_number,
        grn.dp_number,
        grn.po_number,
        grn.supplier_name,
        grn.invoice_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!query || searchable.includes(query));
    });
  }, [modeScopedGrns, searchQuery, statusFilter]);

  const cards = [
    {
      title: 'Total GRNs',
      value: summary.total ?? grns.length,
      icon: Package,
      tone: 'text-primary',
    },
    {
      title: 'Pending Verification',
      value:
        summary.pending_verification ??
        grns.filter((item) => item.status === 'Pending Verification').length,
      icon: Clock,
      tone: 'text-warning',
    },
    {
      title: 'Verified',
      value: summary.verified ?? grns.filter((item) => item.status === 'Verified').length,
      icon: CheckCircle,
      tone: 'text-success',
    },
    {
      title: 'Rejected',
      value: summary.rejected ?? grns.filter((item) => item.status === 'Rejected').length,
      icon: XCircle,
      tone: 'text-error',
    },
    {
      title: 'Total Value',
      value: formatBDT(summary.total_value),
      icon: TrendingUp,
      tone: 'text-primary',
    },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {isPendingMode ? 'Pending Verification' : 'Goods Receive Notes'}
          </h1>
          <p className="text-muted-foreground">
            {isPendingMode
              ? 'All GRNs except Verified status are listed here for verification follow-up.'
              : 'Only Verified goods receive notes are shown in this list.'}
          </p>
        </div>
        <Link href={paths.dashboard.procurement.grn.create}>
          <Button size="sm">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create GRN
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{card.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                  </div>
                  <Icon className={`w-5 h-5 ${card.tone}`} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Filter GRNs"
          description="Search by GRN, work order, supplier, or invoice"
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by GRN, WO, DP, supplier, or invoice"
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All statuses</option>
              {isPendingMode ? (
                <>
                  <option value="Draft">Draft</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Partially Verified">Partially Verified</option>
                  <option value="Rejected">Rejected</option>
                </>
              ) : (
                <option value="Verified">Verified</option>
              )}
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`${isPendingMode ? 'Pending Verification Items' : 'Verified GRNs'} (${filteredGRNs.length})`}
          description={
            isPendingMode
              ? 'Non-verified records awaiting or requiring verification action'
              : 'Verified records from the GRN endpoint'
          }
        />
        <CardBody>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Loading GRNs...</div>
          ) : filteredGRNs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No goods receive notes match the current filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGRNs.map((grn) => {
                const canVerify = ['Draft', 'Pending Verification', 'Partially Verified'].includes(
                  grn.status
                );
                return (
                  <div
                    key={grn.id}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{grn.grn_number}</h3>
                          <Badge variant={getStatusVariant(grn.status)}>{grn.status}</Badge>
                          <Badge variant="outline">{grn.item_count || 0} item(s)</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Supplier: {grn.supplier_name || 'N/A'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>WO: {grn.wo_number || 'N/A'}</span>
                          <span>DP: {grn.dp_number || 'N/A'}</span>
                          <span>Receipt: {formatDate(grn.receipt_date)}</span>
                          <span>Invoice: {grn.invoice_number || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {canVerify ? (
                          <Link href={paths.dashboard.procurement.grn.verify(grn.id)}>
                            <Button size="sm">
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              Verify
                            </Button>
                          </Link>
                        ) : null}
                        <Link href={paths.dashboard.procurement.grn.detail(grn.id)}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Details
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/30 rounded-lg text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Received Value</p>
                        <p className="font-semibold text-foreground">
                          {formatBDT(grn.total_received_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Invoice Amount</p>
                        <p className="font-medium text-foreground">
                          {formatBDT(grn.invoice_amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Received By</p>
                        <p className="font-medium text-foreground">
                          {grn.received_by_name || grn.created_by_username || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Delivery Note</p>
                        <p className="font-medium text-foreground">
                          {grn.delivery_note_number || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {grn.status === 'Rejected' ? (
                      <div className="mt-3 flex items-start gap-2 text-sm text-error">
                        <AlertCircle className="w-4 h-4 mt-0.5" />
                        <span>{grn.remarks || 'Rejected during verification.'}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
