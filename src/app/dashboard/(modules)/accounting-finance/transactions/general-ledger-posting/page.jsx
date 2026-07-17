import { Suspense } from 'react';
import GeneralLedgerPosting from '../../_components/transactions/general-ledger-posting';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <GeneralLedgerPosting />
    </Suspense>
  );
}
