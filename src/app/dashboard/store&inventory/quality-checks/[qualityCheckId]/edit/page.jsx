import React from 'react';

import QualityCheckFormPage from 'src/sections/store&inventory/quality-control/quality-check-form-page';

export default function QualityCheckEditPage({ params }) {
  return <QualityCheckFormPage mode="edit" qualityCheckId={params?.qualityCheckId} />;
}
