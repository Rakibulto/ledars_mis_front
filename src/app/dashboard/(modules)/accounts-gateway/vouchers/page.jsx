'use client';

import Grid from '@mui/material/Grid';

import { paths } from 'src/routes/paths';

import { GatewayPage } from '../_components/gateway-page';
import { GatewayHubTile } from '../_components/gateway-hub-tile';

const ITEMS = [
  {
    title: 'Payment',
    description: 'Opens Create / Payment vouchers on the Accounts Dashboard.',
    href: paths.dashboard.accountsGateway.voucherMenu('payment'),
    icon: 'solar:card-send-bold-duotone',
  },
  {
    title: 'Receipt',
    description: 'Opens Create / Receipt vouchers on the Accounts Dashboard.',
    href: paths.dashboard.accountsGateway.voucherMenu('receipt'),
    icon: 'solar:card-recive-bold-duotone',
  },
  {
    title: 'Journal',
    description: 'Opens Create / Journal vouchers on the Accounts Dashboard.',
    href: paths.dashboard.accountsGateway.voucherMenu('journal'),
    icon: 'solar:notebook-bold-duotone',
  },
];

export default function VouchersHomePage() {
  return (
    <GatewayPage
      heading="Vouchers"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Vouchers' },
      ]}
    >
      <Grid container spacing={2}>
        {ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <GatewayHubTile {...item} />
          </Grid>
        ))}
      </Grid>
    </GatewayPage>
  );
}
