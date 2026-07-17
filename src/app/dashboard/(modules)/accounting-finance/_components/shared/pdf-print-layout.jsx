'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Text,
  View,
  Image,
  Document,
  PDFViewer,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer';

import Button from '@mui/material/Button';

import axiosInstance from 'src/utils/axios';

// ── PDF Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  header: {
    marginBottom: 8,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  logo: {
    height: 40,
    width: 'auto',
    marginBottom: 4,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  tagline: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  companyMeta: {
    fontSize: 9,
    color: '#555',
    marginBottom: 1,
  },
  divider: {
    borderBottomWidth: 1,
    marginTop: 6,
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
  },
  footerLine: {
    borderBottomWidth: 0.5,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#777',
  },
  // Table helpers
  tableContainer: {
    width: '100%',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
  },
  theadRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
  },
  th: {
    flex: 1,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    padding: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#dddddd',
  },
  td: {
    flex: 1,
    fontSize: 8,
    padding: 4,
    borderRightWidth: 0.5,
    borderRightColor: '#dddddd',
  },
  sectionHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 6,
    color: '#333333',
  },
  plainText: {
    fontSize: 8,
  },
  divBlock: {
    marginTop: 12,
    marginBottom: 6,
  },
});

// ── Recursive HTML → PDF converter ──────────────────────────────────────────

function isInThead(node) {
  // Walk context is passed as a second arg through the recursion
  return false; // We handle thead/tbody at the table level
}

function getTextContent(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join('');
  if (node && node.props && node.props.children !== undefined) {
    return getTextContent(node.props.children);
  }
  return '';
}

function renderChildrenToPdf(node, index = 0, context = {}) {
  if (node === null || node === undefined || typeof node === 'boolean') return null;

  if (typeof node === 'string') {
    const trimmed = node.trim();
    if (!trimmed) return null;
    return (
      <Text key={index} style={styles.plainText}>
        {trimmed}
      </Text>
    );
  }

  if (typeof node === 'number') {
    return (
      <Text key={index} style={styles.plainText}>
        {String(node)}
      </Text>
    );
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => renderChildrenToPdf(child, i, context));
  }

  if (!node || typeof node !== 'object' || !node.type) return null;

  const { type, props = {} } = node;
  const { children } = props;
  const elType = typeof type === 'string' ? type.toLowerCase() : null;

  // ── table ──────────────────────────────────────────────
  if (elType === 'table') {
    return (
      <View key={index} style={styles.tableContainer}>
        {renderChildrenToPdf(children, 0, { ...context, inTable: true })}
      </View>
    );
  }

  // ── thead ──────────────────────────────────────────────
  if (elType === 'thead') {
    return (
      <View key={index}>{renderChildrenToPdf(children, 0, { ...context, inThead: true })}</View>
    );
  }

  // ── tbody ──────────────────────────────────────────────
  if (elType === 'tbody') {
    return (
      <View key={index}>{renderChildrenToPdf(children, 0, { ...context, inThead: false })}</View>
    );
  }

  // ── tr ─────────────────────────────────────────────────
  if (elType === 'tr') {
    const rowStyle = context.inThead ? styles.theadRow : styles.row;
    const childCtx = context.inThead ? { ...context, inTh: true } : { ...context, inTh: false };
    return (
      <View key={index} style={rowStyle}>
        {renderChildrenToPdf(children, 0, childCtx)}
      </View>
    );
  }

  // ── th ─────────────────────────────────────────────────
  if (elType === 'th') {
    return (
      <View key={index} style={styles.th}>
        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
          {getTextContent(children)}
        </Text>
      </View>
    );
  }

  // ── td ─────────────────────────────────────────────────
  if (elType === 'td') {
    return (
      <View key={index} style={styles.td}>
        <Text style={styles.plainText}>{getTextContent(children)}</Text>
      </View>
    );
  }

  // ── div ────────────────────────────────────────────────
  if (elType === 'div') {
    const inlineStyle = props.style || {};
    const isBold =
      inlineStyle.fontWeight === 700 ||
      inlineStyle.fontWeight === '700' ||
      inlineStyle.fontWeight === 'bold';

    if (isBold) {
      // Section heading div
      return (
        <Text key={index} style={styles.sectionHeading}>
          {getTextContent(children)}
        </Text>
      );
    }

    // Regular div — recurse
    return (
      <View key={index} style={styles.divBlock}>
        {renderChildrenToPdf(children, 0, context)}
      </View>
    );
  }

  // ── span / p / li / ul / ol ────────────────────────────
  if (
    elType === 'span' ||
    elType === 'p' ||
    elType === 'li' ||
    elType === 'ul' ||
    elType === 'ol'
  ) {
    return (
      <Text key={index} style={styles.plainText}>
        {getTextContent(children)}
      </Text>
    );
  }

  // ── strong / b ─────────────────────────────────────────
  if (elType === 'strong' || elType === 'b') {
    return (
      <Text key={index} style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
        {getTextContent(children)}
      </Text>
    );
  }

  // ── Unknown element — recurse into children ────────────
  if (children !== undefined && children !== null) {
    return renderChildrenToPdf(children, index, context);
  }

  return null;
}

