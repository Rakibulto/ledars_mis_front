import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Autocomplete from '@mui/material/Autocomplete';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function UserTableToolbar({ filters, options, onResetPage, leaveType }) {
  const getOptionValue = (option) => (typeof option === 'string' ? option : option?.value);
  const getOptionLabel = (option) => (typeof option === 'string' ? option : option?.label);

  const handleFilterName = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ name: event.target.value });
    },
    [filters, onResetPage]
  );

  const handleFilterRole = useCallback(
    (event) => {
      onResetPage();
      filters.setState({ role: event.target.value });
    },
    [filters, onResetPage]
  );

  return (
    <Stack
      spacing={2}
      alignItems={{ xs: 'flex-end', md: 'center' }}
      direction={{ xs: 'column', md: 'row' }}
      sx={{ p: !leaveType ? 2.5 : 0, pr: { xs: !leaveType ? 2.5 : 0, md: !leaveType ? 1 : 0 } }}
    >
      {options?.roles && options.roles.length > 0 && (
        <FormControl sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}>
          <InputLabel htmlFor="user-filter-role-select-label">
            {!leaveType ? 'Role' : 'Leave Type'}
          </InputLabel>
          <Select
            value={filters.state.role || ''}
            onChange={handleFilterRole}
            input={<OutlinedInput label={!leaveType ? 'Role' : 'Leave Type'} />}
            inputProps={{ id: 'user-filter-role-select-label' }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {options.roles.map((option) => {
              const value = getOptionValue(option);
              const label = getOptionLabel(option);
              return (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}

      {options?.departments && options.departments.length > 0 && (
        <Autocomplete
          sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}
          options={options.departments}
          getOptionLabel={(option) => getOptionLabel(option)}
          value={
            options.departments.find((opt) => getOptionValue(opt) === filters.state.department) ||
            null
          }
          onChange={(event, newValue) => {
            onResetPage();
            filters.setState({ department: newValue ? getOptionValue(newValue) : '' });
          }}
          renderInput={(params) => <TextField {...params} label="Department" />}
        />
      )}

      {options?.designations && options.designations.length > 0 && (
        <Autocomplete
          sx={{ flexShrink: 0, width: { xs: 1, md: 200 } }}
          options={options.designations}
          getOptionLabel={(option) => getOptionLabel(option)}
          value={
            options.designations.find((opt) => getOptionValue(opt) === filters.state.designation) ||
            null
          }
          onChange={(event, newValue) => {
            onResetPage();
            filters.setState({ designation: newValue ? getOptionValue(newValue) : '' });
          }}
          renderInput={(params) => <TextField {...params} label="Designation" />}
        />
      )}

      <Stack direction="row" alignItems="center" spacing={2} flexGrow={1} sx={{ width: 1 }}>
        <TextField
          fullWidth
          value={filters.state.name}
          onChange={handleFilterName}
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
    </Stack>
  );
}
