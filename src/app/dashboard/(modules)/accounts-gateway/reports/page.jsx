'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { GatewayPage } from '../_components/gateway-page';
import { GatewayHubTile } from '../_components/gateway-hub-tile';

const ITEMS = [
  {
    title: 'Trial Balance',
    description: 'Opening, period, and closing Dr/Cr for every ledger.',
    href: paths.dashboard.accountsGateway.reports.trialBalance,
    icon: 'solar:calculator-bold-duotone',
  },
  {
    title: 'Profit & Loss',
    description: 'Income vs expense for the period — live from journals.',
    href: paths.dashboard.accountsGateway.reports.profitAndLoss,
    icon: 'solar:graph-up-bold-duotone',
  },
  {
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity as of the end date.',
    href: paths.dashboard.accountsGateway.reports.balanceSheet,
    icon: 'solar:chart-square-bold-duotone',
  },
  {
    title: 'Project Statement',
    description: 'Project-wise income, expense, and net — NGO must-have.',
    href: paths.dashboard.accountsGateway.reports.projectStatement,
    icon: 'solar:folder-with-files-bold-duotone',
  },
];

export default function ReportsHomePage() {
  return (
    <GatewayPage
      heading="Statements of Accounts"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Statements' },
      ]}
    >
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          Financial statements for the selected project and period. Every report
          includes Print, CSV, and Excel export of the current view.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <GatewayHubTile {...item} />
          </Grid>
        ))}
      </Grid>
    </GatewayPage>
  );
}
