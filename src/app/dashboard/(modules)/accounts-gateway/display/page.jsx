'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { GatewayPage } from '../_components/gateway-page';
import { GatewayHubTile } from '../_components/gateway-hub-tile';

const ITEMS = [
  {
    title: 'Day Book',
    description: 'All posted journal entries for the selected dates and project.',
    href: paths.dashboard.accountsGateway.display.dayBook,
    icon: 'solar:calendar-bold-duotone',
  },
  {
    title: 'Cash / Bank Book',
    description: 'Bank movements auto-created from vouchers — running balance.',
    href: paths.dashboard.accountsGateway.display.cashBankBook,
    icon: 'solar:wallet-money-bold-duotone',
  },
  {
    title: 'Ledger',
    description: 'Account-wise statement with opening and closing balance.',
    href: paths.dashboard.accountsGateway.display.ledger,
    icon: 'solar:book-bold-duotone',
  },
];

export default function DisplayHomePage() {
  return (
    <GatewayPage
      heading="Display Books"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Display Books' },
      ]}
    >
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          Browse day book, cash/bank book, and ledger like Tally Display. Each screen
          supports Print, CSV, and Excel export of the loaded rows.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 4 }}>
            <GatewayHubTile {...item} />
          </Grid>
        ))}
      </Grid>
    </GatewayPage>
  );
}
