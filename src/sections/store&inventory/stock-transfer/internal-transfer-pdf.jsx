import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value)
  );
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `BDT ${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getValue(value, fallback = 'N/A') {
  if (value === 0) return '0';
  return value ? String(value) : fallback;
}

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    lineHeight: 1.45,
    padding: '32px 28px',
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#475569',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoCol: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#F8FAFC',
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 8,
  },
  notesBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 10,
    minHeight: 40,
    marginBottom: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#E2E8F0',
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    fontSize: 9,
  },
  headerCell: {
    fontWeight: 'bold',
  },
  noRightBorder: { borderRightWidth: 0 },
  noBottomBorder: { borderBottomWidth: 0 },
  centeredText: { textAlign: 'center' },
  rightText: { textAlign: 'right' },
  slCol: { width: '7%' },
  itemCol: { width: '25%' },
  qtyCol: { width: '10%' },
  unitCol: { width: '9%' },
  priceCol: { width: '14%' },
  totalCol: { width: '14%' },
  remarksCol: { width: '21%' },
  docTypeWrapper: {
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#0F172A',
  },
  docTypeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#0F172A',
  },
  docTypeSubtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#64748B',
    marginTop: 3,
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 26,
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#94A3B8',
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#475569',
  },
  // ── Transport section ──
  transportSection: {
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 14,
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

function InfoCard({ label, value }) {
  return (
    <View style={styles.infoCol}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const DOC_TYPE_LABELS = {
  chalan: { title: 'Delivery Chalan', subtitle: 'Internal Stock Dispatch Document' },
  gate_pass: { title: 'Gate Pass', subtitle: 'Authorised Exit / Entry Document' },
  default: { title: 'Internal Transfer Document', subtitle: 'Internal Stock Movement Record' },
};

export default function InternalTransferPDF({ transfer, lines, docType }) {
  const totalQuantity = (lines || []).reduce((s, l) => s + Number(l.quantity || 0), 0);
  const totalValue = (lines || []).reduce(
    (s, l) => s + Number(l.quantity || 0) * Number(l.unit_price || 0),
    0
  );

  const docLabel = DOC_TYPE_LABELS[docType] || DOC_TYPE_LABELS.default;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* centered doc-type title */}
        <View style={styles.docTypeWrapper}>
          <Text style={styles.docTypeTitle}>{docLabel.title}</Text>
          <Text style={styles.docTypeSubtitle}>{docLabel.subtitle}</Text>
        </View>

        {/* header */}
        <View style={styles.header}>
          <Text style={styles.title}>Internal Transfer Document</Text>
          <Text style={styles.subtitle}>
            Reference: {getValue(transfer?.transfer_number, 'No reference assigned')}
          </Text>
        </View>

        {/* Transport / Courier Information — shown on Gate Pass when data exists */}
        {!!transfer?.transport_person && (
          <View style={styles.transportSection}>
            <Text style={styles.transportSectionTitle}>Transport / Courier Information</Text>
            <View style={styles.transportRow}>
              <View style={styles.transportField}>
                <Text style={styles.transportLabel}>TRANSPORT PERSON / COURIER</Text>
                <Text style={styles.transportValue}>{getValue(transfer.transport_person)}</Text>
              </View>
              <View style={styles.transportField}>
                <Text style={styles.transportLabel}>PHONE NUMBER</Text>
                <Text style={styles.transportValue}>{getValue(transfer.transport_phone)}</Text>
              </View>
              <View style={styles.transportField}>
                <Text style={styles.transportLabel}>DISPATCH DATE</Text>
                <Text style={styles.transportValue}>{formatDate(transfer.dispatch_date)}</Text>
              </View>
            </View>
            <View style={styles.transportRow}>
              <View style={styles.transportAddressField}>
                <Text style={styles.transportLabel}>ADDRESS</Text>
                <Text style={styles.transportValue}>{getValue(transfer.transport_address)}</Text>
              </View>
              {!!transfer.vehicle_number && (
                <View style={styles.transportField}>
                  <Text style={styles.transportLabel}>VEHICLE NUMBER</Text>
                  <Text style={styles.transportValue}>{transfer.vehicle_number}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* info grid */}
        <View style={styles.infoRow}>
          <InfoCard label="Transfer Number" value={getValue(transfer?.transfer_number)} />
          <InfoCard label="Transfer Date" value={formatDate(transfer?.transfer_date)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard
            label="From (Source)"
            value={getValue(transfer?.from_office_name, 'Source not linked')}
          />
          <InfoCard
            label="To (Destination)"
            value={getValue(transfer?.to_office_name, 'Destination not linked')}
          />
        </View>
        <View style={styles.infoRow}>
          <InfoCard
            label="Source Type"
            value={getValue(transfer?.from_office_type, 'Not specified')}
          />
          <InfoCard
            label="Destination Type"
            value={getValue(transfer?.to_office_type, 'Not specified')}
          />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Status" value={getValue(transfer?.status)} />
          <InfoCard
            label="Document Value"
            value={formatCurrency(transfer?.total_value ?? totalValue)}
          />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Created At" value={formatDateTime(transfer?.created_at)} />
          <InfoCard label="Updated At" value={formatDateTime(transfer?.updated_at)} />
        </View>

        {/* notes */}
        <Text style={styles.sectionTitle}>Movement Notes</Text>
        <View style={styles.notesBox}>
          <Text>{getValue(transfer?.notes, 'No movement notes recorded')}</Text>
        </View>

        {/* line items table */}
        <Text style={styles.sectionTitle}>Transfer Line Items</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.headerCell, styles.slCol, styles.centeredText]}>
              SL
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.itemCol]}>Item / Product</Text>
            <Text style={[styles.cell, styles.headerCell, styles.qtyCol, styles.rightText]}>
              Qty
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.unitCol]}>Unit</Text>
            <Text style={[styles.cell, styles.headerCell, styles.priceCol, styles.rightText]}>
              Unit Price
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.totalCol, styles.rightText]}>
              Line Total
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.remarksCol, styles.noRightBorder]}>
              Notes
            </Text>
          </View>

          {(lines || []).map((line, index) => {
            const isLastRow = index === (lines || []).length - 1;
            return (
              <View key={line.id || `line-${index}`} style={styles.tableRow}>
                <Text
                  style={[
                    styles.cell,
                    styles.slCol,
                    styles.centeredText,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {index + 1}
                </Text>
                <Text style={[styles.cell, styles.itemCol, isLastRow && styles.noBottomBorder]}>
                  {getValue(line.item_name || line.product_name, 'Unnamed item')}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.qtyCol,
                    styles.rightText,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {Number(line.quantity || 0).toLocaleString('en-BD')}
                </Text>
                <Text style={[styles.cell, styles.unitCol, isLastRow && styles.noBottomBorder]}>
                  {getValue(line.unit)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.priceCol,
                    styles.rightText,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {formatCurrency(line.unit_price)}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.totalCol,
                    styles.rightText,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {formatCurrency(Number(line.quantity || 0) * Number(line.unit_price || 0))}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.remarksCol,
                    styles.noRightBorder,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {getValue(line.notes)}
                </Text>
              </View>
            );
          })}

          {!(lines || []).length && (
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.cell,
                  styles.centeredText,
                  styles.noRightBorder,
                  styles.noBottomBorder,
                  { width: '100%' },
                ]}
              >
                No line items were attached to this transfer.
              </Text>
            </View>
          )}
        </View>

        {/* totals */}
        <View style={styles.infoRow}>
          <InfoCard label="Line Items" value={String((lines || []).length)} />
          <InfoCard label="Total Quantity" value={totalQuantity.toLocaleString('en-BD')} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard
            label="Route"
            value={`${getValue(transfer?.from_office_name, '?')} → ${getValue(transfer?.to_office_name, '?')}`}
          />
          <InfoCard
            label="Total Transfer Value"
            value={formatCurrency(transfer?.total_value ?? totalValue)}
          />
        </View>

        {/* signatures */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Dispatched By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