// ── PDF Document ─────────────────────────────────────────────────────────────

function PdfDocument({ title, children, settings }) {
  const alignment = settings?.print_header_alignment || 'left';
  const alignMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };
  const primaryColor = settings?.print_primary_color || '#111111';
  const accentColor = settings?.print_accent_color || '#cccccc';
  const showDivider = settings?.print_show_divider !== false;
  const showDate = settings?.print_show_date !== false;

  const footerLeft = settings?.print_footer_left || '';
  const footerCenter = settings?.print_footer_center || '';
  const footerRight = settings?.print_footer_right || '';
  const logoUrl = settings?.print_logo_url || null;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* ── HEADER (fixed) ─────────────────────────── */}
        <View style={[styles.header, { alignItems: alignMap[alignment] || 'flex-start' }]} fixed>
          {logoUrl ? <Image style={styles.logo} src={logoUrl} /> : null}
          {settings?.print_company_name ? (
            <Text style={[styles.companyName, { color: primaryColor }]}>
              {settings.print_company_name}
            </Text>
          ) : null}
          {settings?.print_company_tagline ? (
            <Text style={styles.tagline}>{settings.print_company_tagline}</Text>
          ) : null}
          {settings?.print_company_address ? (
            <Text style={styles.companyMeta}>{settings.print_company_address}</Text>
          ) : null}
          {settings?.print_company_phone || settings?.print_company_email ? (
            <Text style={styles.companyMeta}>
              {[settings.print_company_phone, settings.print_company_email]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
          ) : null}
          {settings?.print_company_website ? (
            <Text style={styles.companyMeta}>{settings.print_company_website}</Text>
          ) : null}
          {showDivider ? (
            <View style={[styles.divider, { borderBottomColor: accentColor, width: '100%' }]} />
          ) : null}
          <Text style={styles.docTitle}>{title || ''}</Text>
        </View>

        {/* ── CONTENT ────────────────────────────────── */}
        <View style={styles.content}>{renderChildrenToPdf(children)}</View>

        {/* ── FOOTER (fixed) ─────────────────────────── */}
        <View style={styles.footer} fixed>
          <View style={[styles.footerLine, { borderBottomColor: accentColor }]} />
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{footerLeft}</Text>
            <Text style={styles.footerText}>{footerCenter}</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) =>
                [
                  footerRight,
                  showDate ? new Date().toLocaleDateString() : '',
                  `Page ${pageNumber} of ${totalPages}`,
                ]
                  .filter(Boolean)
                  .join('  ·  ')
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PdfPrintLayout({ title, children, onClose }) {
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

  if (!mounted) return null;

  const doc = (
    <PdfDocument title={title} settings={settings}>
      {children}
    </PdfDocument>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'white',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          borderBottom: '1px solid #eee',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 18 }}>{title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
          <PDFDownloadLink document={doc} fileName={`${title || 'document'}.pdf`}>
            {({ loading }) => (
              <Button variant="contained" disabled={loading}>
                {loading ? 'Preparing...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {/* PDF Preview */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <PDFViewer width="100%" height="100%" showToolbar>
          {doc}
        </PDFViewer>
      </div>
    </div>
  );
}
