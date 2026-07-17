'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import { usePerdiumClaimApi } from '../../_components/configuration/use-perdium-claim-api';

const statusColor = {
  draft: 'default',
  submitted: 'info',
  approved: 'success',
  rejected: 'error',
};

export default function PerdiumClaimListPage() {
  const { claims, loading, actions } = usePerdiumClaimApi();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await actions.deleteClaim(id);
      toast.success('Claim deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Perdium Claims
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          component={Link}
          href={paths.dashboard.accountingFinance.configuration.perdiumClaimCreate}
        >
          New Claim
        </Button>
      </Stack>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>From</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>To</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Total (Taka)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography sx={{ py: 3 }} color="text.secondary">
                      Loading...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography sx={{ py: 3 }} color="text.secondary">
                      No claims found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Link
                        href={paths.dashboard.accountingFinance.configuration.perdiumClaimDetail(
                          c.id
                        )}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {c.employee_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.designation}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>{c.grade}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.purpose_of_travel}
                      </Typography>
                    </TableCell>
                    <TableCell>{c.from_date || '-'}</TableCell>
                    <TableCell>{c.to_date || '-'}</TableCell>
                    <TableCell align="right">{c.grand_total?.toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={c.status}
                        color={statusColor[c.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          component={Link}
                          href={paths.dashboard.accountingFinance.configuration.perdiumClaimDetail(
                            c.id
                          )}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(c.id)}
                          disabled={deleting === c.id}
                        >
                          {deleting === c.id ? '...' : 'Delete'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
