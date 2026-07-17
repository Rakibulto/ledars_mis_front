import { PDFDownloadLink } from '@react-pdf/renderer';

import { LoadingButton } from '@mui/lab';

import { Iconify } from 'src/components/iconify';

import PurchaseOrderPDF from './purchase-order-pdf';

const PurchaseOrderDownload = ({ data }) => {
  console.log('');
  return (
    <PDFDownloadLink
      document={<PurchaseOrderPDF data={data} />}
      fileName={`${data?.po_number}.pdf`}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <LoadingButton
          loading={loading}
          variant="text"
          sx={{
            minWidth: 'auto',
            padding: 0,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Iconify icon="solar:download-bold" width={20} color="black" />
        </LoadingButton>
      )}
    </PDFDownloadLink>
  );
};

export default PurchaseOrderDownload;
