'use client';

import { mutate } from 'swr';
import { useMemo, useCallback } from 'react';

import { endpoints } from 'src/utils/axios';

import {
  useGetRequest,
  extractErrorMessage,
  useCreateRequest as createRequest,
} from 'src/actions/ledars-hook';

const EP = endpoints.accounting;

function normalizeCollection(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function getInvoiceNumber(invoice) {
  return String(invoice?.number || invoice?.invoice_number || '').trim();
}

function isInvoiceSendable(invoice) {
  return (
    String(invoice?.status || '')
      .trim()
      .toLowerCase() === 'draft'
  );
}

export function useReceivablesApiActions() {
  const { data: rawInvoices, loading } = useGetRequest(EP.invoices);

  const liveInvoices = useMemo(() => normalizeCollection(rawInvoices), [rawInvoices]);

  const invoiceIndexByNumber = useMemo(
    () =>
      new Map(
        liveInvoices
          .map((invoice) => [getInvoiceNumber(invoice), invoice])
          .filter(([number]) => number)
      ),
    [liveInvoices]
  );

  const sendMockInvoices = useCallback(
    async (mockInvoices) => {
      const uniqueInvoices = Array.from(
        new Map(
          (mockInvoices || [])
            .filter((invoice) => getInvoiceNumber(invoice))
            .map((invoice) => [getInvoiceNumber(invoice), invoice])
        ).values()
      );

      const results = await Promise.all(
        uniqueInvoices.map(async (invoice) => {
          const liveInvoice = invoiceIndexByNumber.get(getInvoiceNumber(invoice));

          if (!liveInvoice?.id || !isInvoiceSendable(liveInvoice)) {
            return { status: 'skipped' };
          }

          try {
            await createRequest(EP.invoice_send(liveInvoice.id), {});
            return { status: 'synced' };
          } catch (error) {
            return {
              status: 'failed',
              errorMessage: extractErrorMessage(error, 'Unable to sync invoice send action.'),
            };
          }
        })
      );

      const summary = results.reduce(
        (accumulator, result) => ({
          synced: accumulator.synced + (result.status === 'synced' ? 1 : 0),
          skipped: accumulator.skipped + (result.status === 'skipped' ? 1 : 0),
          failed: accumulator.failed + (result.status === 'failed' ? 1 : 0),
          errorMessage:
            result.status === 'failed' && result.errorMessage
              ? result.errorMessage
              : accumulator.errorMessage,
        }),
        { synced: 0, skipped: 0, failed: 0, errorMessage: '' }
      );

      if (summary.synced) {
        mutate(EP.invoices);
      }

      return {
        ...summary,
        total: uniqueInvoices.length,
      };
    },
    [invoiceIndexByNumber]
  );

  const registerMockPayments = useCallback(
    async (payments) => {
      const paymentQueue = (payments || []).filter(
        (payment) => payment?.invoiceNumber && Number(payment?.amount) > 0
      );

      const results = await Promise.all(
        paymentQueue.map(async (payment) => {
          const liveInvoice = invoiceIndexByNumber.get(String(payment.invoiceNumber).trim());

          if (!liveInvoice?.id) {
            return { status: 'skipped' };
          }

          try {
            await createRequest(EP.invoice_register_payment(liveInvoice.id), {
              amount: payment.amount,
              reference: payment.reference || '',
            });
            return { status: 'synced' };
          } catch (error) {
            return {
              status: 'failed',
              errorMessage: extractErrorMessage(error, 'Unable to register invoice payment.'),
            };
          }
        })
      );

      const summary = results.reduce(
        (accumulator, result) => ({
          synced: accumulator.synced + (result.status === 'synced' ? 1 : 0),
          skipped: accumulator.skipped + (result.status === 'skipped' ? 1 : 0),
          failed: accumulator.failed + (result.status === 'failed' ? 1 : 0),
          errorMessage:
            result.status === 'failed' && result.errorMessage
              ? result.errorMessage
              : accumulator.errorMessage,
        }),
        { synced: 0, skipped: 0, failed: 0, errorMessage: '' }
      );

      if (summary.synced) {
        mutate(EP.invoices);
      }

      return {
        ...summary,
        total: paymentQueue.length,
      };
    },
    [invoiceIndexByNumber]
  );

  return {
    hasLiveInvoices: liveInvoices.length > 0,
    loading,
    sendMockInvoices,
    registerMockPayments,
  };
}
