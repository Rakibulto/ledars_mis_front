import { Box } from '@mui/material';

import TemplatesPage from 'src/sections/ledars-management/templates/templates-page';
import VendorEnlistmentPrint from 'src/sections/ledars-management/templates/final-template';

export default function Page() {
  return (
    <Box>
      <VendorEnlistmentPrint />
      <TemplatesPage />
    </Box>
  );
}
