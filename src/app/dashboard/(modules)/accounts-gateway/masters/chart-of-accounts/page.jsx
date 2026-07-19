'use client';

import { paths } from 'src/routes/paths';

import ChartOfAccounts from 'src/app/dashboard/(modules)/accounting-finance/_components/configuration/chart-of-accounts';

import { GatewayPage } from '../../_components/gateway-page';
import { useGatewayProject } from '../../_components/gateway-project-context';

export default function GatewayCoaPage() {
  const { projectId } = useGatewayProject();

  return (
    <GatewayPage
      heading="Chart of Accounts"
      links={[
        { name: 'Dashboard', href: paths.dashboard.root },
        { name: 'Accounts', href: paths.dashboard.accountsGateway.root },
        { name: 'Masters', href: paths.dashboard.accountsGateway.masters.root },
        { name: 'Chart of Accounts' },
      ]}
    >
      <ChartOfAccounts
        embedded
        requireProject
        ngoProjectId={projectId}
        getLedgerHref={(account) =>
          `${paths.dashboard.accountsGateway.display.ledger}?account=${account.id}`
        }
      />
    </GatewayPage>
  );
}
