'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GatewayPage } from '../../../_components/gateway-page';
import { GatewayVoucherForm } from '../../../_components/gateway-voucher-form';

export default function PaymentVoucherCreatePage() {
  return (
    <GatewayPage
      heading="Create payment voucher"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Vouchers', href: paths.dashboard.accountsGateway.vouchers.root },
        { name: 'Payment', href: paths.dashboard.accountsGateway.vouchers.payment },
        { name: 'Create' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.accountsGateway.vouchers.paymentList}
          variant="outlined"
          startIcon={<Iconify icon="solar:list-bold-duotone" />}
        >
          Payment vouchers
        </Button>
      }
    >
      <GatewayVoucherForm voucherType="payment" />
    </GatewayPage>
  );
}
