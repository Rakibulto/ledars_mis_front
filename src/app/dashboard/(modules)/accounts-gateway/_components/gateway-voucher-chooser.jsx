'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

export const VOUCHER_MENU_META = {
  payment: {
    dialogTitle: 'Payment',
    createLabel: 'Create',
    listLabel: 'Payment vouchers',
    createHref: paths.dashboard.accountsGateway.vouchers.paymentCreate,
    listHref: paths.dashboard.accountsGateway.vouchers.paymentList,
    createIcon: 'mingcute:add-line',
    listIcon: 'solar:list-bold-duotone',
    createHint: 'New payment voucher',
    listHint: 'Browse payment vouchers',
  },
  receipt: {
    dialogTitle: 'Receipt',
    createLabel: 'Create',
    listLabel: 'Receipt vouchers',
    createHref: paths.dashboard.accountsGateway.vouchers.receiptCreate,
    listHref: paths.dashboard.accountsGateway.vouchers.receiptList,
    createIcon: 'mingcute:add-line',
    listIcon: 'solar:list-bold-duotone',
    createHint: 'New receipt voucher',
    listHint: 'Browse receipt vouchers',
  },
  journal: {
    dialogTitle: 'Journal',
    createLabel: 'Create',
    listLabel: 'Journal vouchers',
    createHref: paths.dashboard.accountsGateway.vouchers.journalCreate,
    listHref: paths.dashboard.accountsGateway.vouchers.journalList,
    createIcon: 'mingcute:add-line',
    listIcon: 'solar:list-bold-duotone',
    createHint: 'New journal voucher',
    listHint: 'Browse journal vouchers',
  },
};

/**
 * Popup: Create / List — opened from Accounts Dashboard (or nav via ?voucher=).
 */
export function GatewayVoucherMenuDialog({ voucherType = 'payment', open, onClose }) {
  const router = useRouter();
  const meta = VOUCHER_MENU_META[voucherType] || VOUCHER_MENU_META.payment;

  const go = (href) => {
    onClose?.();
    router.push(href);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{meta.dialogTitle}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose an action
        </Typography>
        <Stack spacing={1.5}>
          <Button
            fullWidth
            size="large"
            variant="contained"
            startIcon={<Iconify icon={meta.createIcon} />}
            onClick={() => go(meta.createHref)}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2">{meta.createLabel}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.85, display: 'block' }}>
                {meta.createHint}
              </Typography>
            </Box>
          </Button>
          <Button
            fullWidth
            size="large"
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon={meta.listIcon} />}
            onClick={() => go(meta.listHref)}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2">{meta.listLabel}</Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                {meta.listHint}
              </Typography>
            </Box>
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
