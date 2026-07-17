'use client';

import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import axiosInstance from 'src/utils/axios';

function PrintOverlay({ title, children, onClose }) {
  const [settings, setSettings] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    axiosInstance
      .get('/api/acc-settings/1/')
      .then((res) => setSettings(res.data))
      .catch(() => {});

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const alignment = settings?.print_header_alignment || 'left';
  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

  const overlay = (
    <>
      <style>{`
        @media screen {
          #print-overlay-portal {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: white;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          #print-overlay-portal .print-topbar {
            flex-shrink: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 32px;
            border-bottom: 1px solid #eee;
          }
          #print-overlay-portal .print-scroll {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 24px 32px;
          }
        }

        @media print {
          body > * { display: none !important; }
          body > #print-overlay-portal { display: block !important; }
          #print-overlay-portal .print-topbar { display: none !important; }
          #print-overlay-portal .print-scroll {
            display: block !important;
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
          }

          /* Force tables to fit page width */
          #print-overlay-portal table {
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }
          #print-overlay-portal th,
          #print-overlay-portal td {
            padding: 4px 6px !important;
            word-break: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }

          /* Landscape for wide tables */
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      <div id="print-overlay-portal">
        {/* Top bar — screen only */}
        <div className="print-topbar">
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
            <Button variant="contained" onClick={() => window.print()}>
              Print
            </Button>
          </Stack>
        </div>

        {/* Content */}
        <div className="print-scroll">
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: justifyMap[alignment],
                alignItems: 'center',
                gap: 16,
              }}
            >
              {settings?.print_logo_url && (
                <img src={settings.print_logo_url} alt="logo" style={{ height: 60 }} />
              )}
              <div style={{ textAlign: alignment }}>
                {settings?.print_company_name && (
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      color: settings?.print_primary_color || '#000',
                    }}
                  >
                    {settings.print_company_name}
                  </div>
                )}
                {settings?.print_company_tagline && (
                  <div style={{ fontSize: 13 }}>{settings.print_company_tagline}</div>
                )}
                {settings?.print_company_address && (
                  <div style={{ fontSize: 12 }}>{settings.print_company_address}</div>
                )}
                {(settings?.print_company_phone || settings?.print_company_email) && (
                  <div style={{ fontSize: 12 }}>
                    {settings.print_company_phone} {settings.print_company_email}
                  </div>
                )}
                {settings?.print_company_website && (
                  <div style={{ fontSize: 12 }}>{settings.print_company_website}</div>
                )}
              </div>
            </div>
            {settings?.print_show_divider !== false && (
              <div
                style={{
                  borderBottom: `2px solid ${settings?.print_accent_color || '#ccc'}`,
                  marginTop: 16,
                }}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: 18, marginTop: 16 }}>{title}</div>
          </div>

          {/* Page content */}
          <div style={{ marginBottom: 48 }}>{children}</div>

          {/* Footer */}
          <div
            style={{
              borderTop: `1px solid ${settings?.print_accent_color || '#ccc'}`,
              paddingTop: 16,
              marginTop: 32,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>{settings?.print_footer_left || ''}</span>
              <span>{settings?.print_footer_center || ''}</span>
              <span>
                {settings?.print_footer_right || ''}
                {settings?.print_show_date !== false && ` — ${new Date().toLocaleDateString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}

export default PrintOverlay;
