'use client';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

const NAV_ITEMS = [
  {
    title: 'Posting Rules',
    description:
      'Control how transactions route into debit and credit accounts with condition previews.',
    href: paths.dashboard.accountingFinance.settings.postingRules,
    icon: 'solar:slider-vertical-bold-duotone',
  },
  {
    title: 'Approval Workflow',
    description:
      'Manage multi-level approval chains, thresholds, delegation, and escalation paths.',
    href: paths.dashboard.accountingFinance.settings.approvalWorkflow,
    icon: 'solar:checklist-minimalistic-bold-duotone',
  },
  {
    title: 'Audit Log',
    description: 'Review change history, actor activity, and document-level audit evidence.',
    href: paths.dashboard.accountingFinance.settings.auditLog,
    icon: 'solar:document-text-bold-duotone',
  },
  {
    title: 'Integration Rules',
    description:
      'Configure cross-module syncs, mapping logic, connection ownership, and validation status.',
    href: paths.dashboard.accountingFinance.settings.integrationRules,
    icon: 'solar:plug-circle-bold-duotone',
  },
  {
    title: 'Number Series',
    description:
      'Manage prefixes, reset policies, and next-number readiness for accounting documents.',
    href: paths.dashboard.accountingFinance.settings.numberSeries,
    icon: 'solar:sort-by-time-bold-duotone',
  },
  {
    title: 'Role Permissions',
    description:
      'Check accounting access coverage, action rights, and segregation-sensitive controls.',
    href: paths.dashboard.accountingFinance.settings.rolePermissions,
    icon: 'solar:shield-user-bold-duotone',
  },
  {
    title: 'Currency & Rates',
    description:
      'Set the active display currency and configure exchange rates for all monetary values in the module.',
    href: paths.dashboard.accountingFinance.settings.currencyRates,
    icon: 'solar:dollar-minimalistic-bold-duotone',
  },
  {
    title: 'Print Template',
    description: 'Design header and footer templates used for printing accounting documents.',
    href: '/dashboard/accounting-finance/settings/print-template',
    icon: 'solar:printer-bold-duotone',
  },
];

