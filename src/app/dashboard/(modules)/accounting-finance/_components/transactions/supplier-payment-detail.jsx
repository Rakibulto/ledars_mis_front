'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { enrichSupplierPayment } from './use-supplier-payments-api';
import { getVendorById, getBillByNumber, getSupplierPaymentById } from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const RELEASE_COLORS = {
  queued: 'warning',
  released: 'success',
  blocked: 'error',
};

export default function SupplierPaymentDetail({ paymentId }) {
  const isNumeric = !Number.isNaN(Number(paymentId));
  const { data: rawPayment } = useSWR(
    isNumeric ? endpoints.accounting.supplier_payment_by_id(paymentId) : null,
    fetcher
  );
  const [payment, setPayment] = useState(
    isNumeric ? null : (getSupplierPaymentById(paymentId) ?? null)
  );
  useEffect(() => {
    if (rawPayment) setPayment(enrichSupplierPayment(rawPayment));
  }, [rawPayment]);

  if (!payment) {
    return (
      <TransactionRecordNotFound
        title="Supplier Payment"
        backHref={paths.dashboard.accountingFinance.transactions.supplierPayments}
      />
    );
  }

  const vendor = getVendorById(payment.supplier_id);
  const relatedBills = payment.billRefs.map((number) => getBillByNumber(number)).filter(Boolean);

  const handleRelease = async () => {
    if (payment.releaseStatus === 'blocked' || payment.releaseStatus === 'released') return;
    try {
      const { data } = await axiosInstance.post(
        endpoints.accounting.supplier_payment_release(paymentId)
      );
      setPayment(enrichSupplierPayment(data));
      toast.success('Payment released successfully');
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          error?.message ||
          'Action failed'
      );
    }
  };

  const handleUnblock = async () => {
    try {
      const { data } = await axiosInstance.post(
        endpoints.accounting.supplier_payment_unblock(paymentId)
      );
      setPayment(enrichSupplierPayment(data));
      toast.success('Payment unblocked successfully');
    } catch (error) {
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.detail ||
          error?.message ||
          'Action failed'
      );
    }
  };

  const actions =
    payment.releaseStatus === 'blocked'
      ? [{ label: 'Unblock payment', icon: 'solar:shield-check-bold', onClick: handleUnblock }]
      : [
          {
            label: 'Release payment',
            icon: 'solar:card-send-bold',
            variant: 'contained',
            disabled: payment.releaseStatus === 'released',
            onClick: handleRelease,
          },
        ];

  return (
    <TransactionDetailShell
      title="Supplier Payment Detail"
      subtitle="Execution control for payment runs, bank release, and blocked supplier settlements."
      documentNumber={payment.number}
      backHref={paths.dashboard.accountingFinance.transactions.supplierPayments}
      chips={[
        <Chip
          key="status"
          label={payment.status}
          size="small"
          color={STATUS_COLORS[payment.status]}
          sx={{ textTransform: 'capitalize' }}
        />,
        <Chip
          key="release"
          label={payment.releaseStatus}
          size="small"
          color={RELEASE_COLORS[payment.releaseStatus]}
          sx={{ textTransform: 'capitalize' }}
        />,
      ]}
      actions={actions}
      alerts={
        payment.releaseStatus === 'blocked'
          ? [
              {
                severity: 'error',
                title: 'Payment release blocked',
                description:
                  payment.notes || 'A dispute or validation issue is preventing release.',
              },
            ]
          : []
      }
      summary={[
        { label: 'Payment amount', value: formatCurrency(payment.amount) },
        { label: 'Referenced bills', value: payment.billRefs.length },
        { label: 'Payment run', value: payment.paymentRun },
        { label: 'Approval route', value: payment.approvalRoute },
      ]}
      sections={[
        {
          title: 'Payment Overview',
          items: [
            { label: 'Supplier', value: vendor?.name },
            { label: 'Payment date', value: formatDetailDate(payment.date) },
            { label: 'Payment method', value: payment.method },
            { label: 'Bank account', value: payment.bankAccount },
            { label: 'Approval route', value: payment.approvalRoute },
            { label: 'Settlement reference', value: payment.settlementReference },
            { label: 'Supplier email', value: vendor?.email },
            { label: 'Supplier rating', value: vendor?.rating },
          ],
        },
        {
          title: 'Release Notes',
          items: [{ label: 'Execution note', value: payment.notes, fullWidth: true }],
        },
      ]}
      tables={[
        {
          title: 'Linked Bills',
          columns: [
            { key: 'number', label: 'Bill' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'status', label: 'Status' },
            { key: 'balance', label: 'Balance Due', align: 'right' },
          ],
          rows: relatedBills.map((bill) => ({
            number: bill.number,
            dueDate: formatDetailDate(bill.due_date),
            status: bill.status,
            balance: formatCurrency(bill.balance_due),
          })),
          emptyMessage: 'No vendor bills are linked to this supplier payment.',
        },
      ]}
      sidebar={[
        {
          title: 'Payment Control',
          items: [
            {
              primary: 'Release queue',
              secondary: 'Current bank instruction state',
              meta: payment.releaseStatus,
            },
            {
              primary: 'Supplier dispute flag',
              secondary: 'Vendor profile check',
              meta: vendor?.disputeFlag ? 'Flagged' : 'Clear',
            },
            {
              primary: 'Posting state',
              secondary: 'Journal generation state',
              meta: payment.status,
            },
            {
              primary: 'Settlement reference',
              secondary: 'Bank or cheque trace id',
              meta: payment.settlementReference,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Release readiness',
          description: 'Blocked or queued payments need treasury review',
          status:
            payment.releaseStatus === 'released'
              ? 'success'
              : payment.releaseStatus === 'blocked'
                ? 'error'
                : 'warning',
          value: payment.releaseStatus,
        },
        {
          label: 'Vendor dispute status',
          description: 'Supplier profile dispute indicator',
          status: vendor?.disputeFlag ? 'error' : 'success',
          value: vendor?.disputeFlag ? 'flagged' : 'clear',
        },
        {
          label: 'Approval routing',
          description: 'Payment instruction should include release owner path',
          status: payment.approvalRoute ? 'success' : 'warning',
          value: payment.approvalRoute || 'pending',
        },
      ]}
      referenceLinks={relatedBills.map((bill) => ({
        label: bill.number,
        description: 'Open linked vendor bill',
        href: paths.dashboard.accountingFinance.transactions.billDetail(bill.id),
        icon: 'solar:bill-list-bold',
      }))}
      timeline={[
        {
          label: 'Payment queued',
          description: `Included in payment run ${payment.paymentRun}`,
          status: payment.paymentRun,
          tone: 'info',
          time: formatDetailDate(payment.date),
          icon: 'solar:clock-circle-bold',
        },
        {
          label: 'Treasury release',
          description: payment.notes,
          status: payment.releaseStatus,
          tone:
            payment.releaseStatus === 'released'
              ? 'success'
              : payment.releaseStatus === 'blocked'
                ? 'error'
                : 'warning',
          icon: 'solar:card-send-bold',
        },
      ]}
    />
  );
}
