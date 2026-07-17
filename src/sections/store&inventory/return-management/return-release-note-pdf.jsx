import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const RETURN_TYPE_LABELS = {
  project_return: 'Project Item Return',
  internal_transfer_return: 'Internal Transfer Return',
};

const SOURCE_DOC_LABELS = {
  GIN: 'Goods Issue Note (GIN)',
  INTERNAL_TRANSFER: 'Internal Transfer',
};

function fmt(d) {
  if (!d) return 'N/A';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(d));
}

function fmtDT(d) {
  if (!d) return 'N/A';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(d)
  );
}

function val(v, fb = 'N/A') {
  if (v === 0 || v === '0') return '0';
  return v ? String(v) : fb;
}

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    lineHeight: 1.45,
    padding: '32px 28px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  // Header
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  headerRight: {
    width: '38%',
    alignItems: 'flex-end',
  },
  metaBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 4,
    padding: '6px 10px',
    alignItems: 'flex-end',
  },
  returnNumber: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  returnDate: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 9,
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  // Section title
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  // Office cards
  officeRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 8,
  },
  officeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#F8FAFC',
  },
  officeCardLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 3,
  },
  officeCardValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  arrowBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  arrowText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  // Info grid
  infoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  infoCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 7,
    backgroundColor: '#F8FAFC',
  },
  infoCellLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 2,
  },
  infoCellValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Remarks box
  remarksBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    minHeight: 30,
    marginBottom: 4,
    backgroundColor: '#FAFAFA',
  },
  remarksText: {
    fontSize: 9,
    color: '#374151',
  },
  // Table
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#1E3A5F',
  },
  cell: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    fontSize: 9,
  },
  cellHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  noRightBorder: { borderRightWidth: 0 },
  noBottomBorder: { borderBottomWidth: 0 },
  rightText: { textAlign: 'right' },
  centerText: { textAlign: 'center' },
  // Column widths
  colSl: { width: '6%' },
  colCode: { width: '12%' },
  colName: { width: '36%' },
  colUnit: { width: '10%' },
  colQty: { width: '12%' },
  colRemarks: { width: '24%' },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    marginBottom: 10,
    gap: 6,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 4,
    padding: '5px 12px',
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 8,
    color: '#1E40AF',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  // Signatures
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
  },
  signatureName: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  // Footer
  footer: {
    marginTop: 'auto',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94A3B8',
  },
  // Transport section
  transportSection: {
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 4,
    backgroundColor: '#F0F9FF',
  },
  transportSectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  transportRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  transportField: {
    flex: 1,
    minWidth: '30%',
  },
  transportLabel: {
    fontSize: 8,
    color: '#0369A1',
    marginBottom: 2,
  },
  transportValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0C4A6E',
  },
  transportAddressField: {
    flex: 2,
    minWidth: '60%',
  },
});

