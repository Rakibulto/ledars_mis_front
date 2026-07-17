'use client';

import { toast } from 'sonner';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';

import { formatCurrency } from '../utils';
import { useYearEndWorkspace } from './use-year-end-workspace';
import { YearEndWorkspaceToolbar } from './year-end-workspace-toolbar';
import { exportYearEndCsv, exportYearEndJson, exportYearEndExcel } from './year-end-export';

export default function OpeningEntries() {
  const [pendingAction, setPendingAction] = useState(null);
  const [importSource, setImportSource] = useState('Prior year trial balance');
  const [carryForwardMode, setCarryForwardMode] = useState('balance-sheet only');
  const [importStatus, setImportStatus] = useState('not imported');
  const [mappingRows, setMappingRows] = useState([]);
  const { selectedFiscalYearId, fiscalYears, openingBatch, actions } = useYearEndWorkspace();
  const selectedYear = fiscalYears.find((year) => year.id === selectedFiscalYearId);

  const totalDebit = openingBatch.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = openingBatch.entries.reduce((sum, entry) => sum + entry.credit, 0);
  const difference = Math.abs(totalDebit - totalCredit);

  useEffect(() => {
    setMappingRows(
      openingBatch.entries.slice(0, 6).map((entry, index) => ({
        id: entry.id,
        sourceAccount: `${entry.account_code} ${entry.account_name}`,
        targetBook: index % 2 === 0 ? 'Opening journal' : 'Migration suspense',
        targetDimension: index % 3 === 0 ? 'Cost center carry-forward' : 'Department carry-forward',
        status: entry.status,
      }))
    );
  }, [openingBatch.entries]);

  const exportConfig = useMemo(
    () => ({
      title: 'Opening Entries Pack',
      subtitle: `${selectedYear?.name || 'Fiscal year'} carry-forward`,
      alerts: [
        {
          title: 'Opening balances reflect balance-sheet accounts only',
          description:
            'Income and expense accounts are excluded because they are closed into retained earnings.',
        },
      ],
      summary: [
        { label: 'Batch status', value: openingBatch.batchStatus },
        { label: 'Import source', value: importSource },
        { label: 'Carry-forward mode', value: carryForwardMode },
        { label: 'Entries', value: openingBatch.entries.length },
        { label: 'Total debit', value: formatCurrency(totalDebit) },
        { label: 'Total credit', value: formatCurrency(totalCredit) },
      ],
      tables: [
        {
          title: 'Opening Entries',
          columns: [
            { key: 'account_code', label: 'Account Code' },
            { key: 'account_name', label: 'Account Name' },
            { key: 'reference', label: 'Reference' },
            { key: 'debit', label: 'Debit' },
            { key: 'credit', label: 'Credit' },
            { key: 'status', label: 'Status' },
          ],
          rows: openingBatch.entries.map((entry) => ({
            ...entry,
            debit: entry.debit ? formatCurrency(entry.debit) : '-',
            credit: entry.credit ? formatCurrency(entry.credit) : '-',
          })),
        },
        {
          title: 'Carry Forward Mapping',
          columns: [
            { key: 'sourceAccount', label: 'Source Account' },
            { key: 'targetBook', label: 'Target Book' },
            { key: 'targetDimension', label: 'Target Dimension' },
            { key: 'status', label: 'Status' },
          ],
          rows: mappingRows,
        },
      ],
      payload: { selectedYear, openingBatch, importSource, carryForwardMode, mappingRows },
    }),
    [
      carryForwardMode,
      importSource,
      mappingRows,
      openingBatch,
      selectedYear,
      totalCredit,
      totalDebit,
    ]
  );

  const runAction = async (label, action, successMessage) => {
    const loadingId = toast.loading(`${label}...`);
    setPendingAction(label);

    try {
      await action();
      toast.dismiss(loadingId);
      toast.success(successMessage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(error?.message || `${label} failed`);
    } finally {
      setPendingAction(null);
    }
  };

  const importPriorYearBalances = async () => {
    await runAction(
      'Import Prior-Year Balances',
      async () => {
        setImportStatus(`Imported from ${importSource}`);
      },
      'Prior-year balances imported into the carry-forward wizard'
    );
  };

  const applyMapping = async () => {
    await runAction(
      'Apply Carry-Forward Mapping',
      async () => {
        setMappingRows((current) => current.map((row) => ({ ...row, status: 'mapped' })));
      },
      'Opening mapping applied'
    );
  };

  const printContent = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ background: '#f5f5f5' }}>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account Code
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Account Name
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Reference
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
            Debit
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
            Credit
          </th>
          <th style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'left' }}>
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {openingBatch.entries.map((entry, idx) => (
          <tr key={idx}>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.account_code}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.account_name}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.reference}</td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              {entry.debit ? formatCurrency(entry.debit) : '—'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
              {entry.credit ? formatCurrency(entry.credit) : '—'}
            </td>
            <td style={{ border: '1px solid #ddd', padding: '6px 8px' }}>{entry.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Opening Entries
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Carry-forward pack for the next fiscal year with draft and publish workflow.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:play-circle-bold" />}
            onClick={() =>
              runAction(
                'Generate Opening Entries',
                () => Promise.resolve(actions.generateOpeningEntries(selectedFiscalYearId)),
                'Opening entries generated'
              )
            }
            disabled={pendingAction !== null}
          >
            Generate
          </Button>
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:check-circle-bold" />}
            onClick={() =>
              runAction(
                'Publish Opening Entries',
                () => Promise.resolve(actions.publishOpeningEntries(selectedFiscalYearId)),
                'Opening entries published'
              )
            }
            disabled={pendingAction !== null}
          >
            Publish
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Opening entries are generated from balance-sheet accounts and should be reviewed before
        posting into the next fiscal year.
      </Alert>

      <YearEndWorkspaceToolbar
        fiscalYears={fiscalYears}
        selectedFiscalYearId={selectedFiscalYearId}
        onFiscalYearChange={actions.setFiscalYear}
        exportDisabled={pendingAction !== null}
        onExportExcel={() =>
          runAction(
            'Export Opening Excel',
            () => exportYearEndExcel('opening-entries', exportConfig),
            'Opening entries workbook exported'
          )
        }
        onExportCsv={() =>
          runAction(
            'Export Opening CSV',
            () => exportYearEndCsv('opening-entries', exportConfig),
            'Opening entries CSV exported'
          )
        }
        onExportJson={() =>
          runAction(
            'Export Opening JSON',
            () => exportYearEndJson('opening-entries', exportConfig),
            'Opening entries JSON exported'
          )
        }
        printTitle="Opening Entries"
        printContent={printContent}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Batch status', value: openingBatch.batchStatus },
          { label: 'Total debit', value: formatCurrency(totalDebit) },
          { label: 'Total credit', value: formatCurrency(totalCredit) },
          { label: 'Difference', value: formatCurrency(difference) },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, xl: 3 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          {
            label: 'Import posture',
            value: importStatus,
            helper: `Source: ${importSource}`,
            tone: importStatus === 'not imported' ? 'warning.main' : 'success.main',
          },
          {
            label: 'Mapping completion',
            value: `${mappingRows.filter((row) => row.status === 'mapped').length}/${mappingRows.length}`,
            helper: 'Rows confirmed for target book and dimension carry-forward',
            tone:
              mappingRows.length > 0 && mappingRows.every((row) => row.status === 'mapped')
                ? 'success.main'
                : 'warning.main',
          },
          {
            label: 'Balance check',
            value: difference === 0 ? 'Balanced' : 'Out of balance',
            helper: `${formatCurrency(difference)} difference across opening entry totals`,
            tone: difference === 0 ? 'success.main' : 'error.main',
          },
        ].map((item) => (
          <Grid key={item.label} size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h6" fontWeight={800} sx={{ mt: 0.75, color: item.tone }}>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  {item.helper}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Carry-Forward Wizard
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  size="small"
                  label="Import source"
                  value={importSource}
                  onChange={(event) => setImportSource(event.target.value)}
                >
                  <MenuItem value="Prior year trial balance">Prior year trial balance</MenuItem>
                  <MenuItem value="Audited balance sheet">Audited balance sheet</MenuItem>
                  <MenuItem value="Migration workbook">Migration workbook</MenuItem>
                </TextField>
                <TextField
                  select
                  size="small"
                  label="Carry-forward mode"
                  value={carryForwardMode}
                  onChange={(event) => setCarryForwardMode(event.target.value)}
                >
                  <MenuItem value="balance-sheet only">Balance-sheet only</MenuItem>
                  <MenuItem value="balance-sheet with segments">
                    Balance-sheet with segments
                  </MenuItem>
                  <MenuItem value="balance-sheet plus suspense">
                    Balance-sheet plus suspense
                  </MenuItem>
                </TextField>
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  Import status: {importStatus}
                </Alert>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={importPriorYearBalances}
                    disabled={pendingAction !== null}
                  >
                    Import Balances
                  </Button>
                  <Button
                    variant="contained"
                    onClick={applyMapping}
                    disabled={pendingAction !== null}
                  >
                    Apply Mapping
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Mapping Review
              </Typography>
              <Stack spacing={1.5} divider={<Divider flexItem />}>
                {mappingRows.map((row, index) => (
                  <Stack
                    key={row.id}
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700}>
                        {row.sourceAccount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Mapping row {index + 1} for opening balance carry-forward review.
                      </Typography>
                    </Box>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        select
                        size="small"
                        label="Target book"
                        value={row.targetBook}
                        onChange={(event) =>
                          setMappingRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, targetBook: event.target.value }
                                : item
                            )
                          )
                        }
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value="Opening journal">Opening journal</MenuItem>
                        <MenuItem value="Migration suspense">Migration suspense</MenuItem>
                        <MenuItem value="Segment carry-forward">Segment carry-forward</MenuItem>
                      </TextField>
                      <TextField
                        select
                        size="small"
                        label="Target dimension"
                        value={row.targetDimension}
                        onChange={(event) =>
                          setMappingRows((current) =>
                            current.map((item) =>
                              item.id === row.id
                                ? { ...item, targetDimension: event.target.value }
                                : item
                            )
                          )
                        }
                        sx={{ minWidth: 220 }}
                      >
                        <MenuItem value="Cost center carry-forward">
                          Cost center carry-forward
                        </MenuItem>
                        <MenuItem value="Department carry-forward">
                          Department carry-forward
                        </MenuItem>
                        <MenuItem value="Project carry-forward">Project carry-forward</MenuItem>
                      </TextField>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Code</TableCell>
                <TableCell>Account Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reference</TableCell>
                <TableCell align="right">Debit</TableCell>
                <TableCell align="right">Credit</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {openingBatch.entries.map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>
                    <Chip label={entry.account_code} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>
                      {entry.account_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.source}
                    </Typography>
                  </TableCell>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.reference}</TableCell>
                  <TableCell align="right">
                    {entry.debit ? formatCurrency(entry.debit) : '-'}
                  </TableCell>
                  <TableCell align="right">
                    {entry.credit ? formatCurrency(entry.credit) : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={entry.status}
                      size="small"
                      color={entry.status === 'posted' ? 'success' : 'warning'}
                    />
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={4}>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totalDebit)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700}>{formatCurrency(totalCredit)}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={difference === 0 ? 'Balanced' : 'Unbalanced'}
                    size="small"
                    color={difference === 0 ? 'success' : 'error'}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
