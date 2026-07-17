'use client';

import { useMemo } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { fetcher, endpoints } from 'src/utils/axios';
import { paths } from 'src/routes/paths';

import { formatCurrency } from '../utils';
import {
  getBillById,
  getBucketLabel,
  getBucketDetail,
  getSupplierDetail,
  getStatementDetail,
} from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from '../transactions/transaction-detail-shell';

const PRIORITY_COLORS = {
  scheduled: 'info',
  urgent: 'warning',
  high: 'error',
  critical: 'error',
};

function buildBillDetailFromApi(data) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(data.due_date);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const overdueDays = diffDays < 0 ? Math.abs(diffDays) : 0;
  const dueInDays = diffDays >= 0 ? diffDays : 0;

  let approvalState = 'review';
  if (['approved', 'posted', 'partial', 'paid'].includes(data.status)) approvalState = 'approved';
  else if (data.status === 'pending') approvalState = 'pending';

  let priority = 'scheduled';
  if (overdueDays > 60) priority = 'critical';
  else if (overdueDays > 30) priority = 'high';
  else if (overdueDays > 0) priority = 'urgent';

  let paymentStage = 'Approval queue';
  if (['approved', 'posted'].includes(data.status)) paymentStage = 'Treasury queue';
  else if (data.status === 'partial') paymentStage = 'Partial payment';
  else if (data.status === 'overdue') paymentStage = 'Exception review';

  const total = Number(data.total_amount) || 0;
  const amountPaid = Number(data.amount_paid) || 0;
  const balanceDue = Number(data.amount_due || data.balance_due) || 0;
  const vendorName = data.vendor_detail?.name || '';
  const vendorCode = data.vendor_detail?.code || '';

  const lines = (data.lines || []).map((line) => ({
    lineNumber: line.line_number,
    description: line.description,
    account: line.account_name || line.account_code || '',
    quantity: line.quantity,
    unitPrice: Number(line.unit_price) || 0,
    totalPrice: Number(line.total) || Number(line.total_price) || 0,
    tax: Number(line.tax_amount) || Number(line.tax) || 0,
    subTotal: Number(line.subtotal) || Number(line.sub_total) || 0,
  }));

  const billLinesTable = lines.length > 0
    ? {
        title: 'Bill Lines',
        columns: [
          { key: 'line', label: 'Line' },
          { key: 'description', label: 'Description' },
          { key: 'account', label: 'Account' },
          { key: 'qty', label: 'Qty' },
          { key: 'unitPrice', label: 'Unit Price' },
          { key: 'total', label: 'Total', align: 'right' },
        ],
        rows: lines.map((line) => ({
          line: line.lineNumber,
          description: line.description,
          account: line.account,
          qty: line.quantity,
          unitPrice: formatCurrency(line.unitPrice),
          total: formatCurrency(line.totalPrice),
        })),
      }
    : null;

  return {
    title: 'Bill Detail',
    subtitle: vendorName,
    documentNumber: data.number || data.bill_number,
    backHref: paths.dashboard.accountingFinance.payables.unpaidBills,
    chips: [
      {
        label: data.status_display || data.status,
        color: data.status === 'paid' ? 'success' : data.status === 'overdue' ? 'error' : 'warning',
      },
      {
        label: approvalState,
        color: approvalState === 'approved' ? 'success' : 'warning',
      },
      { label: priority, color: PRIORITY_COLORS[priority] || 'default' },
    ],
    alerts: data.dispute_flag
      ? [
          {
            severity: 'warning',
            title: 'Bill has a dispute flag',
            description: data.notes || 'Dispute flagged on this bill.',
          },
        ]
      : [],
    summary: [
      { label: 'Supplier', value: vendorName },
      { label: 'Description', value: data.notes || 'No description' },
      { label: 'Outstanding balance', value: formatCurrency(balanceDue) },
      { label: 'Due date', value: formatDetailDate(data.due_date) },
    ],
    sections: [
      {
        title: 'Payment Controls',
        items: [
          { label: 'Payment stage', value: paymentStage },
          { label: 'Approval route', value: data.approval_route || 'Standard' },
          { label: 'Payment proposal', value: data.payment_proposal || 'Standard treasury proposal' },
          { label: 'Match status', value: data.match_status || 'Pending', fullWidth: true },
          { label: 'Goods receipt ref', value: data.goods_receipt_ref || 'N/A', fullWidth: true },
        ],
      },
    ],
    tables: [
      {
        title: 'Payable Position',
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
        rows: [
          { metric: 'Bill total', value: formatCurrency(total) },
          { metric: 'Paid amount', value: formatCurrency(amountPaid) },
          { metric: 'Balance due', value: formatCurrency(balanceDue) },
          { metric: 'Overdue days', value: overdueDays },
          { metric: 'Supplier invoice ref', value: data.vendor_reference || data.supplier_invoice_ref || 'N/A' },
        ],
      },
      ...(billLinesTable ? [billLinesTable] : []),
    ],
    controlChecks: [
      {
        label: 'Approval readiness',
        description: 'Bills should be approved before treasury release.',
        status: approvalState === 'approved' ? 'success' : 'warning',
        value: approvalState,
      },
      {
        label: 'Hold posture',
        description: 'Disputed bills require exception documentation.',
        status: data.dispute_flag ? 'error' : 'success',
        value: data.dispute_flag ? 'attention required' : 'clear',
      },
    ],
    referenceLinks: [
      {
        label: 'Supplier ledger detail',
        description: `View ${vendorName}'s payable exposure`,
        href: paths.dashboard.accountingFinance.payables.supplierLedgerDetail(
          data.supplier_id || data.vendor
        ),
        icon: 'solar:user-id-bold',
      },
    ],
    timeline: (data.bill_payments || []).map((pmt, idx) => ({
      label: `Payment ${idx + 1}`,
      status: 'done',
      tone: 'success',
      time: pmt.created_at ? formatDetailDate(pmt.created_at) : 'Unknown',
      description: pmt.payment_reference ? `Reference: ${pmt.payment_reference}` : 'Payment recorded',
    })),
    auditTrail: [
      { primary: 'Supplier', secondary: 'Payables counterparty', meta: vendorName },
      {
        primary: 'Vendor code',
        secondary: 'Supplier identifier',
        meta: vendorCode || 'N/A',
      },
      {
        primary: 'Data source',
        secondary: 'Loaded from accounting API',
        meta: 'Live database',
      },
    ],
  };
}

