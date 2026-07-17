'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { Icon } from '@iconify/react';

import {
  Box,
  Tab,
  Card,
  Grid,
  Tabs,
  Alert,
  Radio,
  Button,
  Divider,
  Checkbox,
  Typography,
  RadioGroup,
  CardContent,
  LinearProgress,
  FormControlLabel,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

const EP = endpoints.pm;

const EXPORT_FORMATS = [
  {
    id: 'csv',
    label: 'CSV',
    icon: 'solar:file-text-bold-duotone',
    description: 'Comma-separated values for spreadsheets',
  },
  {
    id: 'json',
    label: 'JSON',
    icon: 'solar:code-bold-duotone',
    description: 'Structured data format for developers',
  },
];

const IMPORT_SOURCES = [
  {
    id: 'csv',
    label: 'CSV File',
    icon: 'solar:file-text-bold-duotone',
    description: 'Import from CSV spreadsheet',
  },
];

const DATA_TYPE_ENDPOINTS = {
  Tasks: EP.tasks,
  Lists: EP.lists,
  Spaces: EP.spaces,
  'Time Entries': EP.time_entries,
  Goals: EP.goals,
  Docs: EP.docs,
  Templates: EP.templates,
  Sprints: EP.sprints,
};

const DATA_TYPES = Object.keys(DATA_TYPE_ENDPOINTS);

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function flattenRow(obj, prefix = '') {
  const result = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(result, flattenRow(v, key));
    else result[key] = Array.isArray(v) ? v.join('; ') : v;
  });
  return result;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const flat = rows.map((r) => flattenRow(r));
  const cols = [...new Set(flat.flatMap(Object.keys))];
  const escape = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [cols.join(','), ...flat.map((r) => cols.map((c) => escape(r[c])).join(','))].join('\n');
}

function ImportExportPage() {
  const [tab, setTab] = useState(0);
  const [exportFormat, setExportFormat] = useState('csv');
  const [selectedData, setSelectedData] = useState(['Tasks', 'Lists']);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const toggleData = (d) => {
    setSelectedData((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const allData = {};
      await Promise.all(
        selectedData
          .filter((dataType) => DATA_TYPE_ENDPOINTS[dataType])
          .map(async (dataType) => {
            const ep = DATA_TYPE_ENDPOINTS[dataType];
            const res = await axiosInstance.get(ep);
            allData[dataType] = Array.isArray(res.data) ? res.data : res.data?.results || [];
          })
      );
      const timestamp = new Date().toISOString().slice(0, 10);
      if (exportFormat === 'json') {
        downloadFile(
          JSON.stringify(allData, null, 2),
          `pm-export-${timestamp}.json`,
          'application/json'
        );
      } else {
        // CSV — combine all types into one file with a "type" column, or multiple files
        const combined = selectedData.flatMap((t) =>
          (allData[t] || []).map((r) => ({ _type: t, ...r }))
        );
        downloadFile(toCsv(combined), `pm-export-${timestamp}.csv`, 'text/csv');
      }
      toast.success(`Exported ${selectedData.join(', ')} as ${exportFormat.toUpperCase()}`);
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Import & Export
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab
          icon={<Icon icon="solar:upload-minimalistic-bold" />}
          label="Import"
          iconPosition="start"
        />
        <Tab
          icon={<Icon icon="solar:download-minimalistic-bold" />}
          label="Export"
          iconPosition="start"
        />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Import Data
          </Typography>
          <Grid container spacing={3}>
            {IMPORT_SOURCES.map((src) => (
              <Grid key={src.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 },
                    transition: 'box-shadow 0.2s',
                    height: '100%',
                  }}
                >
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: 1.5,
                      py: 3,
                    }}
                  >
                    <Icon icon={src.icon} width={40} style={{ color: '#3b82f6' }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      {src.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {src.description}
                    </Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                      {src.id === 'csv' ? 'Upload File' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {importing && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                  Importing...
                </Typography>
                <LinearProgress sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Processing data...
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Export Format
                  </Typography>
                  <RadioGroup
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    {EXPORT_FORMATS.map((fmt) => (
                      <Box
                        key={fmt.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 1,
                          border:
                            exportFormat === fmt.id ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                          bgcolor: exportFormat === fmt.id ? '#3b82f620' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => setExportFormat(fmt.id)}
                      >
                        <Radio value={fmt.id} checked={exportFormat === fmt.id} />
                        <Icon icon={fmt.icon} width={24} style={{ color: '#3b82f6' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {fmt.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fmt.description}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                    Data to Export
                  </Typography>
                  {DATA_TYPES.map((d) => (
                    <FormControlLabel
                      key={d}
                      label={d}
                      control={
                        <Checkbox
                          checked={selectedData.includes(d)}
                          onChange={() => toggleData(d)}
                        />
                      }
                      sx={{ display: 'flex', mb: 0.5 }}
                    />
                  ))}
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {selectedData.length} data type{selectedData.length !== 1 ? 's' : ''} selected
                    for export
                  </Alert>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Icon icon="solar:download-minimalistic-bold" />}
                    disabled={selectedData.length === 0 || exporting}
                    onClick={handleExport}
                  >
                    {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default ImportExportPage;
