'use client';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { GatewayPage } from '../_components/gateway-page';
import { GatewayHubTile } from '../_components/gateway-hub-tile';

const ITEMS = [
  {
    title: 'Chart of Accounts',
    description: 'Browse ledgers and group structure — the backbone of your books.',
    href: paths.dashboard.accountsGateway.masters.chartOfAccounts,
    icon: 'solar:checklist-bold-duotone',
  },
  {
    title: 'Bank / Cash',
    description: 'Create bank & cash books linked to CoA — required for auto adjustment.',
    href: paths.dashboard.accountsGateway.masters.bankCash,
    icon: 'solar:wallet-money-bold-duotone',
  },
  {
    title: 'Journals',
    description: 'Seed or create Bank / Cash / General journals used by vouchers.',
    href: paths.dashboard.accountsGateway.masters.journals,
    icon: 'solar:notebook-bold-duotone',
  },
  {
    title: 'Projects',
    description: 'Pick the NGO project that owns these books (project-wise accounting).',
    href: paths.dashboard.accountsGateway.projects,
    icon: 'solar:folder-with-files-bold-duotone',
  },
];

export default function MastersHomePage() {
  return (
    <GatewayPage
      heading="Masters"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Masters' },
      ]}
      action={
        <Button
          component={RouterLink}
          href={paths.dashboard.accountsGateway.masters.journals}
          variant="contained"
          startIcon={<Iconify icon="solar:magic-stick-bold-duotone" />}
        >
          Seed journals
        </Button>
      }
    >
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
