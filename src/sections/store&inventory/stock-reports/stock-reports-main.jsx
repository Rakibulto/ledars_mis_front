/* eslint-disable perfectionist/sort-named-imports */

'use client';

import { useState } from 'react';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';

import { Iconify } from 'src/components/iconify';

export function StockReportsMain() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [category, setCategory] = useState('all');

  const reports = [
    {
      name: 'Current Stock Statement',
      description: 'Complete list of all items in stock',
      icon: 'solar:document-text-bold-duotone',
    },
    {
      name: 'Stock Movement Report',
      description: 'All receipts and issues for the period',
      icon: 'solar:document-text-bold-duotone',
    },
    {
      name: 'Low Stock Items Report',
      description: 'Items below reorder level',
      icon: 'solar:document-text-bold-duotone',
    },
    {
      name: 'Stock Valuation Report',
      description: 'Total value of inventory',
      icon: 'solar:document-text-bold-duotone',
    },
    {
      name: 'Dead Stock Report',
      description: 'Items with no movement',
      icon: 'solar:document-text-bold-duotone',
    },
    {
      name: 'ABC Analysis Report',
      description: 'Categorization by value and movement',
      icon: 'solar:document-text-bold-duotone',
    },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'it', label: 'IT Equipment' },
    { value: 'furniture', label: 'Office Furniture' },
    { value: 'stationery', label: 'Stationery' },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 0.5, fontWeight: 600, color: '#111827' }}>
          Stock Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          Generate and export inventory reports
        </Typography>
      </Box>

      {/* Filters */}
      <Card
        sx={{
          mb: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 600, fontSize: '1.125rem' }}>
            Report Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="mm/dd/yyyy"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="mm/dd/yyyy"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{
                    borderRadius: 1.5,
                    bgcolor: 'background.paper',
                  }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <Grid container spacing={3}>
        {reports.map((report, index) => (
          <Grid key={index} size={{ xs: 12, md: 6 }}>
            <Card
              sx={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'box-shadow 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: '#E3F2FD',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Iconify icon={report.icon} width={28} sx={{ color: '#2563eb' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, mb: 0.75, fontSize: '1.125rem' }}
                    >
                      {report.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {report.description}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={
                      <Iconify icon="solar:download-minimalistic-bold-duotone" width={18} />
                    }
                    sx={{
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      py: 1.25,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Download PDF
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={
                      <Iconify icon="solar:download-minimalistic-bold-duotone" width={18} />
                    }
                    sx={{
                      borderColor: '#10b981',
                      color: '#10b981',
                      borderRadius: 2,
                      py: 1.25,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.9375rem',
                      '&:hover': {
                        borderColor: '#059669',
                        bgcolor: 'rgba(16, 185, 129, 0.04)',
                      },
                    }}
                  >
                    Export Excel
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
