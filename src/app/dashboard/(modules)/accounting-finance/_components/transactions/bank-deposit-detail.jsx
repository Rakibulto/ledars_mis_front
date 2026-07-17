'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { getBankDepositById } from './mock-data';
import { enrichDeposit } from './use-bank-deposits-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const RECON_COLORS = {
  pending: 'warning',
  reconciled: 'success',
};

export default function BankDepositDetail({ depositId }) {
  const isNumeric = !Number.isNaN(Number(depositId));
  const { data: rawDeposit } = useSWR(
    isNumeric ? endpoints.accounting.bank_deposit_by_id(depositId) : null,
    fetcher
  );
  const [deposit, setDeposit] = useState(
    isNumeric ? null : (getBankDepositById(depositId) ?? null)
  );
  useEffect(() => {
    if (rawDeposit) setDeposit(enrichDeposit(rawDeposit));
  }, [rawDeposit]);

  if (!deposit) {
    return (
      <TransactionRecordNotFound
        title="Bank Deposit"
        backHref={paths.dashboard.accountingFinance.transactions.bankDeposits}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Bank Deposit Detail"
      subtitle="Treasury control for deposit origin, posting, and bank reconciliation status."
      documentNumber={deposit.number}
      backHref={paths.dashboard.accountingFinance.transactions.bankDeposits}
      chips={[
        <Chip
          key="status"
          label={deposit.status}
          size="small"
          color={STATUS_COLORS[deposit.status]}
          sx={{ textTransform: 'capitalize' }}
        />,
        <Chip
          key="recon"
          label={deposit.reconciliationStatus}
          size="small"
          color={RECON_COLORS[deposit.reconciliationStatus]}
          sx={{ textTransform: 'capitalize' }}
        />,
      ]}
      actions={[
        {
          label: 'Reconcile deposit',
          icon: 'solar:check-read-bold',
          variant: 'contained',
          disabled: deposit.reconciliationStatus === 'reconciled',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.bank_deposit_reconcile(depositId)
              );
              setDeposit(enrichDeposit(data));
              toast.success('Deposit reconciled successfully');
            } catch (error) {
              toast.error(
                error?.response?.data?.error ||
                  error?.response?.data?.detail ||
                  error?.message ||
                  'Action failed'
              );
            }
          },
        },
      ]}
      summary={[
        { label: 'Deposit amount', value: formatCurrency(deposit.amount) },
        { label: 'Bank account', value: deposit.bankAccount },
        { label: 'Source', value: deposit.source },
        { label: 'Deposit method', value: deposit.depositMethod },
      ]}
      sections={[
        {
          title: 'Deposit Overview',
          items: [
            { label: 'Deposit date', value: formatDetailDate(deposit.date) },
            { label: 'Bank account', value: deposit.bankAccount },
            { label: 'Source', value: deposit.source },
            { label: 'Deposit method', value: deposit.depositMethod },
            { label: 'Slip reference', value: deposit.depositSlipRef },
            { label: 'Prepared by', value: deposit.preparedBy },
            { label: 'Description', value: deposit.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Treasury Control',
          items: [
            {
              primary: 'Reconciliation status',
              secondary: 'Bank matching state',
              meta: deposit.reconciliationStatus,
            },
            { primary: 'Posting status', secondary: 'Journal release state', meta: deposit.status },
            {
              primary: 'Slip reference',
              secondary: 'Physical deposit evidence',
              meta: deposit.depositSlipRef,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Bank reconciliation',
          description: 'Deposit should be matched to bank statement activity',
          status: deposit.reconciliationStatus === 'reconciled' ? 'success' : 'warning',
          value: deposit.reconciliationStatus,
        },
        {
          label: 'Posting release',
          description: 'Deposit journal status for treasury close',
          status: deposit.status === 'posted' ? 'success' : 'warning',
          value: deposit.status,
        },
        {
          label: 'Deposit evidence',
          description: 'Deposit should include slip reference and preparer ownership',
          status: deposit.depositSlipRef && deposit.preparedBy ? 'success' : 'warning',
          value: deposit.depositSlipRef || 'pending',
        },
      ]}
      timeline={[
        {
          label: 'Deposit logged',
          description: deposit.description,
          status: deposit.source,
          tone: 'info',
          time: formatDetailDate(deposit.date),
          icon: 'solar:inbox-archive-bold',
        },
        {
          label: 'Reconciliation state',
          description: `Bank account ${deposit.bankAccount}`,
          status: deposit.reconciliationStatus,
          tone: deposit.reconciliationStatus === 'reconciled' ? 'success' : 'warning',
          icon: 'solar:check-read-bold',
        },
      ]}
    />
  );
}
