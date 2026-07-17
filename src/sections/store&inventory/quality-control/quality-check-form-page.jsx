'use client';

import { useRouter } from 'next/navigation';

import { paths } from 'src/routes/paths';

import QualityCheckFormDialog from './quality-check-form-dialog';

export default function QualityCheckFormPage({ mode = 'create', qualityCheckId }) {
  const router = useRouter();

  const handleClose = () => {
    router.push(paths.dashboard.storeInventory.qualityChecks);
  };

  const handleSuccess = () => {
    router.push(paths.dashboard.storeInventory.qualityChecks);
  };

  return (
    <QualityCheckFormDialog
      open
      mode={mode}
      qualityCheckId={qualityCheckId}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
}