export default function ReturnReleaseNotePDF({ doc }) {
  const lines = doc?.lines || [];
  const uniqueSrcDocs = [...new Set(lines.map((l) => l.source_document_number).filter(Boolean))];
  const srcDocString = uniqueSrcDocs.join(', ') || '—';
  const totalReturnQty = lines.reduce((s, l) => s + Number(l.return_quantity || 0), 0);
  const returnTypeName = RETURN_TYPE_LABELS[doc?.return_type] || doc?.return_type || 'Return';
  const isGIN = doc?.source_document_type === 'GIN';
  const sourcDocTypeName =
    SOURCE_DOC_LABELS[doc?.source_document_type] || doc?.source_document_type || '—';

  // Use server-resolved location names (works for both new and existing records)
  const displaySourceLocation =
    doc?.resolved_source_location || doc?.source_location || srcDocString;
  const displayDestLocation =
    doc?.resolved_destination_location || doc?.destination_location || srcDocString;
  const displayPreparedBy = doc?.created_by_name || '—';

  // Transport info
  const hasTransport = !!doc?.transport_person;

  // Even rows slightly tinted for readability
  const getRowBg = (idx) => (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC');

  return (
    <Document title={`${doc?.return_number || 'Return'} — Release Note`}>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>Ledars Organization</Text>
            <Text style={styles.docTitle}>Return Release Note</Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              Official transit document for returned goods
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.metaBadge}>
              <Text style={styles.returnNumber}>{val(doc?.return_number)}</Text>
              <Text style={styles.returnDate}>Date: {fmt(doc?.return_date)}</Text>
              <Text style={styles.returnDate}>Type: {returnTypeName}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>● {doc?.status || 'In Transit'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Transport / Courier Information ── */}
        {hasTransport && (
          <>
            <Text style={styles.sectionTitle}>Transport / Courier Information</Text>
            <View style={styles.transportSection}>
              <View style={styles.transportRow}>
                <View style={styles.transportField}>
                  <Text style={styles.transportLabel}>TRANSPORT PERSON / COURIER</Text>
                  <Text style={styles.transportValue}>{val(doc.transport_person)}</Text>
                </View>
                <View style={styles.transportField}>
                  <Text style={styles.transportLabel}>PHONE NUMBER</Text>
                  <Text style={styles.transportValue}>{val(doc.transport_phone)}</Text>
                </View>
                <View style={styles.transportField}>
                  <Text style={styles.transportLabel}>DISPATCH DATE</Text>
                  <Text style={styles.transportValue}>{fmt(doc.dispatch_date)}</Text>
                </View>
              </View>
              <View style={styles.transportRow}>
                <View style={styles.transportAddressField}>
                  <Text style={styles.transportLabel}>ADDRESS</Text>
                  <Text style={styles.transportValue}>{val(doc.transport_address)}</Text>
                </View>
                {doc.vehicle_number && (
                  <View style={styles.transportField}>
                    <Text style={styles.transportLabel}>VEHICLE NUMBER</Text>
                    <Text style={styles.transportValue}>{doc.vehicle_number}</Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {/* ── Office Information ── */}
        <Text style={styles.sectionTitle}>Office Information</Text>
        <View style={styles.officeRow}>
          <View style={styles.officeCard}>
            <Text style={styles.officeCardLabel}>RETURNING FROM (Current Location)</Text>
            <Text style={styles.officeCardValue}>{displaySourceLocation}</Text>
            {doc?.project && (
              <Text style={{ fontSize: 8, color: '#64748B', marginTop: 2 }}>
                Project: {doc.project}
              </Text>
            )}
          </View>
          <View style={styles.arrowBox}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.officeCard}>
            <Text style={styles.officeCardLabel}>RETURNING TO (Original Source)</Text>
            <Text style={styles.officeCardValue}>{displayDestLocation}</Text>
          </View>
        </View>

        {/* ── Source Document Information ── */}
        <Text style={styles.sectionTitle}>Source Document Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>ORIGINAL DOCUMENT TYPE</Text>
            <Text style={styles.infoCellValue}>{sourcDocTypeName}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>ORIGINAL DOCUMENT NUMBER(S)</Text>
            <Text style={styles.infoCellValue}>{srcDocString}</Text>
          </View>
          <View style={styles.infoCell}>
            <Text style={styles.infoCellLabel}>PREPARED BY</Text>
            <Text style={styles.infoCellValue}>{displayPreparedBy}</Text>
          </View>
        </View>

        {/* Remarks */}
        {doc?.remarks ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 6 }]}>Remarks</Text>
            <View style={styles.remarksBox}>
              <Text style={styles.remarksText}>{doc.remarks}</Text>
            </View>
          </>
        ) : null}

        {/* ── Items Table ── */}
        <Text style={styles.sectionTitle}>Items Being Returned</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={[styles.cell, styles.colSl]}>
              <Text style={[styles.cellHeaderText, styles.centerText]}>SL</Text>
            </View>
            <View style={[styles.cell, styles.colCode]}>
              <Text style={styles.cellHeaderText}>Code</Text>
            </View>
            <View style={[styles.cell, styles.colName]}>
              <Text style={styles.cellHeaderText}>Product Name</Text>
            </View>
            <View style={[styles.cell, styles.colUnit]}>
              <Text style={[styles.cellHeaderText, styles.centerText]}>Unit</Text>
            </View>
            <View style={[styles.cell, styles.colQty]}>
              <Text style={[styles.cellHeaderText, styles.rightText]}>Return Qty</Text>
            </View>
            <View style={[styles.cell, styles.colRemarks, styles.noRightBorder]}>
              <Text style={styles.cellHeaderText}>Remarks</Text>
            </View>
          </View>

          {/* Table Rows */}
          {lines.map((line, idx) => {
            const isLast = idx === lines.length - 1;
            const bg = getRowBg(idx);
            return (
              <View
                key={line.id || idx}
                style={[styles.tableRow, isLast ? { borderBottomWidth: 0 } : {}]}
              >
                <View
                  style={[
                    styles.cell,
                    styles.colSl,
                    isLast && styles.noBottomBorder,
                    { backgroundColor: bg },
                  ]}
                >
                  <Text style={styles.centerText}>{idx + 1}</Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.colCode,
                    isLast && styles.noBottomBorder,
                    { backgroundColor: bg },
                  ]}
                >
                  <Text style={{ fontFamily: 'Courier', fontSize: 8 }}>
                    {val(line.item_code, '—')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.colName,
                    isLast && styles.noBottomBorder,
                    { backgroundColor: bg },
                  ]}
                >
                  <Text style={{ fontWeight: 'bold' }}>{val(line.item_name)}</Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.colUnit,
                    isLast && styles.noBottomBorder,
                    { backgroundColor: bg },
                  ]}
                >
                  <Text style={styles.centerText}>{val(line.unit, '—')}</Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.colQty,
                    isLast && styles.noBottomBorder,
                    { backgroundColor: bg },
                  ]}
                >
                  <Text style={[styles.rightText, { fontWeight: 'bold' }]}>
                    {val(line.return_quantity, '0')}
                  </Text>
                </View>
                <View
                  style={[
                    styles.cell,
                    styles.colRemarks,
                    styles.noRightBorder,
                    isLast && styles.noBottomBorder,
                    { backgroundColor: bg },
                  ]}
                >
                  <Text style={{ color: '#64748B' }}>{val(line.remarks, '—')}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Summary ── */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL ITEMS</Text>
            <Text style={styles.summaryValue}>{lines.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>TOTAL RETURN QTY</Text>
            <Text style={styles.summaryValue}>{totalReturnQty}</Text>
          </View>
        </View>

        {/* ── Signatures ── */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <View style={{ height: 36 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Prepared By</Text>
            <Text style={styles.signatureName}>
              {displayPreparedBy !== '—' ? displayPreparedBy : '___________'}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={{ height: 36 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Approved By</Text>
            <Text style={styles.signatureName}>{val(doc?.approved_by_name, '___________')}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={{ height: 36 }} />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By</Text>
            <Text style={styles.signatureName}>{val(doc?.received_by_name, '___________')}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated: {fmtDT(new Date().toISOString())}</Text>
          <Text style={styles.footerText}>Ledars MIS — Return Management System</Text>
        </View>
      </Page>
    </Document>
  );
}