function SummaryCard({ label, value, helper, icon, color }) {
  return (
    <Card sx={{ borderRadius: 3, height: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {helper}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color, width: 48, height: 48 }}>
            <Iconify icon={icon} width={24} />
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function SettingsHome() {
  const { data: rawPostingRules } = useGetRequest(EP.settings, { mockKey: 'posting_rules' });
  const { data: rawApprovalRules } = useGetRequest(EP.approval_rules);
  const { data: rawAuditLogs } = useGetRequest(EP.audit_logs);
  const { data: rawIntegrationRules } = useGetRequest(EP.settings, {
    mockKey: 'integration_rules',
  });
  const { data: rawNumberSeries } = useGetRequest(EP.number_sequences);

  const postingRules = Array.isArray(rawPostingRules)
    ? rawPostingRules
    : rawPostingRules?.results || [];
  const approvalRules = Array.isArray(rawApprovalRules)
    ? rawApprovalRules
    : rawApprovalRules?.results || [];
  const auditLogs = Array.isArray(rawAuditLogs) ? rawAuditLogs : rawAuditLogs?.results || [];
  const integrationRules = Array.isArray(rawIntegrationRules)
    ? rawIntegrationRules
    : rawIntegrationRules?.results || [];
  const numberSeries = Array.isArray(rawNumberSeries)
    ? rawNumberSeries
    : rawNumberSeries?.results || [];

  const activePostingRules = postingRules.filter((rule) => rule.active !== false);
  const activeApprovalRules = approvalRules.filter((rule) => rule.active !== false);
  const connectedIntegrations = integrationRules.filter(
    (rule) => rule.connected ?? rule.active ?? false
  );
  const failedIntegrations = integrationRules.filter((rule) => rule.lastTestStatus === 'failed');

  const approvalDepth = useMemo(
    () =>
      approvalRules.reduce((maxDepth, rule) => {
        const levels = Array.isArray(rule.levels) ? rule.levels.length : 0;
        return Math.max(maxDepth, levels);
      }, 0),
    [approvalRules]
  );

  const permissionCoverage = useMemo(() => {
    const modules = new Set();

    approvalRules.forEach((rule) => {
      Object.keys(rule.permissions || {}).forEach((moduleKey) => modules.add(moduleKey));
    });

    return modules.size;
  }, [approvalRules]);

  const recentAuditActivity = useMemo(() => {
    const actionCounts = auditLogs.reduce((accumulator, log) => {
      const key = log.action || 'unknown';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);
  }, [auditLogs]);

  const controlReadiness = useMemo(
    () => [
      {
        id: 'posting',
        title: 'Posting controls',
        status: activePostingRules.length ? 'ready' : 'attention',
        detail: activePostingRules.length
          ? `${activePostingRules.length} active routing rules are available for transaction policy.`
          : 'No active posting rules are available for transaction policy.',
        href: paths.dashboard.accountingFinance.settings.postingRules,
      },
      {
        id: 'approval',
        title: 'Approval routing',
        status: activeApprovalRules.length && approvalDepth >= 2 ? 'ready' : 'watch',
        detail:
          activeApprovalRules.length && approvalDepth >= 2
            ? `${activeApprovalRules.length} active workflows with up to ${approvalDepth} levels.`
            : 'Approval chains exist but still need tighter multi-level coverage in some flows.',
        href: paths.dashboard.accountingFinance.settings.approvalWorkflow,
      },
      {
        id: 'audit',
        title: 'Audit evidence',
        status: auditLogs.length ? 'ready' : 'attention',
        detail: auditLogs.length
          ? `${auditLogs.length} audit events are visible with export-ready evidence controls.`
          : 'Audit evidence is not visible yet in the current review window.',
        href: paths.dashboard.accountingFinance.settings.auditLog,
      },
      {
        id: 'integrations',
        title: 'Automation links',
        status: failedIntegrations.length
          ? 'attention'
          : connectedIntegrations.length
            ? 'ready'
            : 'watch',
        detail: failedIntegrations.length
          ? `${failedIntegrations.length} integration rules need validation follow-up.`
          : `${connectedIntegrations.length} connected integrations support accounting automation.`,
        href: paths.dashboard.accountingFinance.settings.integrationRules,
      },
      {
        id: 'numbering',
        title: 'Document numbering',
        status: numberSeries.length ? 'ready' : 'attention',
        detail: numberSeries.length
          ? `${numberSeries.length} number series are configured for accounting documents.`
          : 'No document numbering policies are configured yet.',
        href: paths.dashboard.accountingFinance.settings.numberSeries,
      },
      {
        id: 'permissions',
        title: 'Access controls',
        status: permissionCoverage ? 'watch' : 'attention',
        detail: permissionCoverage
          ? `${permissionCoverage} modules are represented in control scope and role review.`
          : 'Role coverage has not yet been derived from approval and access patterns.',
        href: paths.dashboard.accountingFinance.settings.rolePermissions,
      },
    ],
    [
      activeApprovalRules.length,
      activePostingRules.length,
      approvalDepth,
      auditLogs.length,
      connectedIntegrations.length,
      failedIntegrations.length,
      numberSeries.length,
      permissionCoverage,
    ]
  );

  const attentionQueue = useMemo(() => {
    const items = [];

    if (failedIntegrations.length) {
      items.push({
        id: 'failed-integrations',
        title: 'Integration validation failures',
        description: `${failedIntegrations.length} automation links need mapping or credential review.`,
        href: paths.dashboard.accountingFinance.settings.integrationRules,
      });
    }

    if (!auditLogs.length) {
      items.push({
        id: 'audit-gap',
        title: 'Audit evidence gap',
        description:
          'No visible audit entries are available for controller review in the current sample.',
        href: paths.dashboard.accountingFinance.settings.auditLog,
      });
    }

    if (!numberSeries.length) {
      items.push({
        id: 'numbering-gap',
        title: 'Numbering policies missing',
        description:
          'Document sequences should be configured before relying on controlled posting flows.',
        href: paths.dashboard.accountingFinance.settings.numberSeries,
      });
    }

    if (approvalDepth < 2) {
      items.push({
        id: 'approval-depth',
        title: 'Approval depth is shallow',
        description: 'Some approval routes still need stronger multi-level escalation coverage.',
        href: paths.dashboard.accountingFinance.settings.approvalWorkflow,
      });
    }

    return items.length
      ? items
      : [
          {
            id: 'steady-controls',
            title: 'Settings controls are in steady state',
            description:
              'Posting, approvals, audit evidence, automation, numbering, and access controls are all represented in the workspace.',
            href: paths.dashboard.accountingFinance.settings.root,
          },
        ];
  }, [approvalDepth, auditLogs.length, failedIntegrations.length, numberSeries.length]);

  const alerts = [];

  if (!auditLogs.length) {
    alerts.push({
      id: 'no-audit-events',
      severity: 'warning',
      title: 'Audit history is empty',
      description:
        'Settings controls are present, but change evidence is not yet visible in the audit workspace.',
    });
  }
  if (failedIntegrations.length) {
    alerts.push({
      id: 'integration-failures',
      severity: 'error',
      title: `${failedIntegrations.length} integration rules have failed validation`,
      description:
        'Review integration mappings and connection ownership before relying on automation handoffs.',
    });
  }
  if (!numberSeries.length) {
    alerts.push({
      id: 'no-number-series',
      severity: 'warning',
      title: 'No number series are configured',
      description:
        'Document sequencing remains fragile until numbering policies are defined for core journals and documents.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'settings-steady',
      severity: 'success',
      title: 'Control framework is seeded for demo operations',
      description:
        'Routing rules, approvals, logs, automation, and access settings now have enough depth to start from a real workspace.',
    });
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Settings Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Governance cockpit for posting logic, approvals, audit evidence, integrations,
            numbering, and access control.
          </Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.settings.postingRules}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:slider-vertical-bold" />}
          >
            Review Policies
          </Button>
          <Button
            component={RouterLink}
            href={paths.dashboard.accountingFinance.settings.auditLog}
            variant="contained"
            startIcon={<Iconify icon="solar:document-text-bold" />}
          >
            Open Audit Trail
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {alerts.map((alert) => (
          <Alert key={alert.id} severity={alert.severity} sx={{ borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              {alert.title}
            </Typography>
            {alert.description}
          </Alert>
        ))}
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Posting controls"
            value={activePostingRules.length}
            helper={`${postingRules.length} total routing rules in policy scope`}
            icon="solar:slider-vertical-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Approval coverage"
            value={activeApprovalRules.length}
            helper={`${approvalDepth} approval levels at max depth`}
            icon="solar:checklist-minimalistic-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Audit events"
            value={auditLogs.length}
            helper="Change history captured across accounting operations"
            icon="solar:document-text-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Automation and access"
            value={`${connectedIntegrations.length}/${permissionCoverage}`}
            helper="Connected integrations versus permission-scoped modules"
            icon="solar:shield-user-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {NAV_ITEMS.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 6, xl: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box
                  sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.200', width: 'fit-content', mb: 2 }}
                >
                  <Iconify icon={item.icon} width={24} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 2 }}>
                  {item.description}
                </Typography>
                <Button component={RouterLink} href={item.href} variant="contained" fullWidth>
                  Open Page
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Control Readiness
              </Typography>
              <Stack spacing={1.5}>
                {controlReadiness.map((item) => (
                  <Stack
                    key={item.id}
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                    sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.title}
                        </Typography>
                        <Chip
                          label={item.status}
                          size="small"
                          color={
                            item.status === 'ready'
                              ? 'success'
                              : item.status === 'watch'
                                ? 'warning'
                                : 'error'
                          }
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {item.detail}
                      </Typography>
                    </Box>
                    <Button
                      component={RouterLink}
                      href={item.href}
                      variant="outlined"
                      color="inherit"
                    >
                      Open
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Attention Queue
              </Typography>
              <Stack spacing={1.5}>
                {attentionQueue.map((item) => (
                  <Box key={item.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                    <Typography variant="body2" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, mb: 1.25 }}>
                      {item.description}
                    </Typography>
                    <Button
                      component={RouterLink}
                      href={item.href}
                      size="small"
                      variant="outlined"
                      color="inherit"
                    >
                      Review
                    </Button>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Recent Audit Activity Mix
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {recentAuditActivity.map((item) => (
                  <Stack
                    key={item.action}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ py: 1.25 }}
                  >
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                      {item.action}
                    </Typography>
                    <Chip label={`${item.count} events`} size="small" variant="outlined" />
                  </Stack>
                ))}
                {!recentAuditActivity.length && (
                  <Typography variant="body2" color="text.secondary">
                    No audit events are currently available in the seeded workspace.
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Control Snapshot
              </Typography>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Connected integrations</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {connectedIntegrations.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Number series</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {numberSeries.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Approval workflows</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {approvalRules.length}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">Permission-scoped modules</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {permissionCoverage}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Operating Notes
              </Typography>
              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  Posting and approval controls now support sandbox-style review and structured
                  routing conditions.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Audit evidence, retention posture, and source-document handoff are available from
                  the audit workspace.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Integrations, numbering, and role controls now behave as mock-safe operating
                  workspaces rather than thin setup tables.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
