'use client';

import WhiteboardDetail from '../../_components/whiteboards/detail';

export default function Page({ params }) {
  return <WhiteboardDetail id={params.id} />;
}
