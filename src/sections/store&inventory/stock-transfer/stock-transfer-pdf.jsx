import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatCurrency(value) {
  const amount = Number(value || 0);

  return `BDT ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function getValue(value, fallback = 'N/A') {
  if (value === 0) {
    return '0';
  }

  return value ? String(value) : fallback;
}

function getWarehouseLabel(primary, fallback, emptyLabel) {
  return primary || fallback || emptyLabel;
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
    minHeight: 46,
    marginBottom: 16,
  },
  // Transport section
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
  noRightBorder: {
    borderRightWidth: 0,
  },
  noBottomBorder: {
    borderBottomWidth: 0,
  },
  centeredText: {
    textAlign: 'center',
  },
  rightText: {
    textAlign: 'right',
  },
  slCol: {
    width: '7%',
  },
  itemCol: {
    width: '21%',
  },
  productCol: {
    width: '17%',
  },
  qtyCol: {
    width: '9%',
  },
  unitCol: {
    width: '8%',
  },
  priceCol: {
    width: '13%',
  },
  totalCol: {
    width: '13%',
  },
  remarksCol: {
    width: '12%',
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
});

function InfoCard({ label, value }) {
  return (
    <View style={styles.infoCol}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function StockTransferPDF({ transfer, moduleConfig, lineItems }) {
  const sourceLabel = getWarehouseLabel(
    transfer?.from_warehouse_name,
    transfer?.from_location,
    'Source not linked'
  );
  const destinationLabel = getWarehouseLabel(
    transfer?.to_warehouse_name,
    transfer?.to_location,
    'Destination not linked'
  );
  const totalQuantity = lineItems.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const hasTransport = !!transfer?.transport_person;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{moduleConfig.singularTitle} Details</Text>
          <Text style={styles.subtitle}>
            Document reference:{' '}
            {getValue(transfer?.transfer_number, moduleConfig.detailHeadingFallback)}
          </Text>
        </View>

        {/* ── Transport / Courier Information ── */}
        {hasTransport && (
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
              {transfer.vehicle_number && (
                <View style={styles.transportField}>
                  <Text style={styles.transportLabel}>VEHICLE NUMBER</Text>
                  <Text style={styles.transportValue}>{transfer.vehicle_number}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        <View style={styles.infoRow}>
          <InfoCard label="Transfer Number" value={getValue(transfer?.transfer_number)} />
          <InfoCard label="Transfer Date" value={formatDate(transfer?.transfer_date)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="From Warehouse" value={getValue(sourceLabel)} />
          <InfoCard label="To Warehouse" value={getValue(destinationLabel)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Dispatch Owner" value={getValue(transfer?.sent_by_name)} />
          <InfoCard label="Receiving Owner" value={getValue(transfer?.received_by_name)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Status" value={getValue(transfer?.status)} />
          <InfoCard label="Document Value" value={formatCurrency(transfer?.total_value)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard
            label="Vehicle / Transport Reference"
            value={getValue(transfer?.vehicle_number)}
          />
          <InfoCard label="Driver / Courier Name" value={getValue(transfer?.driver_name)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Created At" value={formatDateTime(transfer?.created_at)} />
          <InfoCard label="Updated At" value={formatDateTime(transfer?.updated_at)} />
        </View>

        <Text style={styles.sectionTitle}>Movement Notes</Text>
        <View style={styles.notesBox}>
          <Text>{getValue(transfer?.notes, 'No movement notes recorded')}</Text>
        </View>

        <Text style={styles.sectionTitle}>{moduleConfig.lineItemsTitle}</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.headerCell, styles.slCol, styles.centeredText]}>
              SL
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.itemCol]}>Item</Text>
            <Text style={[styles.cell, styles.headerCell, styles.productCol]}>Product</Text>
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
              Remarks
            </Text>
          </View>

          {lineItems.map((line, index) => {
            const isLastRow = index === lineItems.length - 1;

            return (
              <View key={line.id || `${line.item_code}-${index + 1}`} style={styles.tableRow}>
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
                  {getValue(line.item_name || line.item_code, 'Unnamed item')}
                </Text>
                <Text style={[styles.cell, styles.productCol, isLastRow && styles.noBottomBorder]}>
                  {getValue(line.product_name, 'Unlinked product')}
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
                  {getValue(line.remarks)}
                </Text>
              </View>
            );
          })}

          {!lineItems.length && (
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
                {moduleConfig.noLineItemsDescription}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <InfoCard label="Line Items" value={String(lineItems.length)} />
          <InfoCard label="Transfer Qty" value={totalQuantity.toLocaleString('en-BD')} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Route" value={`${sourceLabel} to ${destinationLabel}`} />
          <InfoCard label="Document Value" value={formatCurrency(transfer?.total_value)} />
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Dispatch Owner</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Receiving Owner</Text>
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
