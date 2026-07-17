'use client';

import { useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { deleteHoliday, useGetHolidays } from 'src/actions/holiday';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { RenderContentLoading } from 'src/components/loading';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useAuthContext } from 'src/auth/hooks/use-auth-context';

import { HolidayTableRow } from '../holiday-table-row';
import { HolidayQuickEditForm } from '../holiday-quick-edit-form';
import { HolidayTableFiltersResult } from '../holiday-table-filters-result';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [{ value: 'all', label: 'All' }];

const TABLE_HEAD = [
  { id: 'name', label: 'Holiday Name' },
  { id: 'from_date', label: 'Start Time' },
  { id: 'to_date', label: 'End Time' },
  { id: 'total_day', label: 'Total Day' },
  { id: 'description', label: 'Description' },
  { id: 'is_global', label: 'Global/Granular' },
  { id: '', width: 88 },
];

// ----------------------------------------------------------------------

export function HolidayListView() {
  const addLeave = useBoolean();

  const table = useTable();

  const confirm = useBoolean();

  const { datas, datasLoading } = useGetHolidays();
  const { user } = useAuthContext();

  const canAddHoliday = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'add_holiday'
  );
  const canChangeHoliday = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'change_holiday'
  );
  const canDeleteHoliday = user?.user_permissions_list?.some(
    (perm) => perm.codename === 'delete_holiday'
  );

  const tableData = useMemo(
    () => (!datasLoading && datas?.length > 0 ? datas : []),
    [datas, datasLoading]
  );

  const filters = useSetState({ status: 'all' });

  const dataFiltered = applyFilter({
    inputData: tableData || [],
    comparator: getComparator(table.order, table.orderBy),
    filters: filters.state,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset = filters.state.status !== 'all';

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await deleteHoliday(id);

        table.onUpdatePageDeleteRow(dataInPage.length);

        toast.success('Holiday deleted successfully!');
      } catch (error) {
        console.error('Failed to delete holiday:', error);
        toast.error('Failed to delete holiday. Please try again.');
      }
    },
    [dataInPage.length, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      const deletePromises = table.selected.map((id) => deleteHoliday(id));

      await Promise.all(deletePromises);

      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });

      table.onSelectAllRows(false, []);

      toast.success('Holidays deleted successfully!');
    } catch (error) {
      console.error('Failed to delete holidays:', error);
      toast.error('Failed to delete holidays. Please try again.');
    }
  }, [dataFiltered.length, dataInPage.length, table]);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Holiday List"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Holidays' }]}
          action={
            canAddHoliday && (
              <Button
                onClick={addLeave.onTrue}
                variant="contained"
                color="primary"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                New Holiday
              </Button>
            )
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {datasLoading ? (
          <RenderContentLoading showAnalytics={false} m={0} />
        ) : (
          <Card>
            <Tabs
              value={filters.state.status}
              onChange={handleFilterStatus}
              sx={{
                px: 2.5,
                boxShadow: (theme) =>
                  `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }}
            >
              {STATUS_OPTIONS.map((tab) => (
                <Tab
                  key={tab.value}
                  iconPosition="end"
                  value={tab.value}
                  label={tab.label}
                  icon={
                    <Label
                      variant={
                        ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                        'soft'
                      }
                      color={
                        (tab.value === 'Approved' && 'success') ||
                        ((tab.value === 'Pending' || tab.value === 'On Hold') && 'warning') ||
                        ((tab.value === 'Rejected' || tab.value === 'Expired') && 'error') ||
                        'default'
                      }
                    >
                      {tab.value !== 'all'
                        ? datas.filter((holiday) => holiday.status === tab.value).length
                        : datas.length}
                    </Label>
                  }
                />
              ))}
            </Tabs>

            {canReset && (
              <HolidayTableFiltersResult
                filters={filters}
                totalResults={dataFiltered.length}
                onResetPage={table.onResetPage}
                onResetFilters={() => filters.setState({ status: 'all' })}
                sx={{ p: 2.5 }}
              />
            )}

            <Box sx={{ position: 'relative' }}>
              {canDeleteHoliday && (
                <TableSelectedAction
                  dense={table.dense}
                  numSelected={table.selected.length}
                  rowCount={dataFiltered.length}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                  action={
                    <Tooltip title="Delete">
                      <IconButton color="primary" onClick={confirm.onTrue}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Tooltip>
                  }
                />
              )}

              <Scrollbar>
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={dataFiltered.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    onSelectAllRows={
                      canDeleteHoliday
                        ? (checked) =>
                            table.onSelectAllRows(
                              checked,
                              dataFiltered.map((row) => row.id)
                            )
                        : undefined
                    }
                  />

                  <TableBody>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <HolidayTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onDeleteRow={handleDeleteRow}
                          canChange={canChangeHoliday}
                          canDelete={canDeleteHoliday}
                        />
                      ))}

                    <TableEmptyRows
                      height={table.dense ? 56 : 76}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                    />

                    <TableNoData notFound={notFound} />
                  </TableBody>
                </Table>
              </Scrollbar>
            </Box>

            <TablePaginationCustom
              page={table.page}
              dense={table.dense}
              count={dataFiltered.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onChangeDense={table.onChangeDense}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          </Card>
        )}
      </DashboardContent>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />

      <HolidayQuickEditForm
        open={addLeave.value}
        onClose={addLeave.onFalse}
        addEntry
        currentHoliday={{}}
      />
    </>
  );
}

function applyFilter({ inputData, comparator, filters }) {
  const { status } = filters;

  let filteredData = [...inputData];

  if (status && status !== 'all') {
    filteredData = filteredData.filter((item) => item.status === status);
  }

  filteredData = filteredData
    .map((el, index) => [el, index])
    .sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    })
    .map((el) => el[0]);

  return filteredData;
}
