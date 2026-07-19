'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GatewayPage } from '../../../_components/gateway-page';
import { GatewayVoucherList } from '../../../_components/gateway-voucher-list';

export default function PaymentVoucherListPage() {
  return (
    <GatewayPage
      heading="Payment vouchers"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Vouchers', href: paths.dashboard.accountsGateway.vouchers.root },
        { name: 'Payment', href: paths.dashboard.accountsGateway.vouchers.payment },
        { name: 'Payment vouchers' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.accountsGateway.vouchers.paymentCreate}
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Create payment
        </Button>
      }
    >
      <GatewayVoucherList voucherType="payment" />
    </GatewayPage>
  );
}
