'use client';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';

import axiosInstance, { fetcher, endpoints } from 'src/utils/axios';

import { formatCurrency } from '../utils';
import { useCurrency } from '../currency-context';
import { getCashTransactionById } from './mock-data';
import { enrichCashTransaction } from './use-workspace-cash-api';
import TransactionDetailShell, {
  formatDetailDate,
  TransactionRecordNotFound,
} from './transaction-detail-shell';

const STATUS_COLORS = {
  draft: 'default',
  posted: 'success',
};

const DIRECTION_COLORS = {
  inflow: 'success',
  outflow: 'warning',
};

export default function CashTransactionDetail({ transactionId }) {
  useCurrency();
  const isNumeric = !Number.isNaN(Number(transactionId));
  const { data: rawTransaction } = useSWR(
    isNumeric ? endpoints.accounting.workspace_cash_transaction_by_id(transactionId) : null,
    fetcher
  );
  const [transaction, setTransaction] = useState(
    isNumeric ? null : (getCashTransactionById(transactionId) ?? null)
  );
  useEffect(() => {
    if (rawTransaction) setTransaction(enrichCashTransaction(rawTransaction));
  }, [rawTransaction]);

  if (!transaction) {
    return (
      <TransactionRecordNotFound
        title="Cash Transaction"
        backHref={paths.dashboard.accountingFinance.transactions.cashTransactions}
      />
    );
  }

  return (
    <TransactionDetailShell
      title="Cash Transaction Detail"
      subtitle="Petty cash movement review for direction, counterparty, and posting control."
      documentNumber={transaction.number}
      backHref={paths.dashboard.accountingFinance.transactions.cashTransactions}
      chips={[
        <Chip
          key="status"
          label={transaction.status}
          size="small"
          color={STATUS_COLORS[transaction.status]}
          sx={{ textTransform: 'capitalize' }}
        />,
        <Chip
          key="direction"
          label={transaction.direction}
          size="small"
          color={DIRECTION_COLORS[transaction.direction]}
          sx={{ textTransform: 'capitalize' }}
        />,
      ]}
      actions={[
        {
          label: 'Post entry',
          icon: 'solar:document-add-bold',
          variant: 'contained',
          disabled: transaction.status === 'posted',
          onClick: async () => {
            try {
              const { data } = await axiosInstance.post(
                endpoints.accounting.workspace_cash_transaction_post(transactionId)
              );
              setTransaction(enrichCashTransaction(data));
              toast.success('Cash transaction posted successfully');
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
        { label: 'Amount', value: formatCurrency(transaction.amount) },
        { label: 'Counterparty', value: transaction.counterparty },
        { label: 'Cash account', value: transaction.account },
        { label: 'Payment document', value: transaction.paymentMethod },
      ]}
      sections={[
        {
          title: 'Transaction Overview',
          items: [
            { label: 'Transaction date', value: formatDetailDate(transaction.date) },
            { label: 'Direction', value: transaction.direction },
            { label: 'Counterparty', value: transaction.counterparty },
            { label: 'Payment document', value: transaction.paymentMethod },
            { label: 'Reference', value: transaction.reference },
            { label: 'Description', value: transaction.description, fullWidth: true },
          ],
        },
      ]}
      sidebar={[
        {
          title: 'Cash Control',
          items: [
            {
              primary: 'Posting state',
              secondary: 'Petty cash journal status',
              meta: transaction.status,
            },
            { primary: 'Direction', secondary: 'Cash movement type', meta: transaction.direction },
            {
              primary: 'Reference control',
              secondary: 'Cash document linkage',
              meta: transaction.reference,
            },
          ],
        },
      ]}
      controlChecks={[
        {
          label: 'Posting status',
          description: 'Cash transaction journal release state',
          status: transaction.status === 'posted' ? 'success' : 'warning',
          value: transaction.status,
        },
        {
          label: 'Cash direction',
          description: 'Inflow and outflow classification for petty cash control',
          status: transaction.direction === 'inflow' ? 'info' : 'warning',
          value: transaction.direction,
        },
        {
          label: 'Document support',
          description: 'Cash movement should carry a payment or receipt reference',
          status: transaction.reference ? 'success' : 'warning',
          value: transaction.paymentMethod || 'pending',
        },
      ]}
      timeline={[
        {
          label: 'Cash movement created',
          description: transaction.description,
          status: transaction.direction,
          tone: transaction.direction === 'inflow' ? 'success' : 'warning',
          time: formatDetailDate(transaction.date),
          icon: 'solar:wallet-money-bold',
        },
      ]}
    />
  );
}
