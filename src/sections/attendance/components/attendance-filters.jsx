import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

export function AttendanceFilters({
  departments = [],
  designations = [],
  branches = [],
  departmentFilter = '',
  designationFilter = '',
  branchFilter = '',
  keywordFilter = '',
  onDepartmentChange,
  onDesignationChange,
  onBranchChange,
  onKeywordChange,
  sx,
  flag = false,
}) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={sx}
      width="100%"
    >
      <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flex: 1 }}>
        <InputLabel id="branch-select-label">Branch</InputLabel>
        <Select value={branchFilter} onChange={onBranchChange} label="Branch">
          <MenuItem value="">All Branches</MenuItem>
          {branches?.map((branch) => {
            const branchName = typeof branch === 'object' ? branch.name : branch;
            const value = flag ? branchName : branchName ? encodeURIComponent(branchName) : '';
            return (
              <MenuItem key={branchName} value={value}>
                {branchName}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flex: 1 }}>
        <InputLabel id="department-select-label">Department</InputLabel>
        <Select value={departmentFilter} onChange={onDepartmentChange} label="Department">
          <MenuItem value="">All Departments</MenuItem>
          {departments?.map((dept) => {
            const deptName = typeof dept === 'object' ? dept.name : dept;
            const value = flag ? deptName : deptName ? encodeURIComponent(deptName) : '';
            return (
              <MenuItem key={deptName} value={value}>
                {deptName}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: { xs: '100%', md: 200 }, flex: 1 }}>
        <InputLabel id="designation-select-label">Designation</InputLabel>
        <Select value={designationFilter} onChange={onDesignationChange} label="Designation">
          <MenuItem value="">All Designations</MenuItem>
          {designations?.map((desg) => {
            const name = typeof desg === 'object' ? desg?.name : desg;
            const deptName =
              typeof desg === 'object'
                ? desg?.department_name || (desg?.department && desg.department.name) || ''
                : '';
            const label = deptName ? `${name} (${deptName})` : name;
            const value = flag ? name : name ? encodeURIComponent(name) : '';
            return (
              <MenuItem key={label} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        label="Search"
        value={keywordFilter}
        onChange={onKeywordChange}
        placeholder="ID or Name"
        sx={{ minWidth: { xs: '100%', md: 200 }, flex: 1 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}
