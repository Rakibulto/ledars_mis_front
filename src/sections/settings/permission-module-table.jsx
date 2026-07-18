'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import {
  PERMISSION_ACTIONS,
  findPermForAction,
  getPermissionRows,
} from 'src/constants/permission-modules';

// ----------------------------------------------------------------------

function PermissionTableHead() {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Module / Page</TableCell>
        {PERMISSION_ACTIONS.map((action) => (
          <TableCell key={action.key} align="center" sx={{ fontWeight: 700, width: 88 }}>
            {action.label}
          </TableCell>
        ))}
        <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>
          Full Access
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

function PermissionTableRow({ rowLabel, model, modPerms, enabledIds, onToggle, onToggleRow }) {
  const rowPerms = PERMISSION_ACTIONS.map((action) =>
    findPermForAction(modPerms, model, action.key)
  ).filter(Boolean);

  if (!rowPerms.length) return null;

  const enabledCount = rowPerms.filter((p) => enabledIds.has(p.id)).length;
  const allEnabled = enabledCount === rowPerms.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          {rowLabel}
        </Typography>
      </TableCell>

      {PERMISSION_ACTIONS.map((action) => {
        const perm = findPermForAction(modPerms, model, action.key);
        if (!perm) {
          return (
            <TableCell key={action.key} align="center">
              <Box sx={{ color: 'text.disabled', fontSize: 12 }}>—</Box>
            </TableCell>
          );
        }

        return (
          <TableCell key={action.key} align="center" padding="checkbox">
            <Checkbox
              size="small"
              checked={enabledIds.has(perm.id)}
              onChange={() => onToggle(perm.id)}
            />
          </TableCell>
        );
      })}

      <TableCell align="center" padding="checkbox">
        <Checkbox
          size="small"
          checked={allEnabled}
          indeterminate={someEnabled}
          onChange={() => onToggleRow(rowPerms.map((p) => p.id), !allEnabled)}
        />
      </TableCell>
    </TableRow>
  );
}

export function PermissionTable({ rows, modPerms, enabledIds, onToggle, onToggleIds, nested = false }) {
  const groupedRows = useMemo(() => {
    const groups = {};
    rows.forEach((row) => {
      const groupKey = row.group || '__root__';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(row);
    });
    return groups;
  }, [rows]);

  const handleToggleRow = useCallback(
    (permIds, enable) => onToggleIds(permIds, enable),
    [onToggleIds]
  );

  return (
    <Table size="small" sx={{ minWidth: 560 }}>
      <PermissionTableHead />
      <TableBody>
        {Object.entries(groupedRows).flatMap(([groupKey, groupRows]) => {
          const section = [];

          if (nested && groupKey !== '__root__') {
            section.push(
              <TableRow key={`group-${groupKey}`}>
                <TableCell
                  colSpan={PERMISSION_ACTIONS.length + 2}
                  sx={{
                    py: 1,
                    bgcolor: 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {groupKey}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          }

          groupRows.forEach((row) => {
            section.push(
              <PermissionTableRow
                key={row.key}
                rowLabel={row.label}
                model={row.model}
                modPerms={modPerms}
                enabledIds={enabledIds}
                onToggle={onToggle}
                onToggleRow={handleToggleRow}
              />
            );
          });

          return section;
        })}
      </TableBody>
    </Table>
  );
}

function SubmoduleSection({
  submodule,
  modPerms,
  enabledIds,
  onToggle,
  onToggleIds,
  collapsed,
  onCollapseToggle,
  moduleColor,
}) {
  const rows = submodule.pages.map((page) => ({
    key: page.model,
    label: page.name,
    group: null,
    model: page.model,
  }));

  const subPermIds = rows.flatMap((row) =>
    PERMISSION_ACTIONS.map((action) => findPermForAction(modPerms, row.model, action.key))
      .filter(Boolean)
      .map((p) => p.id)
  );

  const enabledCount = subPermIds.filter((id) => enabledIds.has(id)).length;
  const allEnabled = subPermIds.length > 0 && enabledCount === subPermIds.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: alpha(moduleColor, 0.04),
          cursor: 'pointer',
        }}
        onClick={onCollapseToggle}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onCollapseToggle();
            }}
            sx={{
              transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <Iconify icon="solar:alt-arrow-down-bold" width={16} />
          </IconButton>
          <Typography variant="subtitle2" fontWeight={700}>
            {submodule.label}
          </Typography>
          <Chip
            size="small"
            variant="soft"
            label={`${submodule.pages.length} page${submodule.pages.length > 1 ? 's' : ''}`}
            sx={{ height: 22, fontSize: 11 }}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} onClick={(e) => e.stopPropagation()}>
          <Typography variant="caption" color="text.secondary">
            {allEnabled ? 'All enabled' : someEnabled ? 'Partial' : 'None'}
          </Typography>
          <Checkbox
            size="small"
            checked={allEnabled}
            indeterminate={someEnabled}
            onChange={() => onToggleIds(subPermIds, !allEnabled)}
          />
        </Stack>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ px: 1, pb: 1 }}>
          <PermissionTable
            rows={rows}
            modPerms={modPerms}
            enabledIds={enabledIds}
            onToggle={onToggle}
            onToggleIds={onToggleIds}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

