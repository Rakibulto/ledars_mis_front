'use client';

import { useParams } from 'next/navigation';

import PerdiumClaimForm from '../../../_components/configuration/perdium-claim-form';

export default function PerdiumClaimDetailPage() {
  const params = useParams();
  const id = params?.id;

  if (!id) return null;

  return <PerdiumClaimForm claimId={id} readOnly />;
}
