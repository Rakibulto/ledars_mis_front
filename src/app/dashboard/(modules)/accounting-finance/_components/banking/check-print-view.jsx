'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { toast } from 'sonner';
import { Iconify } from 'src/components/iconify';

const STORAGE_KEY = 'bank_cheque_print_offsets';
const CHEQUE_WIDTH = 920;
const CHEQUE_HEIGHT = 340;

// ── Amount helpers ───────────────────────────────────────────────────────────
function formatIndianAmount(num) {
  const n = Number(num) || 0;
  const [intPart, dec] = n.toFixed(2).split('.');
  if (intPart.length <= 3) return `${intPart}.${dec}`;
  const lastThree = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${grouped},${lastThree}.${dec}`;
}

function numberToWords(amount) {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertChunk = (n) => {
    if (n === 0) return '';
    let out = '';
    if (n >= 100) {
      out += `${ones[Math.floor(n / 100)]} Hundred`;
      n %= 100;
      if (n > 0) out += ' And ';
    }
    if (n >= 20) {
      out += tens[Math.floor(n / 10)];
      n %= 10;
      if (n > 0) out += ` ${ones[n]}`;
    } else if (n > 0) {
      out += ones[n];
    }
    return out.trim();
  };

  const total = Number(amount) || 0;
  const whole = Math.floor(total);
  const paisa = Math.round((total - whole) * 100);

  if (whole === 0 && paisa === 0) return 'Zero Only';

  let words = '';
  let n = whole;

  if (n >= 10000000) {
    words += `${convertChunk(Math.floor(n / 10000000))} Crore `;
    n %= 10000000;
  }
  if (n >= 100000) {
    words += `${convertChunk(Math.floor(n / 100000))} Lac `;
    n %= 100000;
  }
  if (n >= 1000) {
    words += `${convertChunk(Math.floor(n / 1000))} Thousand `;
    n %= 1000;
  }
  if (n > 0) words += `${convertChunk(n)} `;

  words = words.trim();
  if (paisa > 0) {
    words += words ? ' And ' : '';
    words += `${convertChunk(paisa)} Paisa`;
  }

  return `${words} Only`.replace(/\s+/g, ' ').trim();
}

function splitAmountInWords(text, maxFirstLine = 52) {
  if (text.length <= maxFirstLine) return { line1: text, line2: '' };
  const mid = Math.floor(text.length / 2);
  let breakAt = text.lastIndexOf(' ', mid);
  if (breakAt < 20) breakAt = text.indexOf(' ', mid);
  if (breakAt < 0) return { line1: text, line2: '' };
  return { line1: text.slice(0, breakAt).trim(), line2: text.slice(breakAt).trim() };
}

function formatChequeDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ── Default field positions (px from top-left of cheque canvas) ──────────────
const DEFAULT_OFFSETS = {
  date: { top: 42, left: 720, fontSize: 14 },
  checkNumber: { top: 88, left: 95, fontSize: 11 },
  payee: { top: 118, left: 95, fontSize: 16 },
  payeePad: { top: 118, left: 650, fontSize: 14 },
  amountWordsLine1: { top: 168, left: 95, fontSize: 14 },
  amountWordsLine2: { top: 188, left: 95, fontSize: 14 },
  amountFigures: { top: 178, left: 720, fontSize: 15 },
  memo: { top: 248, left: 95, fontSize: 11 },
  signatory: { top: 295, left: 620, fontSize: 11 },
};

const FIELD_LABELS = {
  date: 'Date',
  checkNumber: 'Cheque Number',
  payee: 'Payee Name',
  payeePad: 'Payee Pad (XXXX)',
  amountWordsLine1: 'Amount in Words (Line 1)',
  amountWordsLine2: 'Amount in Words (Line 2)',
  amountFigures: 'Amount in Figures',
  memo: 'Memo',
  signatory: 'Authorized Signatory',
};

function mergeOffsets(saved) {
  const merged = {};
  Object.keys(DEFAULT_OFFSETS).forEach((key) => {
    merged[key] = { ...DEFAULT_OFFSETS[key], ...(saved?.[key] || {}) };
  });
  return merged;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPrintableFieldsHtml(dataValues, offsets) {
  return Object.entries(offsets)
    .map(([key, pos]) => {
      const value = dataValues[key];
      if (!value) return '';
      return `<div class="field" style="top:${pos.top}px;left:${pos.left}px;font-size:${pos.fontSize || 14}px;">${escapeHtml(value)}</div>`;
    })
    .join('');
}

// ── Preview-only cheque template guide (not printed) ─────────────────────────
function ChequeTemplateGuide({ check, account }) {
  const bankDisplayName = (check?.bankName || account?.bankName || account?.name || 'BANK')
    .toUpperCase()
    .replace(/\s+BANK$/i, '');
  const bankFirst = bankDisplayName.split(' ')[0];
  const bankRest = bankDisplayName.includes(' ')
    ? bankDisplayName.split(' ').slice(1).join(' ')
    : 'BANK';

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#bbb',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          transform: 'rotate(-12deg)',
          borderTop: '1px dashed #ccc',
          borderBottom: '1px dashed #ccc',
          px: 1,
          py: 0.25,
        }}
      >
        <Typography sx={{ fontSize: 9, fontWeight: 800, color: '#ccc' }}>A/C PAYEE ONLY</Typography>
      </Box>

      <Stack direction="row" justifyContent="space-between" sx={{ p: 2.5, pt: 3 }}>
        <Box sx={{ pl: 8 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 900, color: '#e57373', lineHeight: 1 }}>
            {bankFirst}
            <Typography component="span" sx={{ fontSize: 22, fontWeight: 900, color: '#81c784', ml: 0.5 }}>
              {bankRest}
            </Typography>
          </Typography>
          <Typography sx={{ fontSize: 10, color: '#ccc' }}>Payable at any branch in Bangladesh</Typography>
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#ccc', alignSelf: 'flex-start' }}>
          DATE
        </Typography>
      </Stack>

      <Box sx={{ px: 2.5 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#ccc', mb: 4 }}>Pay To</Typography>
        <Box sx={{ borderBottom: '1px dashed #ccc', mb: 3 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#ccc', mb: 1 }}>The Sum of Taka</Typography>
        <Box sx={{ borderBottom: '1px dashed #ccc', mb: 1 }} />
        <Box sx={{ borderBottom: '1px dashed #ccc', mb: 2, width: '65%' }} />
        <Box
          sx={{
            position: 'absolute',
            right: 24,
            top: 155,
            width: 180,
            height: 44,
            border: '1px dashed #ccc',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            right: 24,
            bottom: 28,
            width: 260,
            borderBottom: '1px dashed #ccc',
          }}
        />
      </Box>
    </Box>
  );
}

function PositionedField({ fieldKey, value, pos, isAdjusting, isSelected, onSelect }) {
  if (!value && !isAdjusting) return null;

  return (
    <Box
      onClick={() => isAdjusting && onSelect(fieldKey)}
      sx={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: pos.fontSize || 14,
        fontWeight: 700,
        color: '#111',
        whiteSpace: 'nowrap',
        maxWidth: CHEQUE_WIDTH - pos.left - 8,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: isAdjusting ? 'pointer' : 'default',
        border: isAdjusting && isSelected ? '1px dashed #ff5630' : 'none',
        bgcolor: isAdjusting && isSelected ? 'rgba(255,86,48,0.08)' : 'transparent',
        px: isAdjusting && isSelected ? 0.5 : 0,
        borderRadius: 0.5,
        zIndex: isSelected ? 2 : 1,
      }}
    >
      {value || (isAdjusting ? `[${FIELD_LABELS[fieldKey]}]` : '')}
    </Box>
  );
}

export default function CheckPrintView({ check, account, onBack, onMarkPrinted }) {
  const [offsets, setOffsets] = useState(DEFAULT_OFFSETS);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [selectedField, setSelectedField] = useState('payee');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setOffsets(mergeOffsets(JSON.parse(saved)));
    } catch (e) {
      console.error('Failed to load cheque offsets:', e);
    }
  }, []);

  const dataValues = useMemo(() => {
    const amount = parseFloat(check?.amount || 0);
    const amountWords = numberToWords(amount);
    const { line1, line2 } = splitAmountInWords(amountWords);
    const payeeLen = check?.payee?.length || 0;

    return {
      date: formatChequeDate(check?.issueDate),
      checkNumber: check?.checkNumber ? `Cheque No. ${check.checkNumber}` : '',
      payee: check?.payee ? `**${check.payee}**` : '',
      payeePad: 'X'.repeat(Math.max(6, 24 - payeeLen)),
      amountWordsLine1: line1 ? `**${line1}${line2 ? '' : '**'}` : '',
      amountWordsLine2: line2 ? `${line2}**` : '',
      amountFigures: amount ? `*** ${formatIndianAmount(amount)}/-` : '',
      memo: check?.memo ? `Memo: ${check.memo}` : '',
      signatory: check?.owner ? `Authorized: ${check.owner}` : '',
    };
  }, [check]);

  const handleSaveOffsets = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offsets));
    toast.success('Cheque positions saved');
    setIsAdjusting(false);
  };

  const handleResetOffsets = () => {
    setOffsets(DEFAULT_OFFSETS);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Positions reset to defaults');
  };

  const handleAdjust = (axis, amount) => {
    setOffsets((prev) => ({
      ...prev,
      [selectedField]: {
        ...prev[selectedField],
        [axis]: Math.max(0, (prev[selectedField]?.[axis] || 0) + amount),
      },
    }));
  };

  const printChequeOnly = useCallback(() => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute(
      'style',
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
    );
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      toast.error('Unable to open print view');
      document.body.removeChild(iframe);
      return;
    }

    const fieldsHtml = buildPrintableFieldsHtml(dataValues, offsets);

    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Cheque ${escapeHtml(check?.checkNumber || '')}</title>
    <style>
      @page { size: ${CHEQUE_WIDTH}px ${CHEQUE_HEIGHT}px; margin: 0; }
      html, body { margin: 0; padding: 0; width: ${CHEQUE_WIDTH}px; height: ${CHEQUE_HEIGHT}px; }
      .cheque-canvas {
        position: relative;
        width: ${CHEQUE_WIDTH}px;
        height: ${CHEQUE_HEIGHT}px;
        background: #fff;
        overflow: hidden;
      }
      .field {
        position: absolute;
        font-family: Arial, Helvetica, sans-serif;
        font-weight: 700;
        color: #000;
        white-space: nowrap;
        line-height: 1.2;
      }
    </style>
  </head>
  <body>
    <div class="cheque-canvas">${fieldsHtml}</div>
  </body>
</html>`);
    doc.close();

    const cleanup = () => {
      if (iframe.parentNode) document.body.removeChild(iframe);
    };

    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      toast.error('Unable to open print view');
      return;
    }

    const triggerPrint = () => {
      win.focus();
      win.print();
    };

    win.onafterprint = () => {
      cleanup();
      if (onMarkPrinted && check?.id) onMarkPrinted(check.id);
    };

    // Allow layout to settle before opening the print dialog
    window.setTimeout(triggerPrint, 300);

    // Fallback cleanup if onafterprint does not fire
    window.setTimeout(cleanup, 60000);
  }, [check?.checkNumber, check?.id, dataValues, offsets, onMarkPrinted]);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        bgcolor: '#f4f6f8',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar — never printed (parent uses iframe print) */}
      <Box
        sx={{
          height: 64,
          bgcolor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton onClick={onBack}>
            <Iconify icon="solar:arrow-left-bold" />
          </IconButton>
          <Button
            variant="contained"
            color="success"
            startIcon={<Iconify icon="solar:printer-bold" />}
            onClick={printChequeOnly}
            sx={{
              bgcolor: '#00a76f',
              '&:hover': { bgcolor: '#008f58' },
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: 1.5,
              px: 2.5,
            }}
          >
            Print Cheque
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:settings-bold" />}
            onClick={() => setIsAdjusting((v) => !v)}
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 1.5 }}
          >
            Adjust Positions
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          Align fields on pre-printed cheque · Only cheque data is sent to printer
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Adjustment sidebar */}
        {isAdjusting && (
          <Box
            sx={{
              width: 320,
              bgcolor: 'white',
              borderRight: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              p: 2.5,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Position Adjustment
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2.5} sx={{ flex: 1, overflowY: 'auto' }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Select field"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
              >
                {Object.entries(FIELD_LABELS).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1, bgcolor: 'background.neutral', p: 1, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Top (Y)</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {offsets[selectedField]?.top}px
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, bgcolor: 'background.neutral', p: 1, borderRadius: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Left (X)</Typography>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {offsets[selectedField]?.left}px
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={1.5} alignItems="center">
                <IconButton onClick={() => handleAdjust('top', -1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Iconify icon="solar:arrow-up-bold" />
                </IconButton>
                <Stack direction="row" spacing={4}>
                  <IconButton onClick={() => handleAdjust('left', -1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Iconify icon="solar:arrow-left-bold" />
                  </IconButton>
                  <IconButton onClick={() => handleAdjust('left', 1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <Iconify icon="solar:arrow-right-bold" />
                  </IconButton>
                </Stack>
                <IconButton onClick={() => handleAdjust('top', 1)} sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Iconify icon="solar:arrow-down-bold" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" fullWidth onClick={() => handleAdjust('top', -5)}>
                  Up 5
                </Button>
                <Button size="small" variant="outlined" fullWidth onClick={() => handleAdjust('top', 5)}>
                  Down 5
                </Button>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" fullWidth onClick={() => handleAdjust('left', -5)}>
                  Left 5
                </Button>
                <Button size="small" variant="outlined" fullWidth onClick={() => handleAdjust('left', 5)}>
                  Right 5
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Button variant="contained" fullWidth onClick={handleSaveOffsets} startIcon={<Iconify icon="solar:check-circle-bold" />}>
                Save Positions
              </Button>
              <Button variant="outlined" color="error" fullWidth onClick={handleResetOffsets} startIcon={<Iconify icon="solar:restart-bold" />}>
                Reset to Default
              </Button>
            </Stack>
          </Box>
        )}

        {/* Preview area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 4,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          <Box
            sx={{
              width: CHEQUE_WIDTH,
              height: CHEQUE_HEIGHT,
              position: 'relative',
              bgcolor: '#fff',
              border: '2px solid #1a1a1a',
              borderRadius: 0.5,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            <ChequeTemplateGuide check={check} account={account} />

            {Object.entries(offsets).map(([key, pos]) => (
              <PositionedField
                key={key}
                fieldKey={key}
                value={dataValues[key]}
                pos={pos}
                isAdjusting={isAdjusting}
                isSelected={selectedField === key}
                onSelect={setSelectedField}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
