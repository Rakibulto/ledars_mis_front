import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';

import axios, { endpoints } from 'src/utils/axios';
import { fDate, formatTo12Hour } from 'src/utils/format-time';

import { updateUserRole } from 'src/actions/employees';
import { updateUserPermissions } from 'src/actions/permissions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { employeeCodenames, supervisorCodenames } from './utils/user-utils';

// ----------------------------------------------------------------------

export function UserTableRow({
  row,
  selected,
  onEditRow,
  onUpdateRole,
  isAdmin = false,
  roles = [],
  isSelf = false,
  currentUser,
}) {
  // Find the role id from the role name for initial value
  const getRoleIdFromName = (roleName) => {
    const found = roles.find((r) => r.name === roleName);
    return found ? found.id : '';
  };

  const hasChangeEmployeePermission = currentUser?.user_permissions_list?.some(
    (p) => p.codename === 'change_employee'
  );

  // Compute selectedRole from row and roles
  const selectedRole = getRoleIdFromName(row?.user?.role);

  const handleRoleChange = async (event) => {
    const newRoleId = event.target.value;

    // If parent provided an onUpdateRole handler (used to show confirm dialog),
    // delegate the change to parent.
    if (onUpdateRole) {
      onUpdateRole(row?.user?.id, newRoleId);
      return;
    }

    // Fallback: if no parent handler, perform update and permission sync here.
    const roleObj = roles.find((r) => r.id === newRoleId);
    try {
      // Update user role
      await updateUserRole(row?.user?.id, newRoleId, roles);

      // Fetch all permissions and set role-based permissions
      const allPermissionsRes = await axios.get(endpoints.permission.list);
      const allPermissions = allPermissionsRes.data || [];

      let requiredPermissionIds = [];
      if (roleObj?.name === 'Admin') {
        requiredPermissionIds = allPermissions.map((p) => p.id);
      } else if (roleObj?.name === 'Supervisor') {
        requiredPermissionIds = allPermissions
          .filter((p) => supervisorCodenames.includes(p.codename))
          .map((p) => p.id);
      } else if (roleObj?.name === 'Employee') {
        requiredPermissionIds = allPermissions
          .filter((p) => employeeCodenames.includes(p.codename))
          .map((p) => p.id);
      }

      await updateUserPermissions(row?.user?.id, requiredPermissionIds);
    } catch (error) {
      console.error('Failed to update role or permissions', error);
    }
  };

  return (
    <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
      <TableCell />

      <TableCell>
        <Stack spacing={2} direction="row" alignItems="center">
          <Avatar
            alt={row?.employee_name || row?.user?.username || 'U'}
            src={row?.profile_picture}
          />

          <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
            <Link color="inherit" onClick={onEditRow} sx={{ cursor: 'pointer' }}>
              {row?.employee_name || row?.user?.username || '-'}
            </Link>
            {row?.employee_id && (
              <Label
                variant="soft"
                color="blue"
                sx={{
                  typography: 'caption',
                  fontWeight: 600,
                  borderRadius: '4px',
                  px: 1,
                  fontSize: '14px',
                }}
              >
                <Link color="inherit" onClick={onEditRow} sx={{ cursor: 'pointer' }}>
                  ID: {row?.employee_id}
                </Link>
              </Label>
            )}
            {(row?.personal_email_id || row?.user?.email) && (
              <Box component="span" sx={{ color: 'text.disabled' }}>
                <Link color="inherit" onClick={onEditRow} sx={{ cursor: 'pointer' }}>
                  {row?.personal_email_id || row?.user?.email || '-'}{' '}
                  {(row?.official_mobile_number || row?.personal_mobile_number) && (
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      • {row?.official_mobile_number || row?.personal_mobile_number || '-'}
                    </Box>
                  )}
                </Link>
              </Box>
            )}
          </Stack>
        </Stack>
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {row?.office_time ? (
          <Stack spacing={0.5}>
            <Label color="info" variant="soft">
              {row.office_time.name}
            </Label>
            <Box sx={{ color: 'text.secondary', typography: 'caption', textAlign: 'center' }}>
              {row.office_time.office_start_time && row.office_time.office_end_time
                ? `${formatTo12Hour(row.office_time.office_start_time)} - ${formatTo12Hour(
                    row.office_time.office_end_time
                  )}`
                : '-'}
            </Box>
          </Stack>
        ) : (
          '-'
        )}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <ListItemText
          primary={row?.department?.name || '-'}
          secondary={row?.designation?.name || ''}
        />
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {row?.joining_date ? fDate(row.joining_date) : '-'}

        {' / '}

        {row?.confirmation_date ? fDate(row?.confirmation_date) : '-'}
      </TableCell>

      {/* Role dropdown - only visible to admin users */}
      {isAdmin && (
        <TableCell>
          <FormControl fullWidth size="small">
            <Select
              value={selectedRole}
              onChange={handleRoleChange}
              displayEmpty
              sx={{ minWidth: 120 }}
              disabled={isSelf} // Disable if editing self
            >
              <MenuItem value="" disabled>
                Select Role
              </MenuItem>
              {roles?.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
      )}

      <TableCell>
        <Label
          variant="soft"
          color={
            (row?.status === 'active' && 'success') ||
            (row?.status === 'incomplete' && 'warning') ||
            (row?.status === 'terminated' && 'error') ||
            (row?.status === 'resigned' && 'orange') ||
            (row?.status === 'inactive' && 'info') ||
            'default'
          }
        >
          {row?.status}
        </Label>
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
          {hasChangeEmployeePermission ? (
            <IconButton>
              <Iconify
                icon="solar:pen-bold"
                onClick={() => {
                  onEditRow();
                }}
              />
            </IconButton>
          ) : null}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
