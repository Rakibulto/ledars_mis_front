import React from 'react';

import { endpoints } from 'src/utils/axios';

import { usePatchRequest } from 'src/actions/ledars-hook';

export default function AddVendorCategory() {
  const { data: catApiData } = useGetRequest(endpoints.procurement_management.vendor_categories);
  const deletRequest = useDeleteRequest;
  const postRequest = useCreateRequest;
  const patchRequest = usePatchRequest;
  return <div>AddVendorCategory</div>;
}
