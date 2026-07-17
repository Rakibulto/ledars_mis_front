import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

function formatDate(value) {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium' }).format(new Date(value));
}

function getValue(value, fallback = 'N/A') {
  if (value === 0) {
    return '0';
  }

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
  purposeBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    padding: 10,
    minHeight: 46,
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
    width: '8%',
  },
  itemCol: {
    width: '28%',
  },
  productCol: {
    width: '22%',
  },
  requestedCol: {
    width: '11%',
  },
  issuedCol: {
    width: '11%',
  },
  unitCol: {
    width: '8%',
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
  transportSection: {
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 5,
    padding: 10,
    marginBottom: 14,
    backgroundColor: '#F0F9FF',
  },
  transportSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#BAE6FD',
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  transportField: {
    width: '48%',
  },
  transportLabel: {
    fontSize: 8,
    color: '#0369A1',
    marginBottom: 2,
  },
  transportValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  transportAddressField: {
    width: '100%',
    marginTop: 2,
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

export default function IssueDocumentChallanPDF({
  documentData,
  moduleConfig,
  lineItems,
  docType,
}) {
  const showsIssueToField = moduleConfig.showIssueToField !== false;
  const issuedQtyTotal = lineItems.reduce((total, row) => total + Number(row.issued_qty || 0), 0);
  const requestedQtyTotal = lineItems.reduce(
    (total, row) => total + Number(row.requested_qty || 0),
    0
  );
  const departmentProject =
    documentData?.department || documentData?.project
      ? [documentData?.department, documentData?.project].filter(Boolean).join(' / ')
      : moduleConfig.issueContextFallback || 'Not recorded';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {docType === 'gate_pass'
              ? `${moduleConfig.singularTitle} Gate Pass`
              : `${moduleConfig.singularTitle} Challan`}
          </Text>
          <Text style={styles.subtitle}>
            {docType === 'gate_pass' ? 'Gate Pass reference: ' : 'Challan reference: '}
            {getValue(documentData?.gin_number, moduleConfig.detailHeadingFallback)}
          </Text>
        </View>

        {docType === 'gate_pass' && !!documentData?.transport_person && (
          <View style={styles.transportSection}>
            <Text style={styles.transportSectionTitle}>Transport / Dispatch Details</Text>
            <View style={styles.transportRow}>
              <View style={styles.transportField}>
                <Text style={styles.transportLabel}>Transport Person / Courier</Text>
                <Text style={styles.transportValue}>{getValue(documentData.transport_person)}</Text>
              </View>
              <View style={styles.transportField}>
                <Text style={styles.transportLabel}>Phone Number</Text>
                <Text style={styles.transportValue}>{getValue(documentData.transport_phone)}</Text>
              </View>
            </View>
            <View style={styles.transportRow}>
              <View style={styles.transportField}>
                <Text style={styles.transportLabel}>Dispatch Date</Text>
                <Text style={styles.transportValue}>{formatDate(documentData.dispatch_date)}</Text>
              </View>
              {!!documentData.vehicle_number && (
                <View style={styles.transportField}>
                  <Text style={styles.transportLabel}>Vehicle Number</Text>
                  <Text style={styles.transportValue}>{getValue(documentData.vehicle_number)}</Text>
                </View>
              )}
            </View>
            {!!documentData.transport_address && (
              <View style={styles.transportAddressField}>
                <Text style={styles.transportLabel}>Delivery Address</Text>
                <Text style={styles.transportValue}>
                  {getValue(documentData.transport_address)}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoRow}>
          <InfoCard label="Document Number" value={getValue(documentData?.gin_number)} />
          <InfoCard label="Issue Date" value={formatDate(documentData?.issue_date)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard
            label={moduleConfig.issueFromLabel}
            value={getValue(documentData?.issue_from)}
          />
          <InfoCard label="Warehouse" value={getValue(documentData?.warehouse_name)} />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Department / Project" value={departmentProject} />
          <InfoCard
            label={showsIssueToField ? moduleConfig.issueToLabel : 'Status'}
            value={
              showsIssueToField ? getValue(documentData?.issued_to) : getValue(documentData?.status)
            }
          />
        </View>
        <View style={styles.infoRow}>
          <InfoCard label="Requested By" value={getValue(documentData?.requested_by_name)} />
          <InfoCard label="Approved By" value={getValue(documentData?.approved_by_name)} />
        </View>

        <Text style={styles.sectionTitle}>Purpose</Text>
        <View style={styles.purposeBox}>
          <Text>{getValue(documentData?.purpose, 'No purpose recorded')}</Text>
        </View>

        <Text style={styles.sectionTitle}>Issued Items</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.cell, styles.headerCell, styles.slCol, styles.centeredText]}>
              SL
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.itemCol]}>Item</Text>
            <Text style={[styles.cell, styles.headerCell, styles.productCol]}>Product</Text>
            <Text style={[styles.cell, styles.headerCell, styles.requestedCol, styles.rightText]}>
              Requested
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.issuedCol, styles.rightText]}>
              Issued
            </Text>
            <Text style={[styles.cell, styles.headerCell, styles.unitCol]}>Unit</Text>
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
                    styles.requestedCol,
                    styles.rightText,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {Number(line.requested_qty || 0).toLocaleString('en-BD')}
                </Text>
                <Text
                  style={[
                    styles.cell,
                    styles.issuedCol,
                    styles.rightText,
                    isLastRow && styles.noBottomBorder,
                  ]}
                >
                  {Number(line.issued_qty || 0).toLocaleString('en-BD')}
                </Text>
                <Text style={[styles.cell, styles.unitCol, isLastRow && styles.noBottomBorder]}>
                  {getValue(line.unit)}
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
                No line items were attached to this challan.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <InfoCard
            label="Requested Quantity Total"
            value={requestedQtyTotal.toLocaleString('en-BD')}
          />
          <InfoCard label="Issued Quantity Total" value={issuedQtyTotal.toLocaleString('en-BD')} />
        </View>

        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Prepared By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Received By</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Authorized By</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
