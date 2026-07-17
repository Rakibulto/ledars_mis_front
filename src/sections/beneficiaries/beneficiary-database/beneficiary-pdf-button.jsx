import { PDFDownloadLink } from '@react-pdf/renderer';

import { Button, CircularProgress } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import BeneficiaryProfilePDF from './beneficiary-profile-pdf';

const BeneficiaryPDFButton = ({ beneficiary, services }) => (
  <PDFDownloadLink
    document={<BeneficiaryProfilePDF beneficiary={beneficiary} services={services} />}
    fileName={`${beneficiary?.ben_code || 'beneficiary'}-profile.pdf`}
    style={{ textDecoration: 'none' }}
  >
    {({ loading }) => (
      <Button
        variant="contained"
        startIcon={
          loading ? (
            <CircularProgress size={16} sx={{ color: 'white' }} />
          ) : (
            <Iconify icon="solar:download-minimalistic-bold" width={20} />
          )
        }
        disabled={loading}
        sx={{
          textTransform: 'none',
          borderRadius: 2,
          px: 3,
          fontWeight: 600,
          bgcolor: 'success.main',
          '&:hover': {
            bgcolor: 'success.dark',
          },
          '&:disabled': {
            bgcolor: 'success.lighter',
            color: 'success.dark',
          },
        }}
      >
        {loading ? 'Preparing PDF...' : 'Download Profile'}
      </Button>
    )}
  </PDFDownloadLink>
);

export default BeneficiaryPDFButton;
