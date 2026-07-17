'use client';

import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { enrichVoucher } from './use-vouchers-api';
import { getVoucherById, getVoucherApprovalsById, getVoucherAttachmentsById } from './mock-data';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  pending: 'warning',
  approved: 'info',
  posted: 'success',
  rejected: 'error',
  cancelled: 'error',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  posted: 'Posted',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_ACTIONS = {
  draft: [
    { status: 'pending', label: 'Submit for Approval', variant: 'contained' },
    {
      status: 'cancelled',
      label: 'Cancel Voucher',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  pending: [
    { status: 'approved', label: 'Approve Voucher', variant: 'contained' },
    { status: 'draft', label: 'Return to Draft', variant: 'outlined', color: 'inherit' },
    {
      status: 'cancelled',
      label: 'Cancel Voucher',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  approved: [
    { status: 'posted', label: 'Post Voucher', variant: 'contained', confirmation: 'post' },
    {
      status: 'cancelled',
      label: 'Cancel Voucher',
      variant: 'outlined',
      color: 'error',
      confirmation: 'cancel',
    },
  ],
  posted: [],
  rejected: [],
  cancelled: [],
};

export default function VoucherDetail({ voucherId }) {
  const detailUrl = endpoints.accounting.voucher_by_id(voucherId);
  const isNumeric = !Number.isNaN(Number(voucherId));
  const { data: rawVoucher } = useSWR(isNumeric ? detailUrl : null, fetcher);
  const [voucher, setVoucher] = useState(isNumeric ? null : (getVoucherById(voucherId) ?? null));
  const [statusConfirmation, setStatusConfirmation] = useState(null);
  useEffect(() => {
    if (rawVoucher) setVoucher(enrichVoucher(rawVoucher));
  }, [rawVoucher]);

  if (!voucher) {
    return (
      <TransactionRecordNotFound
        title="Voucher"
        backHref={paths.dashboard.accountingFinance.transactions.vouchers}
      />
    );
  }

  const approvals = getVoucherApprovalsById(voucher.id);
  const attachments = getVoucherAttachmentsById(voucher.id);

  const statusActions = STATUS_ACTIONS[voucher.status] || [];

  const executeStatusTransition = async (nextStatus) => {
    const loadingToastId = toast.loading(
      `Updating status to ${STATUS_LABELS[nextStatus] || nextStatus}…`
    );

    try {
      const actionEndpoints = {
        pending: endpoints.accounting.voucher_submit(voucherId),
        approved: endpoints.accounting.voucher_approve(voucherId),
        posted: endpoints.accounting.voucher_post(voucherId),
      };
      const actionUrl = actionEndpoints[nextStatus];
      let data;
      if (actionUrl) {
        ({ data } = await axiosInstance.post(actionUrl));
      } else {
        ({ data } = await axiosInstance.patch(endpoints.accounting.voucher_by_id(voucherId), {
          status: nextStatus,
        }));
      }
      if (data) {
        setVoucher(enrichVoucher(data));
      }
      await mutate(detailUrl);
      toast.dismiss(loadingToastId);
      toast.success(`Voucher status changed to ${STATUS_LABELS[nextStatus] || nextStatus}`);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(error?.response?.data?.error || error?.message || 'Failed to update status');
    } finally {
      setStatusConfirmation(null);
    }
  };

  const actions = statusActions.map((action) => ({
    ...action,
    onClick: () => {
      if (action.confirmation) {
        setStatusConfirmation(action);
        return;
      }
      executeStatusTransition(action.status);
    },
  }));

  return (
    <>
      <TransactionDetailShell
        title="Voucher Detail"
        subtitle="Approval-ready voucher control for submission, review, posting, and supporting documents."
        documentNumber={voucher.number}
        backHref={paths.dashboard.accountingFinance.transactions.vouchers}
        chips={[
          <Chip
            key="status"
            label={STATUS_LABELS[voucher.status] || voucher.status}
            size="small"
            color={STATUS_COLORS[voucher.status] || 'default'}
            sx={{ textTransform: 'capitalize' }}
          />,
          <Chip
            key="approval"
            label={voucher.approval_status}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />,
        ]}
        actions={actions}
        summary={[
          { label: 'Voucher amount', value: formatCurrency(voucher.amount, voucher.currency) },
          { label: 'Approvers', value: approvals.length },
          { label: 'Attachments', value: attachments.length },
        ]}
        sections={[
          {
            title: 'Voucher Overview',
            items: [
              { label: 'Reference', value: voucher.reference },
              { label: 'Voucher date', value: formatDetailDate(voucher.date) },
              { label: 'Voucher type', value: voucher.voucher_type },
              { label: 'Journal', value: voucher.journal_name },
              { label: 'Partner', value: voucher.partner_name },
              { label: 'Payment method', value: voucher.payment_method_name },
            ],
          },
        ]}
        tables={[
          {
            title: 'Approval Chain',
            columns: [
              { key: 'approver', label: 'Approver' },
              { key: 'status', label: 'Status' },
            ],
            rows: approvals.map((approval) => ({
              approver: approval.approver_name,
              status: approval.status,
            })),
            emptyMessage: 'No approval steps are configured for this voucher.',
          },
          {
            title: 'Attachment Register',
            columns: [
              { key: 'name', label: 'Attachment' },
              { key: 'type', label: 'Type' },
            ],
            rows: attachments.map((attachment, index) => ({
              name: `Voucher support ${index + 1}`,
              type: attachment.id,
            })),
            emptyMessage: 'No supporting attachments are linked to this voucher.',
          },
        ]}
        sidebar={[
          {
            title: 'Posting Control',
            items: [
              { primary: 'Voucher status', secondary: 'Workflow stage', meta: voucher.status },
              {
                primary: 'Approval status',
                secondary: 'Reviewer outcome',
                meta: voucher.approval_status,
              },
              {
                primary: 'Journal destination',
                secondary: 'Posting target',
                meta: voucher.journal_name,
              },
            ],
          },
        ]}
        controlChecks={[
          {
            label: 'Approval completion',
            description: 'Voucher must clear approval chain before posting',
            status:
              voucher.approval_status === 'approved'
                ? 'success'
                : voucher.status === 'rejected'
                  ? 'error'
                  : 'warning',
            value: voucher.approval_status,
          },
          {
            label: 'Evidence coverage',
            description: 'Attachment register for support documents',
            status: attachments.length ? 'success' : 'warning',
            value: `${attachments.length} files`,
          },
        ]}
        timeline={[
          {
            label: 'Voucher created',
            description: voucher.reference,
            status: voucher.voucher_type,
            tone: 'info',
            time: formatDetailDate(voucher.date),
            icon: 'solar:document-text-bold',
          },
          {
            label: 'Approval workflow',
            description: `${approvals.length} approver steps configured`,
            status: voucher.approval_status,
            tone:
              voucher.approval_status === 'approved'
                ? 'success'
                : voucher.status === 'rejected'
                  ? 'error'
                  : 'warning',
            icon: 'solar:shield-check-bold',
          },
        ]}
      />

      <Dialog open={Boolean(statusConfirmation)} onClose={() => setStatusConfirmation(null)}>
        <DialogTitle>
          {statusConfirmation?.confirmation === 'post'
            ? 'Confirm Post Voucher'
            : 'Confirm Cancel Voucher'}
        </DialogTitle>
        <DialogContent>
          {statusConfirmation?.confirmation === 'post'
            ? 'Posting this voucher will be recorded and cannot be undone.'
            : 'Cancelling this voucher cannot be undone.'}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusConfirmation(null)}>Cancel</Button>
          <Button
            color={statusConfirmation?.confirmation === 'cancel' ? 'error' : 'primary'}
            variant="contained"
            onClick={() => executeStatusTransition(statusConfirmation.status)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
