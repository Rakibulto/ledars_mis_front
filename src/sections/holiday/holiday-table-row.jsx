import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { calculateDays } from './utils/holiday-utils';
import { HolidayQuickEditForm } from './holiday-quick-edit-form';

// ----------------------------------------------------------------------

export function HolidayTableRow({ row, selected, onSelectRow, onDeleteRow, canChange, canDelete }) {
  const quickEdit = useBoolean();
  const confirmDelete = useBoolean();

  const handleDelete = () => {
    onDeleteRow(row.id);
    confirmDelete.onFalse();
  };

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        {canDelete && (
          <TableCell padding="checkbox">
            <Checkbox id={row?.id} checked={selected} onClick={onSelectRow} />
          </TableCell>
        )}

        <TableCell>{row?.name}</TableCell>
        <TableCell>{fDate(row?.from_date)}</TableCell>
        <TableCell>{fDate(row?.to_date)}</TableCell>
        <TableCell>{calculateDays(row?.from_date, row?.to_date)}</TableCell>
        <TableCell>{row?.description || 'No remarks'}</TableCell>

        <TableCell>
          <Stack
            direction="column"
            spacing={0.5}
            alignItems="flex-start"
            sx={{
              minWidth: 180,
              py: 1,
              px: 0.5,
              bgcolor: 'background.neutral',
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            {row?.is_global && (
              <Label
                variant="soft"
                color="primary"
                startIcon={<Iconify icon="solar:earth-bold" width={16} />}
              >
                Global Holiday
              </Label>
            )}

            {!row?.is_global && (
              <>
                {!row?.employment_types && (
                  <Label
                    variant="soft"
                    color="info"
                    startIcon={<Iconify icon="clarity:employee-group-solid" width={14} />}
                  >
                    All Employment Types
                  </Label>
                )}
                {row?.employment_type_name && typeof row.employment_type_name === 'string' && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                    <Label
                      variant="soft"
                      color="info"
                      startIcon={<Iconify icon="clarity:employee-group-solid" width={14} />}
                    >
                      Employment Type:
                    </Label>
                    <Label variant="soft" color="info">
                      {row.employment_type_name.charAt(0).toUpperCase() +
                        row.employment_type_name.slice(1).replace('_', ' ')}
                    </Label>
                  </Stack>
                )}
                {row?.branches_data?.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                    <Label
                      variant="soft"
                      color="blue"
                      startIcon={<Iconify icon="solar:buildings-3-bold" width={14} />}
                    >
                      Branches:
                    </Label>
                    {row?.branches_data?.map((branch) => (
                      <Label key={branch?.name} variant="soft" color="blue">
                        {branch?.name}
                      </Label>
                    ))}
                  </Stack>
                )}
                {row?.departments_data?.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                    <Label
                      variant="soft"
                      color="secondary"
                      sx={{ fontWeight: 500, fontSize: 12, mr: 0.5 }}
                      startIcon={<Iconify icon="ic:round-home-work" width={14} />}
                    >
                      Departments:
                    </Label>
                    {row?.departments_data?.map((department) => (
                      <Label key={department?.name} variant="soft" color="secondary">
                        {department?.name}
                      </Label>
                    ))}
                  </Stack>
                )}
                {row?.designations_data?.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                    <Label
                      variant="soft"
                      color="warning"
                      startIcon={<Iconify icon="ic:round-work" width={14} />}
                    >
                      Designations:
                    </Label>
                    {row?.designations_data?.map((designation) => (
                      <Label key={designation?.name} variant="soft" color="warning">
                        {designation?.name}
                      </Label>
                    ))}
                  </Stack>
                )}
                {row?.assigned_employees_data?.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                    <Label
                      variant="soft"
                      color="success"
                      startIcon={<Iconify icon="streamline:office-worker-remix" width={14} />}
                    >
                      Included Users:
                    </Label>
                    {row?.assigned_employees_data?.map((user) => (
                      <Label key={user?.id} variant="soft" color="success">
                        {user?.employee_name || user?.name || `ID: ${user?.id}`}
                      </Label>
                    ))}
                  </Stack>
                )}
                {row?.excluded_employees_data?.length > 0 && (
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" alignItems="center">
                    <Label
                      variant="soft"
                      color="error"
                      startIcon={<Iconify icon="solar:user-bold" width={14} />}
                    >
                      Excluded Users:
                    </Label>
                    {row?.excluded_employees_data?.map((user) => (
                      <Label key={user?.id} variant="soft" color="error">
                        {user?.employee_name || user?.name || `ID: ${user?.id}`}
                      </Label>
                    ))}
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {canChange && (
              <Tooltip title="Quick Edit" placement="top" arrow>
                <IconButton
                  onClick={quickEdit.onTrue}
                  color={quickEdit.value ? 'inherit' : 'default'}
                >
                  <Iconify icon="solar:pen-bold" />
                </IconButton>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip title="Delete" placement="top" arrow>
                <IconButton
                  onClick={confirmDelete.onTrue}
                  color={quickEdit.value ? 'inherit' : 'default'}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </TableCell>
      </TableRow>

      {canChange && (
        <HolidayQuickEditForm
          currentHoliday={row}
          open={quickEdit.value}
          onClose={quickEdit.onFalse}
          addEntry={false}
          onUpdateSuccess={quickEdit.onFalse}
        />
      )}

      {canDelete && (
        <ConfirmDialog
          open={confirmDelete.value}
          onClose={confirmDelete.onFalse}
          title="Delete"
          content="Are you sure you want to delete this holiday"
          action={
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
          }
        />
      )}
    </>
  );
}
