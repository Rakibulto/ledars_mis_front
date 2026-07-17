'use client';

import { toast } from 'sonner';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.accounting;

const PERM_LABELS = {
  v: 'View',
  c: 'Create',
  e: 'Edit',
  d: 'Delete',
  a: 'Approve',
};

const ROLE_BLUEPRINTS = {
  'AP Manager': {
    color: '#2563eb',
    users: 3,
    permissions: {
      payables: ['v', 'c', 'e', 'a'],
      banking: ['v'],
      reports: ['v'],
      configuration: ['v'],
    },
    fieldRestrictions: ['Cannot alter supplier bank details', 'Cannot reopen posted periods'],
    actionRestrictions: ['Cannot release payments above controller threshold'],
    sodFlags: ['Approval allowed, but payment posting remains segregated'],
  },
  Controller: {
    color: '#7c3aed',
    users: 2,
    permissions: {
      reports: ['v', 'a'],
      configuration: ['v', 'e', 'a'],
      transactions: ['v', 'a'],
      year_end: ['v', 'a'],
    },
    fieldRestrictions: ['Cannot edit source documents after approval'],
    actionRestrictions: ['Delete rights remain disabled across operational modules'],
    sodFlags: ['Has broad approval coverage and should be excluded from day-to-day entry work'],
  },
  'Finance Manager': {
    color: '#059669',
    users: 2,
    permissions: {
      transactions: ['v', 'c', 'e', 'a'],
      reports: ['v'],
      settings: ['v', 'e'],
      year_end: ['v'],
    },
    fieldRestrictions: ['Cannot change audit log retention settings'],
    actionRestrictions: ['Cannot disable numbering policies without controller review'],
    sodFlags: [
      'Can draft and approve journals, so secondary review is still required for manual postings',
    ],
  },
  'AR Lead': {
    color: '#d97706',
    users: 4,
    permissions: {
      receivables: ['v', 'c', 'e', 'a'],
      reports: ['v'],
      banking: ['v'],
    },
    fieldRestrictions: ['Cannot change customer credit limits in accounting settings'],
    actionRestrictions: ['Cannot write off balances above approval threshold'],
    sodFlags: ['Receivable approval is separated from bank reconciliation posting'],
  },
  'Treasury Officer': {
    color: '#0f766e',
    users: 3,
    permissions: {
      banking: ['v', 'c', 'e'],
      payables: ['v'],
      reports: ['v'],
    },
    fieldRestrictions: ['Cannot approve own transfer batches'],
    actionRestrictions: ['Delete is blocked for posted bank movements'],
    sodFlags: ['Execution rights exist without payment approval rights'],
  },
};

function toTitleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function createGenericProfile(roleName, index, moduleHints) {
  const permissions = moduleHints.reduce((accumulator, moduleName) => {
    accumulator[moduleName] = ['v'];
    return accumulator;
  }, {});

  return {
    id: `role-${index + 1}`,
    name: roleName,
    color: '#475569',
    users: 1,
    permissions,
    fieldRestrictions: [
      'Sensitive configuration fields remain restricted pending formal role design',
    ],
    actionRestrictions: ['Approve and delete privileges are disabled by default'],
    sodFlags: ['This role still needs a formal segregation review'],
  };
}

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
          <Box sx={{ color }}>
            <Iconify icon={icon} width={28} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function RolePermissions() {
  const { data: rawRules } = useGetRequest(EP.approval_rules);
  const rulesData = Array.isArray(rawRules) ? rawRules : rawRules?.results || [];

  const initialProfiles = useMemo(() => {
    const moduleHints = Array.from(
      new Set(
        rulesData
          .map((rule) =>
            String(rule.module || '')
              .toLowerCase()
              .replace(/\s+/g, '_')
          )
          .filter(Boolean)
      )
    );

    const roleNames = Array.from(
      new Set(
        rulesData.flatMap((rule) => {
          const approverNames = Array.isArray(rule.approvers) ? rule.approvers : [];
          const levelNames = Array.isArray(rule.levels)
            ? rule.levels.map((level) => (typeof level === 'string' ? level : level.role))
            : [];
          return [...approverNames, ...levelNames].filter(Boolean);
        })
      )
    );

    const fallbackRoles = roleNames.length
      ? roleNames
      : ['Finance Manager', 'AP Manager', 'AR Lead', 'Controller', 'Treasury Officer'];

    return fallbackRoles.map((roleName, index) => {
      const blueprint = ROLE_BLUEPRINTS[roleName];

      if (blueprint) {
        return {
          id: `role-${index + 1}`,
          name: roleName,
          ...blueprint,
        };
      }

      return createGenericProfile(roleName, index, moduleHints);
    });
  }, [rulesData]);

  const [profiles, setProfiles] = useState(initialProfiles);
  const [selectedRoleId, setSelectedRoleId] = useState(initialProfiles[0]?.id || null);
  const [fieldRestrictionDraft, setFieldRestrictionDraft] = useState('');
  const [actionRestrictionDraft, setActionRestrictionDraft] = useState('');
  const [sodDraft, setSodDraft] = useState('');
  const initialProfilesSignature = useMemo(
    () => JSON.stringify(initialProfiles),
    [initialProfiles]
  );
  const lastProfilesSignatureRef = useRef('');

  useEffect(() => {
    if (!initialProfiles.length) return;
    if (lastProfilesSignatureRef.current === initialProfilesSignature) return;

    lastProfilesSignatureRef.current = initialProfilesSignature;
    setProfiles(initialProfiles);
    setSelectedRoleId((current) => {
      if (initialProfiles.some((profile) => profile.id === current)) {
        return current;
      }

      return initialProfiles[0]?.id ?? current ?? null;
    });
  }, [initialProfiles, initialProfilesSignature]);

  const activeProfile =
    profiles.find((profile) => profile.id === selectedRoleId) || profiles[0] || null;

  const modules = useMemo(
    () =>
      Array.from(
        new Set(profiles.flatMap((profile) => Object.keys(profile.permissions || {})))
      ).sort(),
    [profiles]
  );

  const approverRoles = profiles.filter((profile) =>
    Object.values(profile.permissions || {}).some((permissions) => permissions.includes('a'))
  ).length;
  const restrictedFields = profiles.reduce(
    (count, profile) => count + profile.fieldRestrictions.length,
    0
  );
  const sodFlags = profiles.reduce((count, profile) => count + profile.sodFlags.length, 0);
  const activeConflicts = useMemo(() => {
    if (!activeProfile) return [];

    return Object.entries(activeProfile.permissions || {})
      .filter(([, permissions]) => permissions.includes('c') && permissions.includes('a'))
      .map(([moduleName]) => `${toTitleCase(moduleName)} has both create and approve access`);
  }, [activeProfile]);

  const alerts = [];
  if (approverRoles > Math.max(1, Math.floor(profiles.length / 2))) {
    alerts.push({
      id: 'approval-density',
      severity: 'warning',
      title: 'Approval rights are broadly distributed',
      description:
        'Consider narrowing approve privileges so entry, payment execution, and approval remain properly segregated.',
    });
  }
  if (sodFlags) {
    alerts.push({
      id: 'sod-flags',
      severity: 'info',
      title: `${sodFlags} segregation notes are flagged`,
      description:
        'Review the role-level warnings before expanding create or approve access to additional modules.',
    });
  }
  if (!alerts.length) {
    alerts.push({
      id: 'access-steady',
      severity: 'success',
      title: 'Access control coverage is seeded',
      description:
        'The mock role matrix now includes module rights, restricted fields, and segregation review context.',
    });
  }

  const togglePermission = (moduleName, permissionKey) => {
    if (!activeProfile) return;

    setProfiles((current) =>
      current.map((profile) => {
        if (profile.id !== activeProfile.id) return profile;

        const existingPermissions = profile.permissions[moduleName] || [];
        const hasPermission = existingPermissions.includes(permissionKey);
        const nextPermissions = hasPermission
          ? existingPermissions.filter((item) => item !== permissionKey)
          : [...existingPermissions, permissionKey];

        return {
          ...profile,
          permissions: {
            ...profile.permissions,
            [moduleName]: nextPermissions,
          },
        };
      })
    );

    toast.success('Role matrix updated in local workspace');
  };

  const applyControllerTemplate = () => {
    if (!activeProfile) return;

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === activeProfile.id
          ? {
              ...profile,
              permissions: {
                reports: ['v', 'a'],
                configuration: ['v', 'e', 'a'],
                transactions: ['v', 'a'],
                year_end: ['v', 'a'],
              },
              fieldRestrictions: ['Cannot edit source documents after approval'],
              actionRestrictions: ['Delete rights remain disabled across operational modules'],
              sodFlags: [
                'Template applied: keep this role outside routine entry and payment execution',
              ],
            }
          : profile
      )
    );

    toast.success('Controller-style template applied locally');
  };

  const appendGovernanceNote = (field, value, reset) => {
    if (!activeProfile || !value.trim()) return;

    setProfiles((current) =>
      current.map((profile) =>
        profile.id === activeProfile.id
          ? {
              ...profile,
              [field]: [...profile[field], value.trim()],
            }
          : profile
      )
    );

    reset('');
    toast.success('Role governance note added');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Role Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review module access, field restrictions, approval reach, and segregation-of-duties
            pressure across accounting roles.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:shield-check-bold" />}
          onClick={applyControllerTemplate}
          disabled={!activeProfile}
        >
          Apply Controller Template
        </Button>
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
            label="Roles in scope"
            value={profiles.length}
            helper="Seeded accounting roles with local-first access design"
            icon="solar:users-group-two-rounded-bold-duotone"
            color="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Approver roles"
            value={approverRoles}
            helper="Roles holding at least one approve permission"
            icon="solar:checklist-minimalistic-bold-duotone"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Restricted fields"
            value={restrictedFields}
            helper="Field-level controls documented across active profiles"
            icon="solar:lock-keyhole-bold-duotone"
            color="#d97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <SummaryCard
            label="Segregation flags"
            value={sodFlags}
            helper="Warnings requiring control review before access expansion"
            icon="solar:shield-warning-bold-duotone"
            color="#7c3aed"
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {profiles.map((profile) => (
          <Chip
            key={profile.id}
            avatar={
              <Avatar sx={{ bgcolor: `${profile.color}20`, color: profile.color }}>
                {profile.name.charAt(0)}
              </Avatar>
            }
            label={`${profile.name} (${profile.users})`}
            onClick={() => setSelectedRoleId(profile.id)}
            variant={activeProfile?.id === profile.id ? 'filled' : 'outlined'}
            sx={{
              bgcolor: activeProfile?.id === profile.id ? `${profile.color}20` : 'transparent',
              color: activeProfile?.id === profile.id ? profile.color : 'text.primary',
              borderColor: profile.color,
              fontWeight: 600,
            }}
          />
        ))}
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                Permissions for: {activeProfile?.name || 'No role selected'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Toggle access locally to test how tighter or broader control models would look
                before wiring persistence.
              </Typography>
            </CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Module</TableCell>
                    {Object.entries(PERM_LABELS).map(([key, label]) => (
                      <TableCell key={key} align="center">
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modules.map((moduleName) => {
                    const activePermissions = activeProfile?.permissions[moduleName] || [];

                    return (
                      <TableRow key={moduleName} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {toTitleCase(moduleName)}
                          </Typography>
                        </TableCell>
                        {Object.keys(PERM_LABELS).map((permissionKey) => (
                          <TableCell key={permissionKey} align="center">
                            <Checkbox
                              size="small"
                              checked={activePermissions.includes(permissionKey)}
                              onChange={() => togglePermission(moduleName, permissionKey)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Role Review
              </Typography>
              {activeProfile ? (
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{ bgcolor: `${activeProfile.color}20`, color: activeProfile.color }}
                    >
                      {activeProfile.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {activeProfile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activeProfile.users} assigned users
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.keys(activeProfile.permissions).map((moduleName) => (
                      <Chip
                        key={moduleName}
                        label={toTitleCase(moduleName)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Stack>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a role to inspect its module scope and control notes.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Field Restrictions
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Add field restriction"
                  value={fieldRestrictionDraft}
                  onChange={(event) => setFieldRestrictionDraft(event.target.value)}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() =>
                    appendGovernanceNote(
                      'fieldRestrictions',
                      fieldRestrictionDraft,
                      setFieldRestrictionDraft
                    )
                  }
                >
                  Add
                </Button>
              </Stack>
              <Stack spacing={1.25}>
                {(activeProfile?.fieldRestrictions || []).map((item) => (
                  <Typography key={item} variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Action Restrictions
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Add action restriction"
                  value={actionRestrictionDraft}
                  onChange={(event) => setActionRestrictionDraft(event.target.value)}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() =>
                    appendGovernanceNote(
                      'actionRestrictions',
                      actionRestrictionDraft,
                      setActionRestrictionDraft
                    )
                  }
                >
                  Add
                </Button>
              </Stack>
              <Stack spacing={1.25}>
                {(activeProfile?.actionRestrictions || []).map((item) => (
                  <Typography key={item} variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Segregation Check
              </Typography>
              <Stack spacing={1.25}>
                {activeConflicts.length ? (
                  activeConflicts.map((item) => (
                    <Alert key={item} severity="warning" sx={{ borderRadius: 2 }}>
                      {item}
                    </Alert>
                  ))
                ) : (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    No create-and-approve conflicts are visible for the selected role.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Segregation Notes
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Add segregation note"
                  value={sodDraft}
                  onChange={(event) => setSodDraft(event.target.value)}
                />
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => appendGovernanceNote('sodFlags', sodDraft, setSodDraft)}
                >
                  Add
                </Button>
              </Stack>
              <Stack spacing={1.25}>
                {(activeProfile?.sodFlags || []).map((item) => (
                  <Typography key={item} variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default RolePermissions;
