'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GatewayPage } from '../../../_components/gateway-page';
import { GatewayVoucherForm } from '../../../_components/gateway-voucher-form';

export default function JournalVoucherCreatePage() {
  return (
    <GatewayPage
      heading="Create journal voucher"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Vouchers', href: paths.dashboard.accountsGateway.vouchers.root },
        { name: 'Journal', href: paths.dashboard.accountsGateway.vouchers.journal },
        { name: 'Create' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.accountsGateway.vouchers.journalList}
          variant="outlined"
          startIcon={<Iconify icon="solar:list-bold-duotone" />}
        >
          Journal vouchers
        </Button>
      }
    >
      <GatewayVoucherForm voucherType="journal" />
    </GatewayPage>
  );
}
