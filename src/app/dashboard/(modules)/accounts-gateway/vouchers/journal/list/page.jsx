'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GatewayPage } from '../../../_components/gateway-page';
import { GatewayVoucherList } from '../../../_components/gateway-voucher-list';

export default function JournalVoucherListPage() {
  return (
    <GatewayPage
      heading="Journal vouchers"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Vouchers', href: paths.dashboard.accountsGateway.vouchers.root },
        { name: 'Journal', href: paths.dashboard.accountsGateway.vouchers.journal },
        { name: 'Journal vouchers' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.accountsGateway.vouchers.journalCreate}
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Create journal
        </Button>
      }
    >
      <GatewayVoucherList voucherType="journal" />
    </GatewayPage>
  );
}
