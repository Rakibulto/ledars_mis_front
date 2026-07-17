'use client';

import FormDetail from '../../_components/forms/detail';

export default function Page({ params }) {
  return <FormDetail id={params.id} />;
}
