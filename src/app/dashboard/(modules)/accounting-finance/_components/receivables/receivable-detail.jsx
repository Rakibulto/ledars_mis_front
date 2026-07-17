'use client';

import { paths } from 'src/routes/paths';

import { formatCurrency } from '../utils';
import {
  getBucketLabel,
  getInvoiceById,
  getBucketDetail,
  getCustomerDetail,
  getStatementDetail,
} from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from '../transactions/transaction-detail-shell';

const PRIORITY_COLORS = {
  routine: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

function buildCustomerDetail(id) {
  const detail = getCustomerDetail(id);
  if (!detail) {
    return {
      notFound: true,
      title: 'Customer Ledger Detail',
      backHref: paths.dashboard.accountingFinance.receivables.customerLedger,
    };
  }

  return {
    title: 'Customer Ledger Detail',
    subtitle: detail.customer.name,
    documentNumber: detail.customer.code,
    backHref: paths.dashboard.accountingFinance.receivables.customerLedger,
    chips: [
      { label: detail.customer.segment, color: 'info' },
      {
        label: detail.customer.riskLevel,
        color: PRIORITY_COLORS[detail.customer.riskLevel] || 'default',
      },
      {
        label: detail.customer.approvalState,
        color: detail.customer.approvalState === 'approved' ? 'success' : 'warning',
      },
    ],
    alerts: detail.disputedInvoices.length
      ? [
          {
            severity: 'warning',
            title: `${detail.disputedInvoices.length} disputed invoices require evidence follow-up`,
            description:
              'Collections should coordinate with program teams before additional escalation.',
          },
        ]
      : [],
    summary: [
      { label: 'Collector', value: detail.customer.collector },
      { label: 'Outstanding balance', value: formatCurrency(detail.outstanding) },
      { label: 'Credit limit', value: formatCurrency(detail.customer.creditLimit) },
      { label: 'Collection note', value: detail.customer.collectionNote },
    ],
    sections: [
      {
        title: 'Customer Controls',
        items: [
          { label: 'Email', value: detail.customer.email },
          { label: 'Risk level', value: detail.customer.riskLevel },
          { label: 'Dispute flags', value: detail.customer.disputeFlags },
          { label: 'Approval state', value: detail.customer.approvalState },
        ],
      },
    ],
    tables: [
      {
        title: 'Open Invoice Exposure',
        columns: [
          { key: 'number', label: 'Invoice' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'bucketLabel', label: 'Bucket' },
          { key: 'followUpStage', label: 'Follow-Up' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: detail.invoices.map((invoice) => ({
          number: invoice.number,
          dueDate: formatDetailDate(invoice.dueDate),
          bucketLabel: invoice.bucketLabel,
          followUpStage: invoice.followUpStage,
          balance: formatCurrency(invoice.balanceDue),
        })),
      },
      {
        title: 'Statement History',
        columns: [
          { key: 'periodLabel', label: 'Statement' },
          { key: 'sentStatus', label: 'Send Status' },
          { key: 'approvalState', label: 'Approval' },
          { key: 'closingBalance', label: 'Closing Balance', align: 'right' },
        ],
        rows: detail.statements.map((statement) => ({
          periodLabel: statement.periodLabel,
          sentStatus: statement.sentStatus,
          approvalState: statement.approvalState,
          closingBalance: formatCurrency(statement.closingBalance),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Dispute monitoring',
        description: 'Customer disputes should remain visible in all collection cycles.',
        status: detail.disputedInvoices.length ? 'warning' : 'success',
        value: detail.disputedInvoices.length ? 'attention needed' : 'clear',
      },
      {
        label: 'Credit governance',
        description: 'Outstanding balance should stay within the approved credit limit.',
        status: detail.outstanding > detail.customer.creditLimit ? 'error' : 'success',
        value: detail.outstanding > detail.customer.creditLimit ? 'over limit' : 'within limit',
      },
    ],
    referenceLinks: detail.statements.map((statement) => ({
      label: statement.periodLabel,
      description: 'Open customer statement detail',
      href: paths.dashboard.accountingFinance.receivables.customerStatementDetail(statement.id),
      icon: 'solar:file-text-bold',
    })),
    timeline: detail.timeline,
    auditTrail: [
      {
        primary: 'Collector',
        secondary: 'Assigned receivables owner',
        meta: detail.customer.collector,
      },
      {
        primary: 'Data source',
        secondary: 'Loaded from receivables mock layer',
        meta: 'Mock dataset',
      },
    ],
  };
}

function buildInvoiceDetail(id) {
  const invoice = getInvoiceById(id);
  if (!invoice) {
    return {
      notFound: true,
      title: 'Receivable Invoice Detail',
      backHref: paths.dashboard.accountingFinance.receivables.dueInvoices,
    };
  }

  return {
    title: 'Receivable Invoice Detail',
    subtitle: invoice.customer?.name,
    documentNumber: invoice.number,
    backHref: paths.dashboard.accountingFinance.receivables.dueInvoices,
    chips: [
      {
        label: invoice.status,
        color:
          invoice.status === 'paid'
            ? 'success'
            : invoice.status === 'overdue'
              ? 'error'
              : 'warning',
      },
      {
        label: invoice.approvalState,
        color: invoice.approvalState === 'approved' ? 'success' : 'warning',
      },
      { label: invoice.bucketLabel, color: 'info' },
    ],
    alerts: invoice.disputed
      ? [
          {
            severity: 'warning',
            title: 'Invoice is under dispute',
            description: invoice.disputeReason,
          },
        ]
      : [],
    summary: [
      { label: 'Customer', value: invoice.customer?.name },
      { label: 'Description', value: invoice.description },
      { label: 'Outstanding balance', value: formatCurrency(invoice.balanceDue) },
      { label: 'Promise to pay', value: formatDetailDate(invoice.promiseToPay) },
    ],
    sections: [
      {
        title: 'Collection Controls',
        items: [
          { label: 'Follow-up stage', value: invoice.followUpStage },
          { label: 'Reminder template', value: invoice.reminderTemplate },
          { label: 'Escalation rule', value: invoice.escalationRule, fullWidth: true },
          { label: 'Last contact', value: formatDetailDate(invoice.lastContact) },
          { label: 'Approval owner', value: invoice.approvalOwner },
        ],
      },
    ],
    tables: [
      {
        title: 'Receivable Position',
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
        ],
        rows: [
          { metric: 'Invoice total', value: formatCurrency(invoice.total) },
          { metric: 'Paid amount', value: formatCurrency(invoice.paidAmount) },
          { metric: 'Balance due', value: formatCurrency(invoice.balanceDue) },
          { metric: 'Overdue days', value: invoice.overdueDays },
        ],
      },
      {
        title: 'Collection Notes',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'author', label: 'Author' },
          { key: 'message', label: 'Message' },
        ],
        rows: invoice.notes,
      },
    ],
    controlChecks: [
      {
        label: 'Promise-to-pay monitoring',
        description:
          'Invoices with promises should remain in the collector queue until cash clears.',
        status: invoice.promiseToPay ? 'info' : 'warning',
        value: invoice.promiseToPay ? 'promised' : 'not secured',
      },
      {
        label: 'Dispute posture',
        description: 'Disputed invoices should carry supporting context.',
        status: invoice.disputed ? 'error' : 'success',
        value: invoice.disputed ? 'disputed' : 'clear',
      },
    ],
    referenceLinks: [
      {
        label: 'Customer ledger detail',
        description: 'View customer-level receivable exposure',
        href: paths.dashboard.accountingFinance.receivables.customerLedgerDetail(
          invoice.customerId
        ),
        icon: 'solar:user-id-bold',
      },
      {
        label: 'Collection workflow detail',
        description: 'Open the same record from the follow-up queue',
        href: paths.dashboard.accountingFinance.receivables.collectionFollowUpDetail(invoice.id),
        icon: 'solar:mailbox-bold',
      },
    ],
    timeline: invoice.timeline,
    auditTrail: [
      { primary: 'Customer', secondary: 'Receivables counterparty', meta: invoice.customer?.name },
      {
        primary: 'Approval owner',
        secondary: 'Collection or billing approver',
        meta: invoice.approvalOwner,
      },
    ],
  };
}

function buildFollowUpDetail(id) {
  const detail = buildInvoiceDetail(id);

  if (detail.notFound) {
    return {
      ...detail,
      title: 'Collection Workflow Detail',
      backHref: paths.dashboard.accountingFinance.receivables.collectionFollowUp,
    };
  }

  return {
    ...detail,
    title: 'Collection Workflow Detail',
    backHref: paths.dashboard.accountingFinance.receivables.collectionFollowUp,
    summary: [
      { label: 'Customer', value: detail.subtitle },
      { label: 'Workflow stage', value: detail.sections?.[0]?.items?.[0]?.value || '—' },
      { label: 'Outstanding balance', value: detail.summary?.[2]?.value || '—' },
      { label: 'Promise to pay', value: detail.summary?.[3]?.value || '—' },
    ],
  };
}

function buildStatementDetail(id) {
  const statement = getStatementDetail(id);
  if (!statement) {
    return {
      notFound: true,
      title: 'Customer Statement Detail',
      backHref: paths.dashboard.accountingFinance.receivables.customerStatements,
    };
  }

  return {
    title: 'Customer Statement Detail',
    subtitle: statement.customer?.name,
    documentNumber: statement.periodLabel,
    backHref: paths.dashboard.accountingFinance.receivables.customerStatements,
    chips: [
      {
        label: statement.sentStatus,
        color: statement.sentStatus === 'sent' ? 'success' : 'warning',
      },
      {
        label: statement.approvalState,
        color: statement.approvalState === 'approved' ? 'success' : 'warning',
      },
    ],
    alerts: statement.disputedCount
      ? [
          {
            severity: 'warning',
            title: `${statement.disputedCount} disputed items appear in this statement`,
            description: statement.disputeNote,
          },
        ]
      : [],
    summary: [
      { label: 'Customer', value: statement.customer?.name },
      {
        label: 'Period',
        value: `${formatDetailDate(statement.startDate)} to ${formatDetailDate(statement.endDate)}`,
      },
      { label: 'Opening balance', value: formatCurrency(statement.openingBalance) },
      { label: 'Closing balance', value: formatCurrency(statement.closingBalance) },
    ],
    sections: [
      {
        title: 'Statement Pipeline',
        items: [
          { label: 'Send status', value: statement.sentStatus },
          { label: 'Approval state', value: statement.approvalState },
          { label: 'Dispute note', value: statement.disputeNote, fullWidth: true },
        ],
      },
    ],
    tables: [
      {
        title: 'Statement Lines',
        columns: [
          { key: 'number', label: 'Invoice' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: statement.invoices.map((invoice) => ({
          number: invoice.number,
          dueDate: formatDetailDate(invoice.dueDate),
          status: invoice.status,
          balance: formatCurrency(invoice.balanceDue),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Statement completeness',
        description: 'Statements should include all open invoices for the customer.',
        status: statement.invoices.length ? 'success' : 'warning',
        value: statement.invoices.length ? 'covered' : 'empty',
      },
    ],
    referenceLinks: [
      {
        label: 'Customer ledger detail',
        description: 'Return to the customer ledger view',
        href: paths.dashboard.accountingFinance.receivables.customerLedgerDetail(
          statement.customerId
        ),
        icon: 'solar:user-id-bold',
      },
    ],
    timeline: statement.invoices.flatMap((invoice) => invoice.timeline).slice(0, 5),
  };
}

function buildBucketView(bucketId) {
  const bucket = getBucketDetail(bucketId);
  if (!bucket) {
    return {
      notFound: true,
      title: 'Aging Bucket Detail',
      backHref: paths.dashboard.accountingFinance.receivables.agingReport,
    };
  }

  return {
    title: 'Aging Bucket Detail',
    subtitle: getBucketLabel(bucket.id),
    documentNumber: bucket.label,
    backHref: paths.dashboard.accountingFinance.receivables.agingReport,
    chips: [
      { label: `${bucket.count} invoices`, color: 'info' },
      { label: `${bucket.approvals} approvals`, color: bucket.approvals ? 'warning' : 'success' },
      { label: `${bucket.disputed} disputes`, color: bucket.disputed ? 'error' : 'success' },
    ],
    summary: [
      { label: 'Bucket balance', value: formatCurrency(bucket.amount) },
      { label: 'Invoice count', value: bucket.count },
      { label: 'Disputed invoices', value: bucket.disputed },
      { label: 'Approvals waiting', value: bucket.approvals },
    ],
    tables: [
      {
        title: 'Bucket Exposure',
        columns: [
          { key: 'number', label: 'Invoice' },
          { key: 'customer', label: 'Customer' },
          { key: 'followUpStage', label: 'Follow-Up' },
          { key: 'overdueDays', label: 'Overdue Days' },
          { key: 'balance', label: 'Balance', align: 'right' },
        ],
        rows: bucket.invoices.map((invoice) => ({
          number: invoice.number,
          customer: invoice.customer?.name,
          followUpStage: invoice.followUpStage,
          overdueDays: invoice.overdueDays,
          balance: formatCurrency(invoice.balanceDue),
        })),
      },
    ],
    controlChecks: [
      {
        label: 'Escalation load',
        description: 'Older buckets should move through tighter approval and escalation controls.',
        status: bucket.id === '90-plus' ? 'error' : bucket.id === '61-90' ? 'warning' : 'info',
        value: bucket.label,
      },
    ],
    referenceLinks: bucket.invoices.slice(0, 5).map((invoice) => ({
      label: invoice.number,
      description: invoice.customer?.name,
      href: paths.dashboard.accountingFinance.receivables.dueInvoiceDetail(invoice.id),
      icon: 'solar:bill-list-bold',
    })),
    timeline: bucket.invoices.flatMap((invoice) => invoice.timeline).slice(0, 5),
  };
}

export default function ReceivableDetail({ mode, id }) {
  const config =
    mode === 'customer'
      ? buildCustomerDetail(id)
      : mode === 'follow-up'
        ? buildFollowUpDetail(id)
        : mode === 'statement'
          ? buildStatementDetail(id)
          : mode === 'bucket'
            ? buildBucketView(id)
            : buildInvoiceDetail(id);

  if (config.notFound) {
    return <TransactionRecordNotFound title={config.title} backHref={config.backHref} />;
  }

  return <TransactionDetailShell {...config} />;
}