function PermissionGroupBadges({ groups, selectedGroupId, moduleColor, onApplyGroup }) {
  if (!groups?.length) {
    return (
      <Typography variant="caption" color="text.secondary">
        No permission groups for this module yet.
      </Typography>
    );
  }

  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {groups.map((group) => {
        const isSelected = selectedGroupId === group.id;
        return (
          <Chip
            key={group.id}
            label={group.name}
            clickable
            onClick={() => onApplyGroup(group)}
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            sx={{
              borderColor: isSelected ? 'primary.main' : alpha(moduleColor, 0.35),
              fontWeight: isSelected ? 700 : 500,
            }}
          />
        );
      })}
    </Stack>
  );
}

export function ModulePermissionCard({
  mod,
  modPerms,
  enabledIds,
  onToggle,
  onToggleIds,
  onToggleAll,
  collapsed,
  onCollapseToggle,
  collapsedSubmodules,
  onSubmoduleCollapseToggle,
  permissionGroups = [],
  selectedGroupId = null,
  onApplyGroup,
}) {
  const hasSubmodules = Boolean(mod.submodules?.length);
  const rows = getPermissionRows(mod, modPerms);

  const allPermIds = modPerms.map((p) => p.id);
  const enabledCount = allPermIds.filter((id) => enabledIds.has(id)).length;
  const allEnabled = allPermIds.length > 0 && enabledCount === allPermIds.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2.5,
          py: 1.75,
          bgcolor: mod.bg,
          borderBottom: collapsed ? 'none' : '1px solid',
          borderColor: alpha(mod.color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: hasSubmodules ? 'pointer' : 'default',
        }}
        onClick={hasSubmodules ? onCollapseToggle : undefined}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {hasSubmodules && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCollapseToggle();
              }}
              sx={{
                color: mod.color,
                transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <Iconify icon="solar:alt-arrow-down-bold" width={16} />
            </IconButton>
          )}

          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: alpha(mod.color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon={mod.icon} width={20} sx={{ color: mod.color }} />
          </Box>

          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: mod.color }}>
              {mod.label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {hasSubmodules
                ? `${mod.submodules.length} submodules · ${rows.length} pages`
                : `${modPerms.length} permissions`}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1} onClick={(e) => e.stopPropagation()}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {allEnabled ? 'All enabled' : someEnabled ? 'Partial' : 'None enabled'}
          </Typography>
          <Checkbox
            size="small"
            checked={allEnabled}
            indeterminate={someEnabled}
            onChange={() => onToggleAll(mod.key, !allEnabled)}
          />
          <Typography variant="caption" fontWeight={600}>
            Full Access
          </Typography>
        </Stack>
      </Box>

      <Collapse in={!collapsed || !hasSubmodules} timeout={200}>
        <Box sx={{ p: 2 }}>
          {onApplyGroup && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: 1.5,
                border: '1px dashed',
                borderColor: alpha(mod.color, 0.25),
                bgcolor: alpha(mod.color, 0.03),
              }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Permission Groups
              </Typography>
              <PermissionGroupBadges
                groups={permissionGroups}
                selectedGroupId={selectedGroupId}
                moduleColor={mod.color}
                onApplyGroup={onApplyGroup}
              />
            </Box>
          )}

          {hasSubmodules ? (
            mod.submodules.map((sub) => {
              const subKey = `${mod.key}:${sub.label}`;
              return (
                <SubmoduleSection
                  key={subKey}
                  submodule={sub}
                  modPerms={modPerms}
                  enabledIds={enabledIds}
                  onToggle={onToggle}
                  onToggleIds={onToggleIds}
                  collapsed={collapsedSubmodules.has(subKey)}
                  onCollapseToggle={() => onSubmoduleCollapseToggle(subKey)}
                  moduleColor={mod.color}
                />
              );
            })
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <PermissionTable
                rows={rows}
                modPerms={modPerms}
                enabledIds={enabledIds}
                onToggle={onToggle}
                onToggleIds={onToggleIds}
              />
            </Box>
          )}
        </Box>
      </Collapse>
    </Card>
  );
}

