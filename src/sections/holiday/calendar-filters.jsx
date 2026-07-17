import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { orderBy } from 'src/utils/helper';
import { fDate, fDateTime } from 'src/utils/format-time';

import { useGetLeaveGroups } from 'src/actions/settings';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function CalendarFilters({
  open,
  events,
  onClose,
  filters,
  canReset,
  dateError,
  // colorOptions,
  onClickEvent,
  branchOptions = [],
  departmentOptions = [],
  designationOptions = [],
  employeeOptions = [],
  leaveTypes = [],
  employees = [],
  leave,
}) {
  const { leaveGroups } = useGetLeaveGroups(open);

  const handleFilterStartDate = useCallback(
    (newValue) => {
      filters.setState({ startDate: newValue });
    },
    [filters]
  );

  const handleFilterEndDate = useCallback(
    (newValue) => {
      filters.setState({ endDate: newValue });
    },
    [filters]
  );

  // Add handlers for new filters
  const handleFilterEmploymentType = useCallback(
    (newValue) => filters.setState({ employment_types: newValue }),
    [filters]
  );
  const handleFilterBranches = useCallback(
    (newValue) => filters.setState({ branches: newValue }),
    [filters]
  );
  const handleFilterDepartments = useCallback(
    (newValue) => filters.setState({ departments: newValue }),
    [filters]
  );
  const handleFilterDesignations = useCallback(
    (newValue) => filters.setState({ designations: newValue }),
    [filters]
  );
  const handleFilterAssignedEmployees = useCallback(
    (newValue) => filters.setState({ assigned_employees: newValue }),
    [filters]
  );
  const handleFilterExcludedEmployees = useCallback(
    (newValue) => filters.setState({ excluded_employees: newValue }),
    [filters]
  );
  const handleFilterIsGlobal = useCallback(
    (newValue) => filters.setState({ is_global: newValue }),
    [filters]
  );

  const renderHead = (
    <>
      <Box display="flex" alignItems="center" sx={{ py: 2, pr: 1, pl: 2.5 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Filters
        </Typography>

        <Tooltip title="Reset">
          <IconButton onClick={filters.onResetState}>
            <Badge color="error" variant="dot" invisible={!canReset}>
              <Iconify icon="solar:restart-bold" />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </>
  );

  const renderDateRange = (
    <Box display="flex" flexDirection="column" sx={{ mb: 3, px: 2.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Range
      </Typography>

      <DatePicker
        openTo="day"
        format="DD/MM/YYYY"
        label="Start date"
        value={filters.state.startDate}
        onChange={handleFilterStartDate}
        sx={{ mb: 2.5 }}
      />

      <DatePicker
        openTo="day"
        format="DD/MM/YYYY"
        label="End date"
        value={filters.state.endDate}
        onChange={handleFilterEndDate}
        slotProps={{
          textField: {
            error: dateError,
            helperText: dateError ? 'End date must be later than start date' : null,
          },
        }}
      />
    </Box>
  );

  const renderEvents = (
    <>
      <Typography variant="subtitle2" sx={{ px: 2.5, mb: 1 }}>
        Events ({events.length})
      </Typography>

      <Box component="ul">
        {orderBy(events, ['end'], ['desc']).map((event) => (
          <Box component="li" key={event.id}>
            <ListItemButton
              onClick={() => onClickEvent(`${event.id}`)}
              sx={{
                py: 1.5,
                borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  top: 16,
                  left: 0,
                  width: 0,
                  height: 0,
                  position: 'absolute',
                  borderRight: '10px solid transparent',
                  borderTop: `10px solid ${event.color}`,
                }}
              />

              <ListItemText
                disableTypography
                primary={
                  <Typography variant="subtitle2" sx={{ fontSize: 13, mt: 0.5 }}>
                    {event.title}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontSize: 11, color: 'text.disabled' }}
                  >
                    {event.allDay
                      ? fDate(event.start)
                      : `${fDateTime(event.start)} - ${fDateTime(event.end)}`}
                  </Typography>
                }
                sx={{ display: 'flex', flexDirection: 'column-reverse' }}
              />
            </ListItemButton>
          </Box>
        ))}
      </Box>
    </>
  );

  // Render filter controls
  const renderAdvancedFilters = (
    <Box sx={{ px: 2.5, mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Advanced Filters
      </Typography>
      {!leave && (
        <>
          {/* Global/Granular */}
          <Select
            value={filters.state.is_global ?? ''}
            onChange={(e) =>
              handleFilterIsGlobal(e.target.value === '' ? '' : e.target.value === 'true')
            }
            fullWidth
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="">All (Global & Granular)</MenuItem>
            <MenuItem value="true">Global</MenuItem>
            <MenuItem value="false">Granular</MenuItem>
          </Select>
          {/* Employment Type */}
          <Select
            value={filters.state.employment_types || ''}
            onChange={(e) => handleFilterEmploymentType(e.target.value)}
            fullWidth
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="all">All Employment Types</MenuItem>
            {leaveGroups?.map((group) => (
              <MenuItem key={group?.id} value={group?.id}>
                {group?.name}
              </MenuItem>
            ))}
          </Select>
          {/* Branches */}
          <Autocomplete
            multiple
            options={branchOptions}
            value={branchOptions.filter((b) => (filters.state.branches || []).includes(b.id))}
            onChange={(_, newValue) => handleFilterBranches(newValue.map((b) => b.id))}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Branches" />}
            sx={{ mb: 2 }}
            ChipProps={{ variant: 'soft', color: 'primary', size: 'small' }}
          />
          {/* Departments */}
          <Autocomplete
            multiple
            options={departmentOptions}
            value={departmentOptions.filter((d) =>
              (filters.state.departments || []).includes(d.id)
            )}
            onChange={(_, newValue) => handleFilterDepartments(newValue.map((d) => d.id))}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Departments" />}
            sx={{ mb: 2 }}
            ChipProps={{ variant: 'soft', color: 'primary', size: 'small' }}
          />
          {/* Designations */}
          <Autocomplete
            multiple
            options={designationOptions}
            value={designationOptions.filter((d) =>
              (filters.state.designations || []).includes(d.id)
            )}
            onChange={(_, newValue) => handleFilterDesignations(newValue.map((d) => d.id))}
            getOptionLabel={(option) => {
              const dept =
                option?.department_name || (option?.department && option.department.name) || '';
              return dept ? `${option.name} (${dept})` : option.name;
            }}
            renderInput={(params) => <TextField {...params} label="Designations" />}
            sx={{ mb: 2 }}
            ChipProps={{ variant: 'soft', color: 'primary', size: 'small' }}
          />
          {/* Assigned Employees */}
          <Autocomplete
            multiple
            options={employeeOptions}
            value={employeeOptions.filter((e) =>
              (filters.state.assigned_employees || []).includes(e.user?.id)
            )}
            onChange={(_, newValue) =>
              handleFilterAssignedEmployees(newValue.map((e) => e.user?.id))
            }
            getOptionLabel={(option) =>
              option.employee_name
                ? `${option.employee_name}${option.employee_id ? ` (${option.employee_id})` : ''}`
                : option.user?.username || ''
            }
            renderOption={(props, option) => (
              <li {...props} key={option.user?.id || option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={option.profile_picture || ''}
                    alt={option.employee_name || option.user?.username}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" color="text.primary">
                      {option.employee_name || option.user?.username}
                    </Typography>
                    {option.employee_id && (
                      <Typography variant="caption" color="text.secondary">
                        {option.employee_id}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Assigned Employees" />}
            sx={{ mb: 2 }}
            ChipProps={{ variant: 'soft', color: 'primary', size: 'small' }}
          />
          {/* Excluded Employees */}
          <Autocomplete
            multiple
            options={employeeOptions}
            value={employeeOptions.filter((e) =>
              (filters.state.excluded_employees || []).includes(e.user?.id)
            )}
            onChange={(_, newValue) =>
              handleFilterExcludedEmployees(newValue.map((e) => e.user?.id))
            }
            getOptionLabel={(option) =>
              option.employee_name
                ? `${option.employee_name} ${option.employee_id ? `(${option.employee_id})` : ''}`
                : option.user?.username || ''
            }
            renderOption={(props, option) => (
              <li {...props} key={option.user?.id || option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={option.profile_picture || ''}
                    alt={option.employee_name || option.user?.username}
                    sx={{ width: 24, height: 24 }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" color="text.primary">
                      {option.employee_name || option.user?.username}
                    </Typography>
                    {option.employee_id && (
                      <Typography variant="caption" color="text.secondary">
                        {option.employee_id}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Excluded Employees" />}
            sx={{ mb: 2 }}
            ChipProps={{ variant: 'soft', color: 'primary', size: 'small' }}
          />
        </>
      )}
      {leave && (
        <>
          <Select
            value={filters.state.leaveType}
            onChange={(e) => filters.setState({ leaveType: e.target.value })}
            multiple
            fullWidth
            displayEmpty
            renderValue={(selected) =>
              selected.length > 0 ? selected.join(', ') : 'Select leave types'
            }
            sx={{ mb: 2 }}
          >
            <MenuItem value="">All Leave Types</MenuItem>
            {leaveTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={filters.state.status}
            onChange={(e) => filters.setState({ status: e.target.value })}
            fullWidth
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
          <Select
            value={filters.state.employee}
            onChange={(e) => filters.setState({ employee: e.target.value })}
            fullWidth
            displayEmpty
            sx={{ mb: 2 }}
          >
            <MenuItem value="">All Employees</MenuItem>
            {employees.map((emp) => (
              <MenuItem key={emp} value={emp}>
                {emp}
              </MenuItem>
            ))}
          </Select>
        </>
      )}
    </Box>
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ backdrop: { invisible: true } }}
      PaperProps={{ sx: { width: 320 } }}
    >
      {renderHead}
      <Scrollbar>
        {/* {renderColors} */}
        {renderAdvancedFilters}
        {renderDateRange}
        {renderEvents}
      </Scrollbar>
    </Drawer>
  );
}
