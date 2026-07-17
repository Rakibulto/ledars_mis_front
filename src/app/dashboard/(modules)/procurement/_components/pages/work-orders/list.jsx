'use client';

import { mutate } from 'swr';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import {
  X,
  Eye,
  Zap,
  Plus,
  Edit,
  Clock,
  Search,
  Package,
  Printer,
  FileText,
  Clipboard,
  TrendingUp,
  CheckCircle,
  Ban,
  Truck,
} from 'lucide-react';

import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { PageLoader } from '../../components/ui';
import { Modal } from '../../components/ui/modal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
function formatBDT(amount) {
  const num = Number(amount) || 0;
  if (num >= 10000000) return `৳${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `৳${(num / 100000).toFixed(2)} Lakh`;
  return `৳${num.toLocaleString('en-IN')}`;
}

const getStatusVariant = (status) => {
  const s = status?.toLowerCase().replace(/[\s_]+/g, '-');
  if (['approved', 'completed', 'accepted-by-vendor'].includes(s)) return 'success';
  if (['pending', 'pending-approval', 'sent-to-vendor', 'in-progress', 'partial'].includes(s))
    return 'warning';
  if (['rejected', 'cancelled'].includes(s)) return 'error';
  return 'default';
};

const getVendorStatusVariant = (vendorStatus) => {
  const s = vendorStatus?.toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'accepted') return 'success';
  if (s === 'rejected') return 'danger';
  if (s === 'sent' || s === 'pending-acceptance') return 'warning';
  return 'outline';
};

const formatVendorStatus = (vendorStatus) => {
  if (!vendorStatus) return 'Not Sent';
  return vendorStatus.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export function WorkOrderList({ isPendingMode: isPendingModeProp }) {
  // --- States ---
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [approvingId, setApprovingId] = useState(null);
  const [confirmWo, setConfirmWo] = useState(null); // { id, workOrderNumber }
  const [cancelWo, setCancelWo] = useState(null); // { id, workOrderNumber, vendorName, awardId }
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelRemarks, setCancelRemarks] = useState('');
  const [deliveryStatusWo, setDeliveryStatusWo] = useState(null); // { id, workOrderNumber, currentStatus }
  const [updatingDeliveryId, setUpdatingDeliveryId] = useState(null);
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const searchParams = useSearchParams();
  const isPendingMode = isPendingModeProp ?? searchParams.get('mode') === 'pending';

  // --- Debounce Search (450ms) ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // --- Build API URL ---
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      pagination: 'true',
      page: (page + 1).toString(),
      page_size: rowsPerPage.toString(),
    });
    if (search) params.append('search', search);
    if (statusFilter) params.append('status', statusFilter);
    if (deliveryFilter) params.append('delivery_status', deliveryFilter);
    if (isPendingMode) {
      params.append('mode', 'pending');
    } else {
      params.append('exclude_pending_approval', 'true');
    }
    return `${endpoints.procurement_management.work_orders}?${params.toString()}`;
  }, [search, statusFilter, page, rowsPerPage, isPendingMode]);

  const { data, loading } = useGetRequest(apiUrl);
  const { data: summaryData } = useGetRequest(endpoints.procurement_management.work_order_summary);

  const workOrders = data?.results || [];
  const totalCount = data?.count || 0;

  // --- KPI calculations ---
  const approvedCount = Number(summaryData?.approved) || 0;
  const pendingCount = Number(summaryData?.pending_approval) || 0;
  const totalValue = workOrders.reduce((sum, wo) => sum + (Number(wo.totalAmount) || 0), 0);
  const activeDeliveries = workOrders.filter((wo) => {
    const deliveredItems = Number(wo.deliveredItems) || 0;
    const totalItems = Number(wo.totalItems) || 0;
    return deliveredItems > 0 && totalItems > deliveredItems;
  }).length;

  // --- Handlers ---
  const handleChangePage = (_event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleApprove = async () => {
    if (!confirmWo) return;
    const woId = confirmWo.id;
    setConfirmWo(null);
    setApprovingId(woId);
    try {
      await axiosInstance.post(endpoints.procurement_management.work_order_approve(woId));
      await mutate(apiUrl);
      toast.success('Work order approved. Vendor status set to Sent and notified.');
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Failed to approve work order.';
      toast.error(msg);
    } finally {
      setApprovingId(null);
    }
  };

  const handleCancelWorkOrder = async () => {
    if (!cancelWo) return;
    const woId = cancelWo.id;
    const awardId = cancelWo.awardId;
    setCancelWo(null);
    setCancellingId(woId);
    try {
      // Set work order status to Cancelled and vendorStatus to not-sent
      await axiosInstance.patch(endpoints.procurement_management.work_order_by_id(woId), {
        status: 'Cancelled',
        vendorStatus: 'not-sent',
        special_instructions: cancelRemarks || undefined,
      });
      // Reset linked award acceptanceStatus to pending
      if (awardId) {
        await axiosInstance.patch(endpoints.procurement_management.award_by_id(awardId), {
          acceptanceStatus: 'pending',
        });
      }
      setCancelRemarks('');
      await mutate(apiUrl);
      toast.success('Work order cancelled successfully.');
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.response?.data?.error || 'Failed to cancel work order.';
      toast.error(msg);
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdateDeliveryStatus = async (newStatus) => {
    if (!deliveryStatusWo) return;
    const woId = deliveryStatusWo.id;
    setDeliveryStatusWo(null);
    setUpdatingDeliveryId(woId);
    try {
      await axiosInstance.patch(endpoints.procurement_management.work_order_by_id(woId), {
        delivery_status: newStatus,
      });
      await mutate(apiUrl);
      toast.success(`Delivery status updated to ${newStatus.replace(/-/g, ' ')}.`);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.error ||
        'Failed to update delivery status.';
      toast.error(msg);
    } finally {
      setUpdatingDeliveryId(null);
    }
  };

  const getDeliveryStatusColor = (status) => {
    const s = status?.toLowerCase() || 'not-started';
    if (s === 'completed') return 'success';
    if (s === 'in-progress') return 'warning';
    if (s === 'partial') return 'info';
    return 'outline';
  };

  const formatDeliveryStatus = (status) => {
    if (!status) return 'Not Started';
    return status.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  if (loading && !data) return <PageLoader message="Fetching Work Orders..." />;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            {isPendingMode ? 'Pending Work Order Approvals' : 'Work Orders / Purchase Orders'}
          </h1>
          <p className="text-muted-foreground">
            {isPendingMode
              ? 'Review work orders assigned to you for approval.'
              : 'Manage approved and in-flight procurement work orders.'}
          </p>
        </div>
        {!isPendingMode && (
          <Link href={paths.dashboard.procurement.workOrders.create}>
            <Button size="sm" variant="primary">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Create Work Order
            </Button>
          </Link>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Work Orders</p>
                <p className="text-xl font-semibold text-foreground">{totalCount}</p>
                <p className="text-xs text-muted-foreground mt-1">All records</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clipboard className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Approved</p>
                <p className="text-xl font-semibold text-foreground">{approvedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">This page</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
                <p className="text-xl font-semibold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">In digital workflow</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Page Total Value</p>
                <p className="text-xl font-semibold text-foreground">{formatBDT(totalValue)}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Active Deliveries</p>
                <p className="text-xl font-semibold text-foreground">{activeDeliveries}</p>
                <p className="text-xs text-muted-foreground mt-1">Partially delivered</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5 text-warning" />
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Auto-Generation</p>
                <p className="text-xl font-semibold text-foreground">
                  <Zap className="w-4 h-4 inline text-primary" /> Active
                </p>
                <p className="text-xs text-muted-foreground mt-1">WO-AAB-YYYY-NNN numbering</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-success" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-wrap gap-4">
            <div className="relative min-w-62.5 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by WO number, title, or vendor..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="min-w-37.5 rounded-lg border border-input px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
            {(searchInput || statusFilter || deliveryFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchInput('');
                  setStatusFilter('');
                  setDeliveryFilter('');
                }}
              >
                <X className="w-4 h-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Delivery Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={!deliveryFilter ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setDeliveryFilter('');
            setPage(0);
          }}
        >
          All
        </Button>
        <Button
          variant={deliveryFilter === 'not-started' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setDeliveryFilter('not-started');
            setPage(0);
          }}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Not Started
        </Button>
        <Button
          variant={deliveryFilter === 'in-progress' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setDeliveryFilter('in-progress');
            setPage(0);
          }}
        >
          <Truck className="w-3.5 h-3.5 mr-1.5" />
          In Progress
        </Button>
        <Button
          variant={deliveryFilter === 'partial' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setDeliveryFilter('partial');
            setPage(0);
          }}
        >
          <Package className="w-3.5 h-3.5 mr-1.5" />
          Partial
        </Button>
        <Button
          variant={deliveryFilter === 'completed' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            setDeliveryFilter('completed');
            setPage(0);
          }}
        >
          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
          Completed
        </Button>
      </div>

      {/* WO List */}
      <Card>
        <CardHeader
          title={isPendingMode ? `Pending Approvals (${totalCount})` : `WO List (${totalCount})`}
          description={
            isPendingMode
              ? 'Work orders waiting for the selected approver to approve.'
              : 'Approved and operational work orders outside the pending approval queue.'
          }
        />
        <CardBody>
          <div className="space-y-4">
            {workOrders.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                {loading ? 'Loading...' : 'No work orders found.'}
              </div>
            ) : (
              workOrders.map((wo) => {
                const deliveredItems = Number(wo.deliveredItems) || 0;
                const totalItems =
                  Number(wo.totalItems) || (Array.isArray(wo.items) ? wo.items.length : 0) || 0;
                const deliveryPercent =
                  totalItems > 0 ? Math.min(100, (deliveredItems / totalItems) * 100) : 0;

                return (
                  <div
                    key={wo.id}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-primary">
                            {wo.workOrderNumber || wo.poNumber || 'N/A'}
                          </h3>
                          <Badge variant={getStatusVariant(wo.status)}>
                            {wo.status || 'Unknown'}
                          </Badge>
                          <Badge variant={getVendorStatusVariant(wo.vendorStatus)}>
                            Vendor Status: {formatVendorStatus(wo.vendorStatus)}
                          </Badge>
                          <Badge variant="outline">
                            Vendor: {wo.vendor?.name || 'Unknown Vendor'}
                          </Badge>
                          {wo.vendor?.is_direct_evaluation && (
                            <Badge variant="secondary">Direct Eval</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {wo.title || 'No Title Provided'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-1.5 gap-x-4 text-xs text-muted-foreground">
                          <span>
                            <strong>WO #:</strong> {wo.workOrderNumber || '---'}
                          </span>
                          <span>
                            <strong>Requisition:</strong> {wo.requisitionNumber || '---'}
                          </span>
                          <span>
                            <strong>CS Ref:</strong> {wo.csNumber || '---'}
                          </span>
                          <span>
                            <strong>Category:</strong> {wo.category || 'N/A'}
                          </span>
                          <span>
                            <strong>Prepared By:</strong> {wo.created_by || 'System'}
                          </span>
                          <span>
                            <strong>Deadline:</strong>{' '}
                            {wo.deliveryDeadline
                              ? new Date(wo.deliveryDeadline).toLocaleDateString()
                              : 'Not Set'}
                          </span>
                          <span className="text-foreground font-semibold">
                            <strong>Total:</strong> {formatBDT(wo.totalAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {wo.status?.toLowerCase() === 'draft' && (
                          <Link href={paths.dashboard.procurement.workOrders.edit(wo.id)}>
                            <Button variant="warning" size="sm">
                              <Edit className="w-3.5 h-3.5 mr-1.5" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        {isPendingMode &&
                          wo.approvalStatus?.toLowerCase().replace(/[\s_]+/g, '-') ===
                            'pending-approval' && (
                            <Button
                              variant="success"
                              size="sm"
                              disabled={approvingId === wo.id}
                              onClick={() =>
                                setConfirmWo({
                                  id: wo.id,
                                  workOrderNumber: wo.workOrderNumber || wo.poNumber || `#${wo.id}`,
                                })
                              }
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                              {approvingId === wo.id ? 'Approving...' : 'Approve'}
                            </Button>
                          )}
                        {!isPendingMode &&
                          wo.approvalStatus?.toLowerCase().replace(/[\s_]+/g, '-') ===
                            'pending-approval' && (
                            <Link href={paths.dashboard.procurement.workOrders.approval(wo.id)}>
                              <Button variant="warning" size="sm">
                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                Review
                              </Button>
                            </Link>
                          )}
                        <Link href={paths.dashboard.procurement.workOrders.detail(wo.id)}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </Button>
                        </Link>
                        <Link href={paths.dashboard.procurement.workOrders.print(wo.id)}>
                          <Button variant="outline" size="sm">
                            <Printer className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant={getDeliveryStatusColor(wo.deliveryStatus)}
                          size="sm"
                          disabled={updatingDeliveryId === wo.id}
                          onClick={() =>
                            setDeliveryStatusWo({
                              id: wo.id,
                              workOrderNumber: wo.workOrderNumber || wo.poNumber || `#${wo.id}`,
                              currentStatus: wo.deliveryStatus || 'not-started',
                            })
                          }
                        >
                          <Truck className="w-3.5 h-3.5 mr-1.5" />
                          {updatingDeliveryId === wo.id
                            ? 'Updating...'
                            : formatDeliveryStatus(wo.deliveryStatus)}
                        </Button>
                        {wo.deliveryStatus?.toLowerCase() === 'not-started' &&
                          !wo.vendor?.is_direct_evaluation &&
                          wo.vendorStatus?.toLowerCase() !== 'rejected' &&
                          wo.awardId && (
                            <Button
                              variant="error"
                              size="sm"
                              disabled={
                                cancellingId === wo.id ||
                                wo.vendor.is_direct_evaluation ||
                                wo.status?.toLowerCase() === 'cancelled'
                              }
                              onClick={() =>
                                setCancelWo({
                                  id: wo.id,
                                  workOrderNumber: wo.workOrderNumber || wo.poNumber || `#${wo.id}`,
                                  vendorName: wo.vendor?.name || 'Unknown Vendor',
                                  awardId: wo.awardId,
                                })
                              }
                            >
                              <Ban className="w-3.5 h-3.5 mr-1.5" />
                              {cancellingId === wo.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          )}
                      </div>
                    </div>

                    {/* Delivery Progress — only when items exist */}
                    {totalItems > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Delivery Progress</span>
                          <span>
                            {deliveredItems}/{totalItems} items ({deliveryPercent.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${deliveryPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </CardBody>
      </Card>

      {/* Approve Confirmation Dialog */}
      <Modal
        isOpen={!!confirmWo}
        onClose={() => setConfirmWo(null)}
        size="sm"
        title="Confirm Approval"
        description={`Are you sure you want to approve work order ${confirmWo?.workOrderNumber}?`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setConfirmWo(null)}>
              Cancel
            </Button>
            <Button variant="success" size="sm" onClick={handleApprove}>
              <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
              Yes, Approve
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Approving this work order will:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Set approval status to <strong className="text-foreground">Fully Approved</strong>
            </li>
            <li>
              Set vendor status to <strong className="text-foreground">Sent</strong>
            </li>
            <li>Create a notification log for the vendor</li>
          </ul>
          <p className="text-warning font-medium pt-1">This action cannot be undone.</p>
        </div>
      </Modal>

      {/* Cancel/Withdraw Confirmation Dialog */}
      <Modal
        isOpen={!!cancelWo}
        onClose={() => {
          setCancelWo(null);
          setCancelRemarks('');
        }}
        size="sm"
        title="Cancel Work Order"
        description={`Are you sure you want to cancel work order ${cancelWo?.workOrderNumber} from vendor ${cancelWo?.vendorName}?`}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCancelWo(null);
                setCancelRemarks('');
              }}
            >
              No, Keep It
            </Button>
            <Button variant="error" size="sm" onClick={handleCancelWorkOrder}>
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              Yes, Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Cancelling this work order will:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Set status to <strong className="text-foreground">Cancelled</strong>
            </li>
            <li>
              Reset vendor status to <strong className="text-foreground">Not Sent</strong>
            </li>
            <li>
              Reset award acceptance status to <strong className="text-foreground">Pending</strong>
            </li>
          </ul>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Cancellation Remarks
            </label>
            <textarea
              value={cancelRemarks}
              onChange={(e) => setCancelRemarks(e.target.value)}
              placeholder="Reason for cancellation..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
            />
          </div>
          <p className="text-error font-medium pt-1">This action cannot be undone.</p>
        </div>
      </Modal>

      {/* Delivery Status Dialog */}
      <Modal
        isOpen={!!deliveryStatusWo}
        onClose={() => setDeliveryStatusWo(null)}
        size="sm"
        title="Update Delivery Status"
        description={`Change delivery status for work order ${deliveryStatusWo?.workOrderNumber}`}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setDeliveryStatusWo(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Current status:{' '}
            <strong className="text-foreground">
              {formatDeliveryStatus(deliveryStatusWo?.currentStatus)}
            </strong>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'not-started', label: 'Not Started', variant: 'outline' },
              { value: 'in-progress', label: 'In Progress', variant: 'warning' },
              { value: 'partial', label: 'Partial', variant: 'info' },
              { value: 'completed', label: 'Completed', variant: 'success' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={
                  deliveryStatusWo?.currentStatus === option.value ? option.variant : 'outline'
                }
                size="sm"
                disabled={deliveryStatusWo?.currentStatus === option.value}
                onClick={() => handleUpdateDeliveryStatus(option.value)}
                className={
                  deliveryStatusWo?.currentStatus === option.value ? 'ring-2 ring-primary' : ''
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
