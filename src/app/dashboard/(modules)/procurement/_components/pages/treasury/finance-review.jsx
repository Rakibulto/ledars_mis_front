'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, Send, Clock, Search, DollarSign, ArrowRight } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';

const formatBDT = (amount) => {
  const value = Number(amount) || 0;
  if (value >= 10000000) return `৳${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `৳${(value / 100000).toFixed(2)} L`;
  return `৳${value.toLocaleString('en-IN')}`;
};

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

export function FinanceReviewQueue() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: prfResponse, loading } = useGetRequest(
    `${endpoints.procurement_management.payment_requisitions}?pagination=false&status=Approved`
  );

  const approvedPrfs = useMemo(() => toList(prfResponse), [prfResponse]);

  const queueRows = useMemo(
    () =>
      approvedPrfs.map((prf) => ({
        id: prf.id,
        prfNumber: prf.prf_number || `PRF-${prf.id}`,
        vendor: prf.supplier_name || 'N/A',
        netPayable: Number(prf.net_amount) || 0,
        grossAmount: Number(prf.total_amount) || 0,
        taxDeduction: Number(prf.tax_amount) || 0,
        vatAmount: 0,
        approvedDate: prf.approved_date || prf.updated_at || prf.created_at,
        dueDate: prf.tentative_payment_schedule_date || null,
        status: 'pending-finance-review',
        budgetCode: prf.budget_code_name || 'N/A',
        woNumber: prf.wo_number || 'N/A',
      })),
    [approvedPrfs]
  );

  const filteredQueue = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return queueRows.filter((item) => {
      const matchesSearch =
        item.prfNumber.toLowerCase().includes(query) ||
        item.vendor.toLowerCase().includes(query) ||
        item.woNumber.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queueRows, searchQuery, statusFilter]);

  const totalPendingAmount = filteredQueue.reduce((sum, item) => sum + item.netPayable, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Finance Review Queue
        </h1>
        <p className="text-muted-foreground">
          Approved PRFs from the PRF list are ready for treasury processing.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <Card className="border-l-4 border-l-warning">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-warning">{filteredQueue.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Pending</p>
                <p className="text-2xl font-bold text-primary">{formatBDT(totalPendingAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ready to Process</p>
                <p className="text-3xl font-bold text-success">{filteredQueue.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Send className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Source</p>
                <p className="text-sm font-semibold text-foreground">PRF Approved List</p>
              </div>
              <Badge variant="outline">Live</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-6">
        <CardBody>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by PRF, vendor, or work order..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending-finance-review">Pending Review</option>
            </select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={`Finance Review Queue (${filteredQueue.length})`}
          description="Approved PRFs waiting for treasury process initiation"
        />
        <CardBody>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading approved PRFs...
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No approved PRFs found for finance review.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueue.map((item) => (
                <div
                  key={item.id}
                  className="border-2 rounded-lg p-4 transition-colors border-warning bg-warning/5 hover:border-warning"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-warning/10">
                        <Clock className="w-6 h-6 text-warning" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{item.prfNumber}</h3>
                          <Badge variant="warning">Pending Review</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Vendor: <span className="font-medium text-foreground">{item.vendor}</span>
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>WO: {item.woNumber}</span>
                          <span>Approved: {formatDate(item.approvedDate)}</span>
                          <span>Tentative Date: {formatDate(item.dueDate)}</span>
                          <span>Budget: {item.budgetCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={paths.dashboard.procurement.treasury.processingDetail(item.id)}>
                        <Button variant="success" size="sm">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Process
                        </Button>
                      </Link>
                      <Link href={paths.dashboard.procurement.paymentRequisitions.detail(item.id)}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-3 bg-background rounded-lg border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Gross Amount</p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatBDT(item.grossAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">VAT</p>
                      <p className="text-sm font-medium text-success">
                        +{formatBDT(item.vatAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tax Deduction</p>
                      <p className="text-sm font-medium text-error">
                        -{formatBDT(item.taxDeduction)}
                      </p>
                    </div>
                    <div className="border-l-2 border-primary pl-4">
                      <p className="text-xs text-muted-foreground mb-1">Net Payable</p>
                      <p className="text-xl font-bold text-primary">{formatBDT(item.netPayable)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
