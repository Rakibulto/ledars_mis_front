'use client';

import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { endpoints, fetcher } from 'src/utils/axios';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GatewayKpiCard } from './_components/gateway-kpi-card';
import { GatewayProjectBar } from './_components/gateway-project-bar';
import { useGatewayProject } from './_components/gateway-project-context';
import { useGatewayApi } from './_components/use-gateway-api';
import { downloadCsv } from './_components/gateway-export';
import { GatewayVoucherMenuDialog } from './_components/gateway-voucher-chooser';

function monthBounds() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

function MenuLink({ title, href, icon, hint, onClick }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea
        {...(onClick
          ? { onClick, component: 'button', type: 'button' }
          : { component: RouterLink, href })}
        sx={{ p: 1.5, height: '100%', alignItems: 'flex-start', width: '100%' }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon={icon} width={20} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {title}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary" display="block">
                {hint}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function MenuSection({ title, items }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ mb: 1.25, display: 'block', letterSpacing: 1 }}
      >
        {title}
      </Typography>
      <Grid container spacing={1.5}>
        {items.map((item) => (
          <Grid key={item.title} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <MenuLink {...item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function AccountsGatewayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { project, projectId, projects } = useGatewayProject();
  const { banks, accounts } = useGatewayApi();
  const bounds = useMemo(() => monthBounds(), []);
  const [voucherMenuType, setVoucherMenuType] = useState(null);

  // Nav → /accounts-gateway?voucher=payment opens the popup on this dashboard
  useEffect(() => {
    const type = searchParams.get('voucher');
    if (type === 'payment' || type === 'receipt' || type === 'journal') {
      setVoucherMenuType(type);
      router.replace(paths.dashboard.accountsGateway.root);
    }
  }, [searchParams, router]);

  const openVoucherMenu = (type) => setVoucherMenuType(type);
  const closeVoucherMenu = () => setVoucherMenuType(null);

  const dashQs = useMemo(() => {
    const params = new URLSearchParams({
      date_from: bounds.from,
      date_to: bounds.to,
    });
    if (projectId) params.set('ngo_project', String(projectId));
    return params.toString();
  }, [bounds, projectId]);

  const { data: plData } = useSWR(
    `${endpoints.accounting.gateway_profit_and_loss}?${dashQs}`,
    fetcher
  );
  const { data: dayData } = useSWR(
    `${endpoints.accounting.gateway_day_book}?${dashQs}`,
    fetcher
  );

  const bankTotal = useMemo(
    () => banks.reduce((s, b) => s + Number(b.current_balance || 0), 0),
    [banks]
  );

  const kpis = useMemo(
    () => [
      {
        title: 'Cash & bank',
        total: bankTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        icon: 'solar:wallet-money-bold-duotone',
        helper: `${banks.length} book(s)`,
      },
      {
        title: 'Net P&L (month)',
        total: Number(plData?.net_profit || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }),
        icon: 'solar:graph-up-bold-duotone',
        helper: `${bounds.from} → ${bounds.to}`,
      },
      {
        title: 'Day book entries',
        total: dayData?.count ?? '—',
        icon: 'solar:calendar-bold-duotone',
        helper: 'Posted this month',
      },
      {
        title: 'Chart accounts',
        total: accounts.length,
        icon: 'solar:checklist-bold-duotone',
        helper: project ? `Project CoA + bank/cash` : 'Select a project',
      },
    ],
    [bankTotal, banks.length, plData, dayData, accounts.length, bounds, project]
  );

  const voucherMenu = [
    {
      title: 'Payment',
      icon: 'solar:card-send-bold-duotone',
      hint: 'Create or list',
      onClick: () => openVoucherMenu('payment'),
    },
    {
      title: 'Receipt',
      icon: 'solar:card-recive-bold-duotone',
      hint: 'Create or list',
      onClick: () => openVoucherMenu('receipt'),
    },
    {
      title: 'Journal',
      icon: 'solar:notebook-bold-duotone',
      hint: 'Create or list',
      onClick: () => openVoucherMenu('journal'),
    },
  ];

  const displayMenu = [
    {
      title: 'Day book',
      href: paths.dashboard.accountsGateway.display.dayBook,
      icon: 'solar:calendar-bold-duotone',
    },
    {
      title: 'Cash / Bank book',
      href: paths.dashboard.accountsGateway.display.cashBankBook,
      icon: 'solar:wallet-money-bold-duotone',
    },
    {
      title: 'Ledger',
      href: paths.dashboard.accountsGateway.display.ledger,
      icon: 'solar:book-bold-duotone',
    },
  ];

  const statementsMenu = [
    {
      title: 'Trial balance',
      href: paths.dashboard.accountsGateway.reports.trialBalance,
      icon: 'solar:calculator-bold-duotone',
    },
    {
      title: 'Profit & Loss',
      href: paths.dashboard.accountsGateway.reports.profitAndLoss,
      icon: 'solar:graph-up-bold-duotone',
    },
    {
      title: 'Balance sheet',
      href: paths.dashboard.accountsGateway.reports.balanceSheet,
      icon: 'solar:chart-square-bold-duotone',
    },
    {
      title: 'Project statement',
      href: paths.dashboard.accountsGateway.reports.projectStatement,
      icon: 'solar:folder-with-files-bold-duotone',
    },
  ];

  const mastersMenu = [
    {
      title: 'Chart of Accounts',
      href: paths.dashboard.accountsGateway.masters.chartOfAccounts,
      icon: 'solar:checklist-bold-duotone',
    },
    {
      title: 'Bank / Cash',
      href: paths.dashboard.accountsGateway.masters.bankCash,
      icon: 'solar:safe-square-bold-duotone',
    },
    {
      title: 'Journals',
      href: paths.dashboard.accountsGateway.masters.journals,
      icon: 'solar:notebook-bold-duotone',
    },
    {
      title: 'Projects',
      href: paths.dashboard.accountsGateway.projects,
      icon: 'solar:folder-with-files-bold-duotone',
    },
  ];

  const exportDashboard = () => {
    try {
      const projectLabel = project
        ? `${project.code || ''} ${project.title || ''}`.trim()
        : 'All projects';
      const rows = [
        {
          Section: 'KPI',
          Label: 'Project',
          Value: projectLabel,
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'Cash & bank total',
          Value: bankTotal.toFixed(2),
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'Net P&L',
          Value: Number(plData?.net_profit || 0).toFixed(2),
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'Total income',
          Value: Number(plData?.total_income || 0).toFixed(2),
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'Total expense',
          Value: Number(plData?.total_expense || 0).toFixed(2),
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'Day book entries',
          Value: dayData?.count ?? 0,
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'CoA accounts',
          Value: accounts.length,
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        {
          Section: 'KPI',
          Label: 'NGO projects',
          Value: projects.length,
          Period_From: bounds.from,
          Period_To: bounds.to,
        },
        ...banks.map((b) => ({
          Section: 'Bank book',
          Label: b.name || b.bank_name || `Bank #${b.id}`,
          Value: Number(b.current_balance || 0).toFixed(2),
          Period_From: b.account_number || '',
          Period_To: b.status || '',
        })),
      ];
      downloadCsv('accounts-gateway-dashboard', rows);
      toast.success('Dashboard summary exported.');
    } catch (err) {
      toast.error(err?.message || 'Export failed.');
    }
  };

  const recentEntries = (dayData?.results || []).slice(0, 8);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Accounts Dashboard"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Accounts' },
        ]}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:file-text-bold-duotone" />}
              onClick={exportDashboard}
            >
              Export summary
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => openVoucherMenu('payment')}
            >
              Payment
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:card-recive-bold-duotone" />}
              onClick={() => openVoucherMenu('receipt')}
            >
              Receipt
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 3 } }}
      />

      <Card
        sx={{
          p: 2.5,
          mb: 3,
          border: (theme) => `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="overline" color="text.secondary">
              Gateway · LEDARS
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5 }}>
              {project
                ? `${project.code || ''} ${project.title || ''}`.trim()
                : 'Select a company / project'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Current period {bounds.from} to {bounds.to}. Vouchers → Display → Statements.
              Exports available on every report (CSV / Excel / Print).
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              component={RouterLink}
              href={paths.dashboard.accountsGateway.reports.trialBalance}
              variant="soft"
              color="inherit"
            >
              Trial balance
            </Button>
            <Button
              component={RouterLink}
              href={paths.dashboard.accountsGateway.reports.profitAndLoss}
              variant="soft"
              color="inherit"
            >
              P&amp;L
            </Button>
            <Button
              component={RouterLink}
              href={paths.dashboard.accountsGateway.display.dayBook}
              variant="soft"
              color="inherit"
            >
              Day book
            </Button>
          </Stack>
        </Stack>
      </Card>

      <GatewayProjectBar />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <GatewayKpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        Gateway menu
      </Typography>
      <MenuSection title="Accounting vouchers" items={voucherMenu} />
      <MenuSection title="Display books" items={displayMenu} />
      <MenuSection title="Statements of accounts" items={statementsMenu} />
      <MenuSection title="Masters" items={mastersMenu} />

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
        Recent day book (this month)
      </Typography>
      <Card>
        {recentEntries.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>
            No posted entries in this period yet. Create a Payment or Receipt voucher to begin.
          </Typography>
        ) : (
          <Box>
            {recentEntries.map((row) => (
              <Stack
                key={row.id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                justifyContent="space-between"
                sx={{
                  px: 2,
                  py: 1.5,
                  borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
                  '&:last-of-type': { borderBottom: 0 },
                }}
              >
                <Box>
                  <Typography variant="subtitle2">{row.reference}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.date} · {row.journal} · {row.narration || '—'}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  Dr {Number(row.total_debit || 0).toFixed(2)} / Cr{' '}
                  {Number(row.total_credit || 0).toFixed(2)}
                </Typography>
              </Stack>
            ))}
          </Box>
        )}
      </Card>

      <GatewayVoucherMenuDialog
        voucherType={voucherMenuType || 'payment'}
        open={Boolean(voucherMenuType)}
        onClose={closeVoucherMenu}
      />
    </DashboardContent>
  );
}
