'use client';

import useSWR from 'swr';
import { useMemo } from 'react';

import axiosInstance, { endpoints, fetcher } from 'src/utils/axios';

import { useGatewayProject } from './gateway-project-context';

function asList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function useGatewayApi() {
  const { projectId } = useGatewayProject();

  const accountsKey = projectId
    ? `${endpoints.accounting.accounts}?page_size=500&ordering=code&ngo_project=${projectId}`
    : null;
  const globalBankCoaKey = `${endpoints.accounting.accounts}?page_size=500&ordering=code&global_only=1`;

  const { data: accountsData, isLoading: accountsLoading, mutate: mutateAccounts } = useSWR(
    accountsKey,
    fetcher
  );
  const { data: globalAccountsData, mutate: mutateGlobalAccounts } = useSWR(
    globalBankCoaKey,
    fetcher
  );
  const { data: journalsData, isLoading: journalsLoading, mutate: mutateJournals } = useSWR(
    endpoints.accounting.journals,
    fetcher
  );
  const { data: banksData, isLoading: banksLoading, mutate: mutateBanks } = useSWR(
    endpoints.accounting.bank_accounts,
    fetcher
  );

  const accounts = useMemo(() => asList(accountsData), [accountsData]);
  const globalAccounts = useMemo(() => asList(globalAccountsData), [globalAccountsData]);
  const bankCashAccounts = useMemo(
    () =>
      globalAccounts.filter(
        (a) =>
          a.ngo_project == null &&
          a.liquidity_type === 'bank_cash' &&
          a.is_active !== false &&
          a.is_deprecated !== true
      ),
    [globalAccounts]
  );
  const journals = useMemo(() => asList(journalsData), [journalsData]);
  const banks = useMemo(() => asList(banksData), [banksData]);

  const createBankWithCoa = async (payload) => {
    const { data } = await axiosInstance.post(endpoints.accounting.bank_accounts, payload);
    await mutateBanks();
    await mutateGlobalAccounts();
    return data;
  };

  const updateBank = async (id, payload) => {
    const { data } = await axiosInstance.patch(
      endpoints.accounting.bank_account_by_id(id),
      payload
    );
    await mutateBanks();
    await mutateGlobalAccounts();
    return data;
  };

  const createVoucher = async (payload) => {
    const { data } = await axiosInstance.post(endpoints.accounting.vouchers, payload);
    return data;
  };

  const submitVoucher = async (id) => {
    const { data } = await axiosInstance.post(endpoints.accounting.voucher_submit(id));
    return data;
  };

  const approveVoucher = async (id) => {
    const { data } = await axiosInstance.post(endpoints.accounting.voucher_approve(id));
    return data;
  };

  const postVoucher = async (id) => {
    const { data } = await axiosInstance.post(endpoints.accounting.voucher_post(id));
    return data;
  };

  const reverseVoucher = async (id, remarks = '') => {
    const { data } = await axiosInstance.post(endpoints.accounting.voucher_reverse(id), {
      remarks,
    });
    return data;
  };

  const saveAndPost = async (payload) => {
    const voucher = await createVoucher({ ...payload, status: 'draft' });
    await submitVoucher(voucher.id);
    await approveVoucher(voucher.id);
    const result = await postVoucher(voucher.id);
    return { voucher, result };
  };

  return {
    accounts,
    bankCashAccounts,
    globalAccounts,
    journals,
    banks,
    accountsLoading,
    journalsLoading,
    banksLoading,
    mutateAccounts,
    mutateBanks,
    mutateJournals,
    createBankWithCoa,
    updateBank,
    createVoucher,
    submitVoucher,
    approveVoucher,
    postVoucher,
    reverseVoucher,
    saveAndPost,
  };
}
