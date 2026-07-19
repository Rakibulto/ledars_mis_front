'use client';

import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GatewayPage } from '../../../_components/gateway-page';
import { GatewayVoucherList } from '../../../_components/gateway-voucher-list';

export default function ReceiptVoucherListPage() {
  return (
    <GatewayPage
      heading="Receipt vouchers"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Vouchers', href: paths.dashboard.accountsGateway.vouchers.root },
        { name: 'Receipt', href: paths.dashboard.accountsGateway.vouchers.receipt },
        { name: 'Receipt vouchers' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.accountsGateway.vouchers.receiptCreate}
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Create receipt
        </Button>
      }
    >
      <GatewayVoucherList voucherType="receipt" />
    </GatewayPage>
  );
}
