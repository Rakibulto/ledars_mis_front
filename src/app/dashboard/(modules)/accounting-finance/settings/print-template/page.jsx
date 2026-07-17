'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import axiosInstance from 'src/utils/axios';

import { usePrintSettings } from 'src/app/dashboard/(modules)/accounting-finance/_hooks/use-print-settings';

export default function Page() {
  const { printSettings, loading } = usePrintSettings();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');

  useEffect(() => {
    if (printSettings) {
      setForm(printSettings);
      setLogoPreviewUrl(printSettings.print_logo_url || '');
    }
  }, [printSettings]);

  useEffect(() => {
    if (!(form.print_logo instanceof File)) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.print_logo);
    setLogoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [form.print_logo]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setForm((c) => ({ ...c, print_logo: file }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach((k) => {
        const v = form[k];
        if (v === null || typeof v === 'undefined') return;
        if (k === 'print_logo' && v instanceof File) {
          fd.append('print_logo', v);
        } else if (typeof v === 'boolean') {
          fd.append(k, v ? 'true' : 'false');
        } else {
          fd.append(k, v);
        }
      });
      await axiosInstance.patch('/api/acc-settings/1/', fd);
      toast.success('Print template saved');
    } catch (err) {
      console.error('Save error:', err?.response?.data || err?.message || err);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
        Print Template
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Header
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Input type="file" onChange={handleFileChange} />
                <TextField
                  fullWidth
                  label="Company name"
                  sx={{ mt: 2 }}
                  value={form.print_company_name || ''}
                  onChange={(e) => setForm((c) => ({ ...c, print_company_name: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Tagline"
                  sx={{ mt: 2 }}
                  value={form.print_company_tagline || ''}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, print_company_tagline: e.target.value }))
                  }
                />
                <TextField
                  fullWidth
                  multiline
                  label="Address"
                  sx={{ mt: 2 }}
                  value={form.print_company_address || ''}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, print_company_address: e.target.value }))
                  }
                />
                <TextField
                  fullWidth
                  label="Phone"
                  sx={{ mt: 2 }}
                  value={form.print_company_phone || ''}
                  onChange={(e) => setForm((c) => ({ ...c, print_company_phone: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Email"
                  sx={{ mt: 2 }}
                  value={form.print_company_email || ''}
                  onChange={(e) => setForm((c) => ({ ...c, print_company_email: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Website"
                  sx={{ mt: 2 }}
                  value={form.print_company_website || ''}
                  onChange={(e) =>
                    setForm((c) => ({ ...c, print_company_website: e.target.value }))
                  }
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Header alignment</Typography>
                  <Button
                    variant={form.print_header_alignment === 'left' ? 'contained' : 'outlined'}
                    onClick={() => setForm((c) => ({ ...c, print_header_alignment: 'left' }))}
                    sx={{ mr: 1 }}
                  >
                    Left
                  </Button>
                  <Button
                    variant={form.print_header_alignment === 'center' ? 'contained' : 'outlined'}
                    onClick={() => setForm((c) => ({ ...c, print_header_alignment: 'center' }))}
                    sx={{ mr: 1 }}
                  >
                    Center
                  </Button>
                  <Button
                    variant={form.print_header_alignment === 'right' ? 'contained' : 'outlined'}
                    onClick={() => setForm((c) => ({ ...c, print_header_alignment: 'right' }))}
                  >
                    Right
                  </Button>
                </Box>
              </Box>

              <Typography variant="h6" fontWeight={700} sx={{ mt: 3 }}>
                Colors & Style
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Primary color"
                  sx={{ mt: 1 }}
                  value={form.print_primary_color || '#000000'}
                  onChange={(e) => setForm((c) => ({ ...c, print_primary_color: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Accent color"
                  sx={{ mt: 1 }}
                  value={form.print_accent_color || '#cccccc'}
                  onChange={(e) => setForm((c) => ({ ...c, print_accent_color: e.target.value }))}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.print_show_divider ?? true}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, print_show_divider: e.target.checked }))
                      }
                    />
                  }
                  label="Show divider"
                />
              </Box>

              <Typography variant="h6" fontWeight={700} sx={{ mt: 3 }}>
                Footer
              </Typography>
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Footer left"
                  sx={{ mt: 1 }}
                  value={form.print_footer_left || ''}
                  onChange={(e) => setForm((c) => ({ ...c, print_footer_left: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Footer center"
                  sx={{ mt: 1 }}
                  value={form.print_footer_center || ''}
                  onChange={(e) => setForm((c) => ({ ...c, print_footer_center: e.target.value }))}
                />
                <TextField
                  fullWidth
                  label="Footer right"
                  sx={{ mt: 1 }}
                  value={form.print_footer_right || ''}
                  onChange={(e) => setForm((c) => ({ ...c, print_footer_right: e.target.value }))}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.print_show_page_numbers ?? true}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, print_show_page_numbers: e.target.checked }))
                      }
                    />
                  }
                  label="Show page numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.print_show_date ?? true}
                      onChange={(e) =>
                        setForm((c) => ({ ...c, print_show_date: e.target.checked }))
                      }
                    />
                  }
                  label="Show print date"
                />
              </Box>

              <Box sx={{ mt: 3 }}>
                <Button type="button" variant="contained" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Live Preview
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  border: '1px solid #e0e0e0',
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    width: '210mm',
                    height: '297mm',
                    transform: 'scale(0.6)',
                    transformOrigin: 'top left',
                    boxShadow: 3,
                    bgcolor: '#fff',
                  }}
                >
                  <Box sx={{ p: 1 }}>
                    <Box
                      sx={{
                        mb: 1,
                        textAlign: form.print_header_alignment || 'left',
                        color: form.print_primary_color || '#000',
                      }}
                    >
                      {logoPreviewUrl ? (
                        <img
                          src={logoPreviewUrl}
                          alt="logo"
                          style={{ height: 48, marginRight: 8 }}
                        />
                      ) : null}
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {form.print_company_name || 'Company name'}
                      </Typography>
                      <Typography variant="body2">{form.print_company_tagline}</Typography>
                      <Typography variant="caption">{form.print_company_address}</Typography>
                      {(form.print_company_phone || form.print_company_email) && (
                        <Typography variant="caption">
                          {form.print_company_phone} {form.print_company_email}
                        </Typography>
                      )}
                      {form.print_company_website && (
                        <Typography variant="caption">{form.print_company_website}</Typography>
                      )}
                      <Box sx={{ mt: 1 }}>
                        {(form.print_show_divider ?? true) ? (
                          <hr
                            style={{ border: `1px solid ${form.print_accent_color || '#ccc'}` }}
                          />
                        ) : null}
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6">Document content appears here</Typography>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Use the controls on the left to change header, footer, and print styling.
                        Click browser print to see the full printed header and footer.
                      </Typography>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Tip: In the browser print dialog, uncheck Headers and footers to avoid
                        duplicate headers on your printed documents.
                      </Alert>
                    </Box>

                    <Box
                      sx={{
                        mt: 4,
                        borderTop: `1px solid ${form.print_accent_color || '#ccc'}`,
                        pt: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>{form.print_footer_left}</div>
                        <div>{form.print_footer_center}</div>
                        <div>{form.print_footer_right}</div>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
