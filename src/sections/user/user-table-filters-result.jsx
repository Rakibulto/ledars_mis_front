import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function UserTableFiltersResult({ filters, onResetPage, totalResults, options, sx }) {
  const handleRemoveStatus = useCallback(() => {
    onResetPage();
    filters.setState({ status: 'all' });
  }, [filters, onResetPage]);

  const handleRemoveName = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveRole = useCallback(() => {
    onResetPage();
    filters.setState({ role: '' });
  }, [filters, onResetPage]);

  const handleRemoveDepartment = useCallback(() => {
    onResetPage();
    filters.setState({ department: '' });
  }, [filters, onResetPage]);

  const handleRemoveDesignation = useCallback(() => {
    onResetPage();
    filters.setState({ designation: '' });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Status:" isShow={filters.state.status !== 'all'}>
        <Chip
          {...chipProps}
          label={filters.state.status}
          onDelete={handleRemoveStatus}
          sx={{ textTransform: 'capitalize' }}
        />
      </FiltersBlock>

      <FiltersBlock label="Role:" isShow={!!filters.state.role}>
        <Chip
          {...chipProps}
          label={
            options?.roles?.find((r) => r.value === filters.state.role)?.label || filters.state.role
          }
          onDelete={handleRemoveRole}
        />
      </FiltersBlock>

      <FiltersBlock label="Department:" isShow={!!filters.state.department}>
        <Chip
          {...chipProps}
          label={
            options?.departments?.find((d) => d.value === filters.state.department)?.label ||
            filters.state.department
          }
          onDelete={handleRemoveDepartment}
        />
      </FiltersBlock>

      <FiltersBlock label="Designation:" isShow={!!filters.state.designation}>
        <Chip
          {...chipProps}
          label={
            options?.designations?.find((d) => d.value === filters.state.designation)?.label ||
            filters.state.designation
          }
          onDelete={handleRemoveDesignation}
        />
      </FiltersBlock>

      <FiltersBlock label="Name:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveName} />
      </FiltersBlock>
    </FiltersResult>
  );
}