export function ModulePermissionEditor({
  mod,
  modPerms,
  enabledIds,
  onToggle,
  onToggleIds,
  onToggleAll,
  collapsedSubmodules,
  onSubmoduleCollapseToggle,
}) {
  const hasSubmodules = Boolean(mod.submodules?.length);
  const rows = getPermissionRows(mod, modPerms);
  const allPermIds = modPerms.map((p) => p.id);
  const enabledCount = allPermIds.filter((id) => enabledIds.has(id)).length;
  const allEnabled = allPermIds.length > 0 && enabledCount === allPermIds.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1} sx={{ mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          {allEnabled ? 'All enabled' : someEnabled ? 'Partial' : 'None enabled'}
        </Typography>
        <Checkbox
          size="small"
          checked={allEnabled}
          indeterminate={someEnabled}
          onChange={() => onToggleAll(mod.key, !allEnabled)}
        />
        <Typography variant="caption" fontWeight={600}>
          Full Access
        </Typography>
      </Stack>

      {hasSubmodules ? (
        mod.submodules.map((sub) => {
          const subKey = `${mod.key}:${sub.label}`;
          return (
            <SubmoduleSection
              key={subKey}
              submodule={sub}
              modPerms={modPerms}
              enabledIds={enabledIds}
              onToggle={onToggle}
              onToggleIds={onToggleIds}
              collapsed={collapsedSubmodules.has(subKey)}
              onCollapseToggle={() => onSubmoduleCollapseToggle(subKey)}
              moduleColor={mod.color}
            />
          );
        })
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <PermissionTable
            rows={rows}
            modPerms={modPerms}
            enabledIds={enabledIds}
            onToggle={onToggle}
            onToggleIds={onToggleIds}
          />
        </Box>
      )}
    </Box>
  );
}

export function AllModulesPermissionEditor({
  modules,
  modulePermissions,
  enabledIds,
  onToggle,
  onToggleIds,
  onToggleAll,
  collapsedModules,
  onCollapseToggle,
  collapsedSubmodules,
  onSubmoduleCollapseToggle,
}) {
  return (
    <Stack spacing={2}>
      {modules.map((mod) => (
        <ModulePermissionCard
          key={mod.key}
          mod={mod}
          modPerms={modulePermissions[mod.key] || []}
          enabledIds={enabledIds}
          onToggle={onToggle}
          onToggleIds={onToggleIds}
          onToggleAll={onToggleAll}
          collapsed={collapsedModules.has(mod.key)}
          onCollapseToggle={() => onCollapseToggle(mod.key)}
          collapsedSubmodules={collapsedSubmodules}
          onSubmoduleCollapseToggle={onSubmoduleCollapseToggle}
        />
      ))}
    </Stack>
  );
}

function ModulesPermissionTableHead() {
  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 700, minWidth: 240 }}>Module</TableCell>
        {PERMISSION_ACTIONS.map((action) => (
          <TableCell key={action.key} align="center" sx={{ fontWeight: 700, width: 88 }}>
            {action.label}
          </TableCell>
        ))}
        <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>
          Full Access
        </TableCell>
      </TableRow>
    </TableHead>
  );
}

function ModulesPermissionTableRow({ mod, modPerms, enabledIds, onToggleIds }) {
  const allPermIds = modPerms.map((p) => p.id);
  const enabledCount = allPermIds.filter((id) => enabledIds.has(id)).length;
  const allEnabled = allPermIds.length > 0 && enabledCount === allPermIds.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              bgcolor: alpha(mod.color, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon={mod.icon} width={18} sx={{ color: mod.color }} />
          </Box>
          <Typography variant="body2" fontWeight={600}>
            {mod.label}
          </Typography>
        </Stack>
      </TableCell>

      {PERMISSION_ACTIONS.map((action) => {
        const actionPerms = modPerms.filter((p) => p.codename.startsWith(`${action.key}_`));
        if (!actionPerms.length) {
          return (
            <TableCell key={action.key} align="center">
              <Box sx={{ color: 'text.disabled', fontSize: 12 }}>—</Box>
            </TableCell>
          );
        }

        const actionEnabledCount = actionPerms.filter((p) => enabledIds.has(p.id)).length;
        const actionAllEnabled = actionEnabledCount === actionPerms.length;
        const actionSomeEnabled = actionEnabledCount > 0 && !actionAllEnabled;

        return (
          <TableCell key={action.key} align="center" padding="checkbox">
            <Checkbox
              size="small"
              checked={actionAllEnabled}
              indeterminate={actionSomeEnabled}
              onChange={() =>
                onToggleIds(
                  actionPerms.map((p) => p.id),
                  !actionAllEnabled
                )
              }
            />
          </TableCell>
        );
      })}

      <TableCell align="center" padding="checkbox">
        <Checkbox
          size="small"
          checked={allEnabled}
          indeterminate={someEnabled}
          onChange={() => onToggleIds(allPermIds, !allEnabled)}
        />
      </TableCell>
    </TableRow>
  );
}

export function ModulesPermissionTable({ modules, modulePermissions, enabledIds, onToggleIds }) {
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 640 }}>
        <ModulesPermissionTableHead />
        <TableBody>
          {modules.map((mod) => {
            const modPerms = modulePermissions[mod.key] || [];
            if (!modPerms.length) return null;

            return (
              <ModulesPermissionTableRow
                key={mod.key}
                mod={mod}
                modPerms={modPerms}
                enabledIds={enabledIds}
                onToggleIds={onToggleIds}
              />
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
