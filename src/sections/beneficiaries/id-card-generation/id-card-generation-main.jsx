'use client';

import { toast } from 'sonner';
import { useState } from 'react';

import {
  Box,
  Card,
  Grid,
  Chip,
  Stack,
  Table,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
} from '@mui/material';

import { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

import SummaryCard from '../../_components/summary-card';

export default function IdCardGenerationMain() {
  const { data: rawData, loading } = useGetRequest(endpoints.beneficiaries.beneficiaries_database);
  const { data: summary } = useGetRequest(
    `${endpoints.beneficiaries.beneficiaries_database}summary/`
  );
  const BENEFICIARIES = Array.isArray(rawData) ? rawData : rawData?.results || [];

  const [selectedIds, setSelectedIds] = useState([]);

  const handleToggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleGenerateSelected = () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one beneficiary');
      return;
    }
    const selected = activeBeneficiaries.filter((b) => selectedIds.includes(b.id));
    printIdCards(selected);
  };

  const handleGenerateAll = () => {
    if (activeBeneficiaries.length === 0) {
      toast.error('No active beneficiaries found');
      return;
    }
    printIdCards(activeBeneficiaries);
  };

  const printIdCards = (beneficiaries) => {
    const cardHtml = beneficiaries
      .map(
        (b) =>
          `<div style="border:1px solid #ccc;padding:16px;margin:8px;width:350px;font-family:sans-serif;">
            <h3 style="margin:0 0 8px;">LEDARS Beneficiary ID</h3>
            <p><strong>Code:</strong> ${b.ben_code || ''}</p>
            <p><strong>Name:</strong> ${b.name || ''}</p>
            <p><strong>NID:</strong> ${b.nid || ''}</p>
            <p><strong>Contact:</strong> ${b.contact || ''}</p>
            <p><strong>Project:</strong> ${b.project || ''}</p>
          </div>`
      )
      .join('');
    const win = window.open('', '_blank');
    win.document.write(
      `<html><head><title>ID Cards</title></head><body style="display:flex;flex-wrap:wrap;">${cardHtml}</body></html>`
    );
    win.document.close();
    win.print();
    toast.success(`Generated ${beneficiaries.length} ID card(s)`);
  };

  const activeBeneficiaries = BENEFICIARIES.filter((b) => b.status === 'Active');

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            ID Card Generation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate and print beneficiary identification cards
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleGenerateSelected}
            startIcon={<Iconify icon="solar:card-bold" />}
          >
            Generate Selected ({selectedIds.length})
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerateAll}
            startIcon={<Iconify icon="solar:printer-bold" />}
          >
            Generate All
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Beneficiaries"
            value={summary?.total_beneficiaries || 0}
            icon="solar:card-bold"
            color="primary"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Active (Eligible)"
            value={summary?.active || 0}
            icon="solar:clock-circle-bold"
            color="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Selected"
            value={selectedIds.length}
            icon="solar:printer-bold"
            color="success"
          />
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === activeBeneficiaries.length}
                    onChange={() =>
                      setSelectedIds(
                        selectedIds.length === activeBeneficiaries.length
                          ? []
                          : activeBeneficiaries.map((b) => b.id)
                      )
                    }
                  />
                </TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>NID</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Project</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeBeneficiaries.map((row) => (
                <TableRow key={row.id} selected={selectedIds.includes(row.id)}>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleToggle(row.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {row.ben_code}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.nid}</TableCell>
                  <TableCell>{row.contact}</TableCell>
                  <TableCell>{row.project}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color="success" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