function buildSupplierDetail(id) {
  const detail = getSupplierDetail(id);
  if (!detail) {
    return {
      notFound: true,
      title: 'Supplier Ledger Detail',
      backHref: paths.dashboard.accountingFinance.payables.supplierLedger,
    };
  }

  return {
    title: 'Supplier Ledger Detail',
    subtitle: detail.supplier.name,
    documentNumber: detail.supplier.code,
    backHref: paths.dashboard.accountingFinance.payables.supplierLedger,
    chips: [
      { label: detail.supplier.category, color: 'info' },
      {
        label: detail.supplier.riskLevel,
        color: PRIORITY_COLORS[detail.supplier.riskLevel] || 'default',
      },
      {
        label: detail.supplier.approvalState,
        color: detail.supplier.approvalState === 'approved' ? 'success' : 'warning',
      },
    ],
    alerts: detail.supplier.holdFlags
      ? [
          {
            severity: 'warning',
            title: `${detail.supplier.holdFlags} active supplier hold flags require follow-up`,
            description:
              'Review procurement, receiving, and treasury comments before releasing additional payments.',
          },
        ]
      : [],
    summary: [
      { label: 'Payables owner', value: detail.supplier.owner },
      { label: 'Outstanding balance', value: formatCurrency(detail.supplier.outstanding) },
      { label: 'Payment term', value: detail.supplier.paymentTerm },
      { label: 'Supplier note', value: detail.supplier.supplierNote },
      { label: 'Last payment date', value: formatDetailDate(detail.supplier.lastPaymentDate) },
      {
        label: 'Risk flags',
        value: detail.supplier.riskFlags.join(', ') || 'None',
        fullWidth: true,
      },
    ],
    sections: [
      {
        title: 'Supplier Controls',
        items: [
          { label: 'Email', value: detail.supplier.email },
          { label: 'Preferred payment method', value: detail.supplier.paymentMethod },
          { label: 'Pending approvals', value: detail.supplier.pendingApprovals },
          { label: 'Next payment date', value: formatDetailDate(detail.supplier.nextPaymentDate) },
        ],
      },
    ],
    tables: [
      {
        title: 'Open Bill Exposure',
        columns: [
          { key: 'number', label: 'Bill' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'stage', label: 'Payment Stage' },
          { key: 'priority', label: 'Priority' },
          { key: 'dispute', label: 'Dispute / Hold' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: detail.bills.map((bill) => ({
          number: bill.number,
          dueDate: formatDetailDate(bill.dueDate),
          stage: bill.paymentStage,
          priority: bill.priority,
          dispute: bill.holdReason || bill.exceptionReason || 'Clear',
          balance: formatCurrency(bill.balanceDue),
        })),
      },
      {
        title: 'Statement History',
        columns: [
          { key: 'periodLabel', label: 'Statement' },
          { key: 'releaseStatus', label: 'Release Status' },
          { key: 'approvalState', label: 'Approval' },
          { key: 'closingBalance', label: 'Closing Balance', align: 'right' },
        ],
        rows: detail.statements.map((statement) => ({
          periodLabel: statement.periodLabel,
          releaseStatus: statement.releaseStatus,
          approvalState: statement.approvalState,
          closingBalance: formatCurrency(statement.closingBalance),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Hold resolution',
        description: 'Suppliers with holds should remain visible in controller review until released.',
        status: detail.supplier.holdFlags ? 'warning' : 'success',
        value: detail.supplier.holdFlags ? 'open holds' : 'clear',
      },
      {
        label: 'Aging tolerance',
        description: 'Long-aged liabilities should remain under escalation tracking.',
        status:
          detail.supplier.oldestDays > 60
            ? 'error'
            : detail.supplier.oldestDays > 30
              ? 'warning'
              : 'success',
        value: detail.supplier.oldestDays ? `${detail.supplier.oldestDays} days` : 'current',
      },
    ],
    referenceLinks: detail.statements.map((statement) => ({
      label: statement.periodLabel,
      description: 'Open supplier statement detail',
      href: paths.dashboard.accountingFinance.payables.supplierStatementDetail(statement.id),
      icon: 'solar:file-text-bold',
    })),
    timeline: detail.timeline,
    auditTrail: [
      { primary: 'Owner', secondary: 'Assigned payables lead', meta: detail.supplier.owner },
      {
        primary: 'Payment history',
        secondary: 'Bills with payment activity',
        meta: detail.supplier.paymentHistoryCount,
      },
      {
        primary: 'Data source',
        secondary: 'Loaded from payables mock layer',
        meta: 'Mock dataset',
      },
    ],
  };
}

function buildBillDetail(id, mode = 'bill') {
  const bill = getBillById(id);
  if (!bill) {
    return {
      notFound: true,
      title: mode === 'schedule' ? 'Payment Schedule Detail' : 'Bill Detail',
      backHref:
        mode === 'schedule'
          ? paths.dashboard.accountingFinance.payables.paymentSchedule
          : paths.dashboard.accountingFinance.payables.unpaidBills,
    };
  }

  return {
    title: mode === 'schedule' ? 'Payment Schedule Detail' : 'Bill Detail',
    subtitle: bill.supplier?.name,
    documentNumber: bill.number,
    backHref:
      mode === 'schedule'
        ? paths.dashboard.accountingFinance.payables.paymentSchedule
        : paths.dashboard.accountingFinance.payables.unpaidBills,
    chips: [
      {
        label: bill.status,
        color: bill.status === 'paid' ? 'success' : bill.status === 'overdue' ? 'error' : 'warning',
      },
      {
        label: bill.approvalState,
        color: bill.approvalState === 'approved' ? 'success' : 'warning',
      },
      { label: bill.priority, color: PRIORITY_COLORS[bill.priority] || 'default' },
    ],
    alerts: bill.holdReason
      ? [
          {
            severity: 'warning',
            title: 'Bill is currently held',
            description: bill.holdReason,
          },
        ]
      : [],
    summary: [
      { label: 'Supplier', value: bill.supplier?.name },
      { label: 'Description', value: bill.description },
      { label: 'Outstanding balance', value: formatCurrency(bill.balanceDue) },
      { label: 'Scheduled payment', value: formatDetailDate(bill.scheduledPaymentDate) },
    ],
    sections: [
      {
        title: 'Payment Controls',
        items: [
          { label: 'Payment stage', value: bill.paymentStage },
          { label: 'Approval owner', value: bill.approvalOwner },
          { label: 'Payment method', value: bill.paymentMethod },
          {
            label: 'Payment proposal',
            value: bill.paymentProposal || 'Standard treasury proposal',
          },
          { label: 'Exception reason', value: bill.exceptionReason || 'None', fullWidth: true },
        ],
      },
    ],
    tables: [
      {
        title: 'Payable Position',
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
        rows: [
          { metric: 'Bill total', value: formatCurrency(bill.total) },
          { metric: 'Paid amount', value: formatCurrency(bill.paidAmount) },
          { metric: 'Balance due', value: formatCurrency(bill.balanceDue) },
          { metric: 'Overdue days', value: bill.overdueDays },
        ],
      },
      {
        title: 'Processing Notes',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'author', label: 'Author' },
          { key: 'message', label: 'Message' },
        ],
        rows: bill.notes,
      },
    ],
    controlChecks: [
      {
        label: 'Approval readiness',
        description: 'Bills should be approved before treasury release.',
        status: bill.approvalState === 'approved' ? 'success' : 'warning',
        value: bill.approvalState,
      },
      {
        label: 'Hold posture',
        description: 'Held or disputed bills require exception documentation.',
        status: bill.holdReason || bill.disputed ? 'error' : 'success',
        value: bill.holdReason || bill.disputed ? 'attention required' : 'clear',
      },
    ],
    referenceLinks: [
      {
        label: 'Supplier ledger detail',
        description: 'View supplier-wide payable exposure',
        href: paths.dashboard.accountingFinance.payables.supplierLedgerDetail(bill.supplierId),
        icon: 'solar:user-id-bold',
      },
      {
        label: 'Payment schedule detail',
        description: 'Open from the treasury schedule queue',
        href: paths.dashboard.accountingFinance.payables.paymentScheduleDetail(bill.id),
        icon: 'solar:calendar-bold',
      },
    ],
    timeline: bill.timeline,
    auditTrail: [
      { primary: 'Supplier', secondary: 'Payables counterparty', meta: bill.supplier?.name },
      { primary: 'Approval owner', secondary: 'Current queue owner', meta: bill.approvalOwner },
    ],
  };
}

function buildStatementDetail(id) {
  const statement = getStatementDetail(id);
  if (!statement) {
    return {
      notFound: true,
      title: 'Supplier Statement Detail',
      backHref: paths.dashboard.accountingFinance.payables.supplierStatements,
    };
  }

  return {
    title: 'Supplier Statement Detail',
    subtitle: statement.supplier?.name,
    documentNumber: statement.periodLabel,
    backHref: paths.dashboard.accountingFinance.payables.supplierStatements,
    chips: [
      {
        label: statement.releaseStatus,
        color: statement.releaseStatus === 'released' ? 'success' : 'warning',
      },
      {
        label: statement.approvalState,
        color: statement.approvalState === 'approved' ? 'success' : 'warning',
      },
    ],
    alerts: statement.holdCount
      ? [
          {
            severity: 'warning',
            title: `${statement.holdCount} held bills remain in this statement`,
            description: statement.reconciliationNote,
          },
        ]
      : [],
    summary: [
      { label: 'Supplier', value: statement.supplier?.name },
      {
        label: 'Period',
        value: `${formatDetailDate(statement.startDate)} to ${formatDetailDate(statement.endDate)}`,
      },
      { label: 'Opening balance', value: formatCurrency(statement.openingBalance) },
      { label: 'Closing balance', value: formatCurrency(statement.closingBalance) },
      {
        label: 'Vendor statement balance',
        value: formatCurrency(statement.vendorStatementBalance),
      },
    ],
    sections: [
      {
        title: 'Statement Controls',
        items: [
          { label: 'Release status', value: statement.releaseStatus },
          { label: 'Approval state', value: statement.approvalState },
          { label: 'Reconciliation status', value: statement.reconciliationStatus },
          { label: 'Variance', value: formatCurrency(statement.reconciliationDifference) },
          { label: 'Reconciliation note', value: statement.reconciliationNote, fullWidth: true },
          { label: 'Dispute note', value: statement.disputeNote || 'None', fullWidth: true },
        ],
      },
    ],
    tables: [
      {
        title: 'Statement Bills',
        columns: [
          { key: 'number', label: 'Bill' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: statement.bills.map((bill) => ({
          number: bill.number,
          dueDate: formatDetailDate(bill.dueDate),
          status: bill.status,
          balance: formatCurrency(bill.balanceDue),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Statement completeness',
        description: 'Statements should capture all open supplier liabilities in scope.',
        status: statement.bills.length ? 'success' : 'warning',
        value: statement.bills.length ? 'covered' : 'empty',
      },
      {
        label: 'Reconciliation posture',
        description: 'Statement should be matched or explicitly held with a dispute note.',
        status:
          statement.reconciliationStatus === 'matched'
            ? 'success'
            : statement.reconciliationStatus === 'blocked'
              ? 'error'
              : 'warning',
        value: statement.reconciliationStatus,
      },
    ],
    referenceLinks: [
      {
        label: 'Supplier ledger detail',
        description: 'Return to the supplier ledger detail',
        href: paths.dashboard.accountingFinance.payables.supplierLedgerDetail(statement.supplierId),
        icon: 'solar:user-id-bold',
      },
    ],
    timeline: statement.bills.flatMap((bill) => bill.timeline).slice(0, 5),
  };
}

function buildBucketView(bucketId) {
  const bucket = getBucketDetail(bucketId);
  if (!bucket) {
    return {
      notFound: true,
      title: 'Payable Aging Bucket Detail',
      backHref: paths.dashboard.accountingFinance.payables.agingReport,
    };
  }

  return {
    title: 'Payable Aging Bucket Detail',
    subtitle: getBucketLabel(bucket.id),
    documentNumber: bucket.label,
    backHref: paths.dashboard.accountingFinance.payables.agingReport,
    chips: [
      { label: `${bucket.count} bills`, color: 'info' },
      { label: `${bucket.approvals} approvals`, color: bucket.approvals ? 'warning' : 'success' },
      { label: `${bucket.holds} holds`, color: bucket.holds ? 'error' : 'success' },
      {
        label: `${bucket.discountEligible} discounts`,
        color: bucket.discountEligible ? 'info' : 'default',
      },
    ],
    summary: [
      { label: 'Bucket balance', value: formatCurrency(bucket.amount) },
      { label: 'Bill count', value: bucket.count },
      { label: 'Held bills', value: bucket.holds },
      { label: 'Approvals waiting', value: bucket.approvals },
      { label: 'Blocked suppliers', value: bucket.blockedSuppliers },
    ],
    tables: [
      {
        title: 'Bucket Liabilities',
        columns: [
          { key: 'number', label: 'Bill' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'paymentStage', label: 'Payment Stage' },
          { key: 'overdueDays', label: 'Overdue Days' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: bucket.bills.map((bill) => ({
          number: bill.number,
          supplier: bill.supplier?.name,
          paymentStage: bill.paymentStage,
          overdueDays: bill.overdueDays,
          balance: formatCurrency(bill.balanceDue),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Escalation load',
        description: 'Older liabilities should remain in treasury and controller watchlists.',
        status: bucket.id === '90-plus' ? 'error' : bucket.id === '61-90' ? 'warning' : 'info',
        value: bucket.label,
      },
    ],
    referenceLinks: bucket.bills.slice(0, 5).map((bill) => ({
      label: bill.number,
      description: bill.supplier?.name,
      href: paths.dashboard.accountingFinance.payables.unpaidBillDetail(bill.id),
      icon: 'solar:bill-list-bold',
    })),
    timeline: bucket.bills.flatMap((bill) => bill.timeline).slice(0, 5),
  };
}

export default function PayableDetail({ mode, id }) {
  const { data: apiBill, isLoading, error } = useSWR(
    mode === 'bill' ? `${endpoints.accounting.bill_by_id(id)}` : null,
    fetcher
  );

  const config = useMemo(() => {
    if (mode === 'bill') {
      if (isLoading) return { loading: true };
      if (error || !apiBill) return { notFound: true, title: 'Bill Detail', backHref: paths.dashboard.accountingFinance.payables.unpaidBills };
      return buildBillDetailFromApi(apiBill);
    }

    if (mode === 'supplier') return buildSupplierDetail(id);
    if (mode === 'statement') return buildStatementDetail(id);
    if (mode === 'bucket') return buildBucketView(id);
    return buildBillDetail(id, mode);
  }, [mode, id, apiBill, isLoading, error]);

  if (config.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (config.notFound) {
    return <TransactionRecordNotFound title={config.title} backHref={config.backHref} />;
  }

  return <TransactionDetailShell {...config} />;
}
