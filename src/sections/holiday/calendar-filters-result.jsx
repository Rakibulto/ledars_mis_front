import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

import { fDateRangeShortLabel } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function CalendarFiltersResult({
  filters,
  totalResults,
  holidays = [],
  branchOptions = [],
  departmentOptions = [],
  designationOptions = [],
  employeeOptions = [],
  leaveGroups = [],
  sx,
}) {
  const handleRemoveColor = useCallback(
    (inputValue) => {
      const newValue = (filters.state.colors || []).filter((item) => item !== inputValue);
      filters.setState({ colors: newValue });
    },
    [filters]
  );

  const handleRemoveDate = useCallback(() => {
    filters.setState({ startDate: null, endDate: null });
  }, [filters]);

  const handleRemoveIsGlobal = useCallback(() => {
    filters.setState({ is_global: '' });
  }, [filters]);

  const handleRemoveEmploymentType = useCallback(() => {
    filters.setState({ employment_types: '' });
  }, [filters]);

  const handleRemoveBranch = useCallback(
    (id) => {
      filters.setState({
        branches: (filters.state.branches || []).filter((b) => b !== id),
      });
    },
    [filters]
  );

  const handleRemoveDepartment = useCallback(
    (id) => {
      filters.setState({
        departments: (filters.state.departments || []).filter((d) => d !== id),
      });
    },
    [filters]
  );

  const handleRemoveDesignation = useCallback(
    (id) => {
      filters.setState({
        designations: (filters.state.designations || []).filter((d) => d !== id),
      });
    },
    [filters]
  );

  const handleRemoveAssignedEmployee = useCallback(
    (id) => {
      filters.setState({
        assigned_employees: (filters.state.assigned_employees || []).filter((e) => e !== id),
      });
    },
    [filters]
  );

  const handleRemoveExcludedEmployee = useCallback(
    (id) => {
      filters.setState({
        excluded_employees: (filters.state.excluded_employees || []).filter((e) => e !== id),
      });
    },
    [filters]
  );

  const getEmployeeNameFromHolidays = (id) => {
    // Flatten all assigned and excluded employees from all holidays
    const allEmployees = holidays.flatMap((holiday) => [
      ...(holiday.assigned_employees_data || []),
      ...(holiday.excluded_employees_data || []),
    ]);
    const found = allEmployees.find((e) => e && e.id === id);
    if (found) return `${found.employee_name}${found.employee_id ? ` (${found.employee_id})` : ''}`;

    // fallback to employeeOptions if not found in holidays
    const emp = employeeOptions.find((e) => e && e.user?.id === id);
    return emp ? `${emp.employee_name}${emp.employee_id ? ` (${emp.employee_id})` : ''}` : id;
  };

  return (
    <FiltersResult totalResults={totalResults} onReset={filters.onResetState} sx={sx}>
      <FiltersBlock
        label="Colors:"
        isShow={!!(filters.state.colors && filters.state.colors.length)}
      >
        {(filters.state.colors || []).map((item) => (
          <Chip
            {...chipProps}
            key={item}
            label={
              <Box
                sx={{
                  ml: -0.5,
                  width: 18,
                  height: 18,
                  bgcolor: item,
                  borderRadius: '50%',
                  border: (theme) =>
                    `solid 1px ${varAlpha(theme.vars.palette.common.whiteChannel, 0.24)}`,
                }}
              />
            }
            onDelete={() => handleRemoveColor(item)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock
        label="Date:"
        isShow={Boolean(filters.state.startDate && filters.state.endDate)}
      >
        <Chip
          {...chipProps}
          label={fDateRangeShortLabel(filters.state.startDate, filters.state.endDate)}
          onDelete={handleRemoveDate}
        />
      </FiltersBlock>

      <FiltersBlock
        label="Global/Granular:"
        isShow={
          filters.state.is_global === true ||
          filters.state.is_global === 'true' ||
          filters.state.is_global === false ||
          filters.state.is_global === 'false'
        }
      >
        {(filters.state.is_global === true ||
          filters.state.is_global === 'true' ||
          filters.state.is_global === false ||
          filters.state.is_global === 'false') && (
          <Chip
            {...chipProps}
            label={
              filters.state.is_global === true || filters.state.is_global === 'true'
                ? 'Global'
                : 'Granular'
            }
            onDelete={handleRemoveIsGlobal}
          />
        )}
      </FiltersBlock>

      <FiltersBlock label="Employment Type:" isShow={!!filters.state.employment_types}>
        {filters.state.employment_types ? (
          <Chip
            {...chipProps}
            label={
              filters.state.employment_types === 'all'
                ? 'All'
                : leaveGroups.find((g) => g.id === filters.state.employment_types)?.name ||
                  filters.state.employment_types
            }
            onDelete={handleRemoveEmploymentType}
          />
        ) : null}
      </FiltersBlock>

      <FiltersBlock
        label="Branches:"
        isShow={!!(filters.state.branches && filters.state.branches.length)}
      >
        {(filters.state.branches || []).filter(Boolean).map((id) => {
          const branch = branchOptions.find((b) => b.id === id);
          return (
            <Chip
              {...chipProps}
              key={id}
              label={branch ? branch.name : id}
              onDelete={() => handleRemoveBranch(id)}
            />
          );
        })}
      </FiltersBlock>

      <FiltersBlock
        label="Departments:"
        isShow={!!(filters.state.departments && filters.state.departments.length)}
      >
        {(filters.state.departments || []).filter(Boolean).map((id) => {
          const department = departmentOptions.find((d) => d.id === id);
          return (
            <Chip
              {...chipProps}
              key={id}
              label={department ? department.name : id}
              onDelete={() => handleRemoveDepartment(id)}
            />
          );
        })}
      </FiltersBlock>

      <FiltersBlock
        label="Designations:"
        isShow={!!(filters.state.designations && filters.state.designations.length)}
      >
        {(filters.state.designations || []).filter(Boolean).map((id) => {
          const designation = designationOptions.find((d) => d.id === id);
          const label = designation
            ? `${designation.name}${designation.department_name || (designation.department && designation.department.name) ? ` (${designation.department_name || designation.department.name})` : ''}`
            : id;
          return (
            <Chip
              {...chipProps}
              key={id}
              label={label}
              onDelete={() => handleRemoveDesignation(id)}
            />
          );
        })}
      </FiltersBlock>

      <FiltersBlock
        label="Assigned Employees:"
        isShow={!!(filters.state.assigned_employees && filters.state.assigned_employees.length)}
      >
        {(filters.state.assigned_employees || []).filter(Boolean).map((id) => (
          <Chip
            {...chipProps}
            key={id}
            label={getEmployeeNameFromHolidays(id)}
            onDelete={() => handleRemoveAssignedEmployee(id)}
          />
        ))}
      </FiltersBlock>

      <FiltersBlock
        label="Excluded Employees:"
        isShow={!!(filters.state.excluded_employees && filters.state.excluded_employees.length)}
      >
        {(filters.state.excluded_employees || []).filter(Boolean).map((id) => (
          <Chip
            {...chipProps}
            key={id}
            label={getEmployeeNameFromHolidays(id)}
            onDelete={() => handleRemoveExcludedEmployee(id)}
          />
        ))}
      </FiltersBlock>
    </FiltersResult>
  );
}
