'use client';

import { mutate } from 'swr';
import { toast } from 'sonner';
import { useRef, useMemo, useState, useCallback } from 'react';

import {
  Box,
  Card,
  Chip,
  Grid,
  Step,
  Alert,
  Stack,
  Table,
  Button,
  Divider,
  Stepper,
  MenuItem,
  TableRow,
  StepLabel,
  TableBody,
  TableCell,
  TableHead,
  TextField,
  Typography,
  LinearProgress,
  TableContainer,
} from '@mui/material';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useGetRequest } from 'src/actions/ledars-hook';

import { Iconify } from 'src/components/iconify';

const EP = endpoints.beneficiaries;
const steps = ['Upload File', 'Map Fields', 'Validate Data', 'Import'];
const MAX_RECORDS = 5000;
const PREVIEW_ROWS = 8;
const REQUIRED_FIELDS = ['name', 'sex', 'contact'];
const FIELD_CONFIG = [
  {
    key: 'ben_code',
    label: 'Beneficiary Code',
    required: false,
    helper: 'Optional. API will auto-generate when omitted.',
  },
  { key: 'name', label: 'Name', required: true },
  { key: 'father_name', label: 'Father Name', required: false },
  { key: 'mother_name', label: 'Mother Name', required: false },
  { key: 'age', label: 'Age', required: false },
  { key: 'date_of_birth', label: 'Date of Birth', required: false },
  { key: 'sex', label: 'Sex', required: true },
  { key: 'nid', label: 'NID', required: false },
  { key: 'contact', label: 'Contact', required: true },
  { key: 'email', label: 'Email', required: false },
  { key: 'address', label: 'Address', required: false },
  { key: 'division', label: 'Division', required: false },
  { key: 'district', label: 'District', required: false },
  { key: 'upazila', label: 'Upazila', required: false },
  { key: 'union', label: 'Union', required: false },
  { key: 'village', label: 'Village', required: false },
  {
    key: 'project',
    label: 'Project',
    required: false,
    helper: 'Project name will be matched to an existing project id.',
  },
  {
    key: 'vulnerability_type',
    label: 'Vulnerability Type',
    required: false,
    helper: 'Comma-separated values are converted to a list.',
  },
  { key: 'household_size', label: 'Household Size', required: false },
  { key: 'monthly_income', label: 'Monthly Income', required: false },
  { key: 'education_level', label: 'Education Level', required: false },
  { key: 'occupation', label: 'Occupation', required: false },
  { key: 'marital_status', label: 'Marital Status', required: false },
  { key: 'registration_date', label: 'Registration Date', required: false },
  { key: 'status', label: 'Status', required: false },
];
const TEMPLATE_FIELDS = FIELD_CONFIG.map((field) => field.key);
const DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Khulna',
  'Rajshahi',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];
const SEXES = ['Male', 'Female', 'Other'];
const MARITAL_STATUSES = ['Single', 'Married', 'Widowed', 'Divorced'];
const BENEFICIARY_STATUSES = ['Active', 'Inactive', 'Graduated'];

function normalizeText(value) {
  return (value || '').toString().trim().toLowerCase();
}

function normalizeHeader(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '_');
}

function formatCellValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value).trim();
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsvText(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const headers = splitCsvLine(lines[0]).map((item, index) => item || `Column ${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = formatCellValue(values[index] || '');
    });
    return row;
  });

  return { headers, rows };
}

async function parseSpreadsheetFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const text = await file.text();
    return parseCsvText(text);
  }

  if (extension === 'xls') {
    throw new Error(
      'Legacy .xls files are not supported in this workflow yet. Please save the file as .xlsx or .csv and retry.'
    );
  }

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  const headerRow = worksheet.getRow(1);
  const headers = headerRow.values
    .slice(1)
    .map((cell, index) => formatCellValue(cell) || `Column ${index + 1}`);

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const values = row.values.slice(1);
    const mapped = {};
    let hasAnyValue = false;
    headers.forEach((header, index) => {
      const value = formatCellValue(values[index]);
      mapped[header] = value;
      if (value) {
        hasAnyValue = true;
      }
    });
    if (hasAnyValue) {
      rows.push(mapped);
    }
  });

  return { headers, rows };
}

function buildAutoMapping(headers) {
  const normalizedMap = new Map(headers.map((header) => [normalizeHeader(header), header]));
  const mapping = {};
  FIELD_CONFIG.forEach((field) => {
    const exact = normalizedMap.get(field.key);
    const alias = normalizedMap.get(field.key.replace(/_/g, ''));
    mapping[field.key] = exact || alias || '';
  });
  return mapping;
}

function convertRowValue(fieldKey, value, projectLookup) {
  const cleaned = formatCellValue(value);
  if (!cleaned) {
    return undefined;
  }

  if (['age', 'household_size'].includes(fieldKey)) {
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : cleaned;
  }

  if (fieldKey === 'monthly_income') {
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : cleaned;
  }

  if (fieldKey === 'vulnerability_type') {
    if (cleaned.startsWith('[')) {
      try {
        return JSON.parse(cleaned);
      } catch {
        return cleaned
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    return cleaned
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (fieldKey === 'project') {
    const projectId = projectLookup.get(normalizeText(cleaned));
    return projectId || cleaned;
  }

  return cleaned;
}

function validatePayload(payload, projectLookup) {
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (!payload[field]) {
      errors.push(`${field.replace(/_/g, ' ')} is required`);
    }
  });

  if (payload.sex && !SEXES.includes(payload.sex)) {
    errors.push('sex must be Male, Female, or Other');
  }

  if (payload.division && !DIVISIONS.includes(payload.division)) {
    errors.push('division must match a configured division');
  }

  if (payload.marital_status && !MARITAL_STATUSES.includes(payload.marital_status)) {
    errors.push('marital status must match a configured value');
  }

  if (payload.status && !BENEFICIARY_STATUSES.includes(payload.status)) {
    errors.push('status must be Active, Inactive, or Graduated');
  }

  if (
    payload.project &&
    typeof payload.project === 'string' &&
    !projectLookup.get(normalizeText(payload.project))
  ) {
    errors.push('project could not be matched to an existing project');
  }

  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.push('email format is invalid');
  }

  return errors;
}

export default function BulkRegistrationMain() {
  const fileInputRef = useRef(null);
  const { data: rawProjects } = useGetRequest(endpoints.projects.projects);

  const projects = useMemo(
    () => (Array.isArray(rawProjects) ? rawProjects : rawProjects?.results || []),
    [rawProjects]
  );
  const projectLookup = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.name) {
        map.set(normalizeText(project.name), project.id);
      }
    });
    return map;
  }, [projects]);

  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [fieldMapping, setFieldMapping] = useState(() => buildAutoMapping([]));
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState('');
  const [importProgress, setImportProgress] = useState({
    processed: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const [importResult, setImportResult] = useState(null);

  const validationRows = useMemo(() => {
    if (!rawRows.length) {
      return [];
    }

    return rawRows.map((row, index) => {
      const payload = {};
      FIELD_CONFIG.forEach((field) => {
        const sourceColumn = fieldMapping[field.key];
        if (!sourceColumn) {
          return;
        }

        const converted = convertRowValue(field.key, row[sourceColumn], projectLookup);
        if (converted !== undefined && converted !== '') {
          payload[field.key] = converted;
        }
      });

      const errors = validatePayload(payload, projectLookup);
      return {
        rowNumber: index + 2,
        source: row,
        payload,
        errors,
        valid: errors.length === 0,
      };
    });
  }, [fieldMapping, projectLookup, rawRows]);

  const validRows = useMemo(() => validationRows.filter((row) => row.valid), [validationRows]);
  const invalidRows = useMemo(() => validationRows.filter((row) => !row.valid), [validationRows]);
  const previewRows = useMemo(() => validationRows.slice(0, PREVIEW_ROWS), [validationRows]);
  const mappedFieldCount = useMemo(
    () => FIELD_CONFIG.filter((field) => Boolean(fieldMapping[field.key])).length,
    [fieldMapping]
  );

  const handleDownloadTemplate = useCallback(() => {
    const csvContent = `${TEMPLATE_FIELDS.join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'beneficiary_bulk_template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  }, []);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setParseError('');
    setImportResult(null);
    setImportProgress({ processed: 0, total: 0, success: 0, failed: 0 });

    try {
      const parsed = await parseSpreadsheetFile(file);

      if (!parsed.rows.length) {
        throw new Error('No data rows were found in the selected file.');
      }

      if (parsed.rows.length > MAX_RECORDS) {
        throw new Error(
          `This file contains ${parsed.rows.length} rows. The current limit is ${MAX_RECORDS} rows per batch.`
        );
      }

      setUploadedFile(file);
      setHeaders(parsed.headers);
      setRawRows(parsed.rows);
      setFieldMapping(buildAutoMapping(parsed.headers));
      setActiveStep(1);
      toast.success(
        `Loaded ${parsed.rows.length} row${parsed.rows.length > 1 ? 's' : ''} from ${file.name}`
      );
    } catch (error) {
      setUploadedFile(file);
      setHeaders([]);
      setRawRows([]);
      setFieldMapping(buildAutoMapping([]));
      setParseError(error.message || 'Failed to parse file');
      toast.error(error.message || 'Failed to parse file');
    }
  }, []);

  const handleMappingChange = useCallback((fieldKey, value) => {
    setFieldMapping((prev) => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleNext = useCallback(async () => {
    if (activeStep === 1) {
      if (!fieldMapping.name || !fieldMapping.sex || !fieldMapping.contact) {
        toast.error('Map at least name, sex, and contact before continuing');
        return;
      }
      setActiveStep(2);
      return;
    }

    if (activeStep === 2) {
      if (!validRows.length) {
        toast.error('No valid rows are ready for import');
        return;
      }
      setActiveStep(3);
      return;
    }

    if (activeStep !== 3) {
      setActiveStep((prev) => prev + 1);
      return;
    }

    setImporting(true);
    setImportResult(null);
    setImportProgress({ processed: 0, total: validRows.length, success: 0, failed: 0 });

    const success = [];
    const failed = [];

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      const payload = { ...row.payload };
      if (typeof payload.project === 'string') {
        const projectId = projectLookup.get(normalizeText(payload.project));
        if (projectId) {
          payload.project = projectId;
        } else {
          delete payload.project;
        }
      }
      if (!payload.vulnerability_type || payload.vulnerability_type.length === 0) {
        delete payload.vulnerability_type;
      }
      delete payload.ben_code;

      try {
        const response = await axiosInstance.post(EP.beneficiaries_database, payload);
        success.push({ rowNumber: row.rowNumber, data: response.data });
      } catch (error) {
        failed.push({
          rowNumber: row.rowNumber,
          message: error?.response?.data?.detail || error?.message || 'Import failed',
        });
      }

      setImportProgress({
        processed: index + 1,
        total: validRows.length,
        success: success.length,
        failed: failed.length,
      });
    }

    setImportResult({ success, failed });
    setImporting(false);

    if (success.length) {
      mutate(EP.beneficiaries_database);
      toast.success(
        `${success.length} beneficiary row${success.length > 1 ? 's' : ''} imported successfully`
      );
    }
    if (failed.length) {
      toast.error(`${failed.length} row${failed.length > 1 ? 's' : ''} failed during import`);
    }
  }, [activeStep, fieldMapping, projectLookup, validRows]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setActiveStep(0);
    setUploadedFile(null);
    setHeaders([]);
    setRawRows([]);
    setFieldMapping(buildAutoMapping([]));
    setParseError('');
    setImporting(false);
    setImportResult(null);
    setImportProgress({ processed: 0, total: 0, success: 0, failed: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
        spacing={2}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Bulk Registration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Parse spreadsheet files locally, map incoming columns to real beneficiary fields,
            validate row quality, and import clean rows through the existing beneficiary API.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleDownloadTemplate}
          startIcon={<Iconify icon="solar:download-bold" />}
        >
          Download Template
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" color="text.secondary">
              Parsed Rows
            </Typography>
            <Typography variant="h4">{rawRows.length}</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" color="text.secondary">
              Mapped Fields
            </Typography>
            <Typography variant="h4">{mappedFieldCount}</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" color="text.secondary">
              Valid Rows
            </Typography>
            <Typography variant="h4">{validRows.length}</Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" color="text.secondary">
              Available Projects
            </Typography>
            <Typography variant="h4">{projects.length}</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, borderRadius: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {parseError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {parseError}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Iconify
              icon="solar:cloud-upload-bold-duotone"
              width={80}
              sx={{ color: 'primary.main', mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Upload Beneficiary Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Supports CSV and Excel (.xlsx) files. Legacy .xls should be converted before import.
              Max {MAX_RECORDS.toLocaleString()} records per batch.
            </Typography>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<Iconify icon="solar:upload-bold" />}
            >
              Select File
            </Button>
            {uploadedFile && !parseError && (
              <Alert severity="success" sx={{ mt: 3, textAlign: 'left' }}>
                Loaded <strong>{uploadedFile.name}</strong> with {rawRows.length} detected data row
                {rawRows.length > 1 ? 's' : ''}.
              </Alert>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Stack spacing={3}>
            <Alert severity="info">
              File: <strong>{uploadedFile?.name}</strong> — map spreadsheet columns to beneficiary
              create fields before validation.
            </Alert>

            <Grid container spacing={2}>
              {FIELD_CONFIG.map((field) => (
                <Grid key={field.key} size={{ xs: 12, md: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label={field.label}
                    value={fieldMapping[field.key] || ''}
                    onChange={(event) => handleMappingChange(field.key, event.target.value)}
                    helperText={
                      field.helper ||
                      (field.required ? 'Required for this import workflow' : 'Optional')
                    }
                  >
                    <MenuItem value="">Ignore this field</MenuItem>
                    {headers.map((header) => (
                      <MenuItem key={`${field.key}-${header}`} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              ))}
            </Grid>

            <Divider />

            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                Source Columns
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {headers.map((header) => (
                  <Chip key={header} label={header} variant="outlined" />
                ))}
              </Stack>
            </Box>
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity="success">
                  {validRows.length} valid row{validRows.length !== 1 ? 's' : ''} ready for import
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity={invalidRows.length ? 'warning' : 'success'}>
                  {invalidRows.length} invalid row{invalidRows.length !== 1 ? 's' : ''} need
                  correction
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Alert severity="info">
                  {projects.length} projects available for project-name matching
                </Alert>
              </Grid>
            </Grid>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Mapped Preview</TableCell>
                    <TableCell>Validation Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell>{row.rowNumber}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          color={row.valid ? 'success' : 'warning'}
                          label={row.valid ? 'Valid' : 'Needs Review'}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          {Object.entries(row.payload)
                            .slice(0, 5)
                            .map(([key, value]) => (
                              <Chip
                                key={`${row.rowNumber}-${key}`}
                                size="small"
                                variant="outlined"
                                label={`${key}: ${Array.isArray(value) ? value.join(', ') : value}`}
                              />
                            ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {row.errors.length ? row.errors.join(' • ') : 'Ready to import'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {validationRows.length > PREVIEW_ROWS && (
              <Typography variant="body2" color="text.secondary">
                Showing the first {PREVIEW_ROWS} rows of {validationRows.length} parsed rows.
              </Typography>
            )}
          </Stack>
        )}

        {activeStep === 3 && (
          <Stack spacing={3}>
            <Alert severity="info">
              Import runs only against valid rows and submits each row through the existing
              beneficiary create endpoint.
            </Alert>

            {importing && (
              <Box>
                <LinearProgress
                  variant={importProgress.total ? 'determinate' : 'indeterminate'}
                  value={
                    importProgress.total
                      ? (importProgress.processed / importProgress.total) * 100
                      : 0
                  }
                  sx={{ mb: 1.5 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Processed {importProgress.processed} of {importProgress.total} valid row
                  {importProgress.total !== 1 ? 's' : ''}.
                </Typography>
              </Box>
            )}

            {!importing && !importResult && (
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Alert severity="success">
                    {validRows.length} row{validRows.length !== 1 ? 's are' : ' is'} queued for
                    import
                  </Alert>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Alert severity={invalidRows.length ? 'warning' : 'success'}>
                    {invalidRows.length} row{invalidRows.length !== 1 ? 's are' : ' is'} excluded
                    because of validation issues
                  </Alert>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Alert severity="info">
                    Project names are converted to ids when a match is found
                  </Alert>
                </Grid>
              </Grid>
            )}

            {importResult && (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Alert severity={importResult.success.length ? 'success' : 'info'}>
                      {importResult.success.length} row
                      {importResult.success.length !== 1 ? 's' : ''} imported successfully
                    </Alert>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Alert severity={importResult.failed.length ? 'error' : 'success'}>
                      {importResult.failed.length} row{importResult.failed.length !== 1 ? 's' : ''}{' '}
                      failed during API submission
                    </Alert>
                  </Grid>
                </Grid>

                {importResult.failed.length > 0 && (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Row</TableCell>
                          <TableCell>Failure Reason</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {importResult.failed.map((row) => (
                          <TableRow key={`failed-${row.rowNumber}`}>
                            <TableCell>{row.rowNumber}</TableCell>
                            <TableCell>{row.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            )}
          </Stack>
        )}

        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
          {activeStep > 0 && !importing && (
            <Button variant="outlined" onClick={handleBack}>
              Back
            </Button>
          )}
          {(uploadedFile || importResult) && (
            <Button variant="outlined" onClick={handleReset}>
              Start New Import
            </Button>
          )}
          {uploadedFile && !parseError && !importing && !importResult && (
            <Button variant="contained" onClick={handleNext}>
              {activeStep === 3 ? 'Run Import' : 'Next'}
            </Button>
          )}
        </Stack>
      </Card>
    </Box>
  );
}
