import { useCallback } from 'react';

import Chip from '@mui/material/Chip';

import { chipProps, FiltersBlock, FiltersResult } from 'src/components/filters-result';

// ----------------------------------------------------------------------

export function LeaveBalanceTableFiltersResult({
  filters,
  onResetPage,
  totalResults,
  options,
  sx,
}) {
  const handleRemoveDepartment = useCallback(() => {
    onResetPage();
    filters.setState({ department: '' });
  }, [filters, onResetPage]);

  const handleRemoveDesignation = useCallback(() => {
    onResetPage();
    filters.setState({ designation: '' });
  }, [filters, onResetPage]);

  const handleRemoveName = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleRemoveStart = useCallback(() => {
    onResetPage();
    filters.setState({ startDate: null });
  }, [filters, onResetPage]);

  const handleRemoveEnd = useCallback(() => {
    onResetPage();
    filters.setState({ endDate: null });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.onResetState();
  }, [filters, onResetPage]);

  return (
    <FiltersResult totalResults={totalResults} onReset={handleReset} sx={sx}>
      <FiltersBlock label="Department:" isShow={!!filters.state.department}>
        <Chip
          {...chipProps}
          label={
            options?.departments?.find((d) => d === filters.state.department) ||
            filters.state.department
          }
          onDelete={handleRemoveDepartment}
        />
      </FiltersBlock>

      <FiltersBlock label="Designation:" isShow={!!filters.state.designation}>
        <Chip
          {...chipProps}
          label={
            options?.designations?.find((d) => d === filters.state.designation) ||
            filters.state.designation
          }
          onDelete={handleRemoveDesignation}
        />
      </FiltersBlock>

      <FiltersBlock label="Name:" isShow={!!filters.state.name}>
        <Chip {...chipProps} label={filters.state.name} onDelete={handleRemoveName} />
      </FiltersBlock>

      <FiltersBlock label="From:" isShow={!!filters.state.startDate}>
        <Chip
          {...chipProps}
          label={filters.state.startDate ? filters.state.startDate.format('DD-MM-YYYY') : ''}
          onDelete={handleRemoveStart}
        />
      </FiltersBlock>

      <FiltersBlock label="To:" isShow={!!filters.state.endDate}>
        <Chip
          {...chipProps}
          label={filters.state.endDate ? filters.state.endDate.format('DD-MM-YYYY') : ''}
          onDelete={handleRemoveEnd}
        />
      </FiltersBlock>
    </FiltersResult>
  );
}
