'use client';

import { useParams } from 'next/navigation';

import MoneyReceiptDetailView from '../../../_components/money-receipt/money-receipt-detail-view';

export default function Page() {
  const { id } = useParams();
  return <MoneyReceiptDetailView receiptId={id} />;
}
