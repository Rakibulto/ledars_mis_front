import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 38, fontSize: 8.5, fontFamily: 'Helvetica', color: '#222' },

  // Header
  header: {
    textAlign: 'center',
    borderBottom: '2px solid #222',
    paddingBottom: 8,
    marginBottom: 14,
  },
  orgName: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  subTitle: { fontSize: 8, color: '#555' },

  // Section
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#eeeeee',
    padding: '3 6',
    marginBottom: 6,
    borderBottom: '1px solid #bbbbbb',
  },

  // Grid
  grid2: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  // Field row
  fieldRow: { flexDirection: 'row', borderBottom: '1px dotted #dddddd', paddingVertical: 3 },
  fieldLabel: { width: 100, color: '#666', fontSize: 8 },
  fieldValue: { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 8 },

  // Table
  table: { borderTop: '1px solid #bbbbbb', borderLeft: '1px solid #bbbbbb', marginTop: 4 },
  tableRow: { flexDirection: 'row' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#eeeeee' },
  cell: { borderRight: '1px solid #bbbbbb', borderBottom: '1px solid #bbbbbb', padding: '3 4' },
  headerCellText: { fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  cellText: { fontSize: 7.5 },
  textRight: { textAlign: 'right' },
  textCenter: { textAlign: 'center' },
  grandTotalRow: { flexDirection: 'row', backgroundColor: '#ddeef6' },
  grandTotalText: { fontFamily: 'Helvetica-Bold', fontSize: 8.5 },

  // Signatures
  sigSection: { marginTop: 20 },
  sigGrid: { flexDirection: 'row', gap: 14, marginTop: 10 },
  sigBox: { flex: 1, borderTop: '1px solid #333', paddingTop: 6, alignItems: 'center' },
  sigTitle: { fontSize: 7.5, marginBottom: 18, color: '#444' },
  sigName: { fontFamily: 'Helvetica-Bold', fontSize: 8 },
  sigRole: { fontSize: 7.5, color: '#555', marginTop: 2 },
  sigDate: { fontSize: 7.5, color: '#555', marginTop: 2 },

  // Purpose
  purposeText: { fontSize: 8.5, lineHeight: 1.5 },
});

const Field = ({ label, value }) => (
  <View style={styles.fieldRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={styles.fieldValue}>{value || '-'}</Text>
  </View>
);

const TH = ({ children, colStyle, align }) => (
  <View style={[styles.cell, colStyle]}>
    <Text
      style={[
        styles.headerCellText,
        align === 'right' ? styles.textRight : align === 'center' ? styles.textCenter : {},
      ]}
    >
      {children}
    </Text>
  </View>
);

const TD = ({ children, colStyle, align }) => (
  <View style={[styles.cell, colStyle]}>
    <Text
      style={[
        styles.cellText,
        align === 'right' ? styles.textRight : align === 'center' ? styles.textCenter : {},
      ]}
    >
      {String(children ?? '-')}
    </Text>
  </View>
);

export function MrfPDF({ data, boqItems = [] }) {
  const createdDate = data?.created_at
    ? new Date(data.created_at).toLocaleDateString('en-GB')
    : '—';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.orgName}>LEDARS</Text>
          <Text style={styles.docTitle}>Material Requisition Form (MRF)</Text>
          <Text style={styles.subTitle}>
            {data?.requisition_no}
            {'  |  '}
            {data?.status?.replace(/_/g, ' ').toUpperCase()}
            {'  |  '}
            {createdDate}
          </Text>
        </View>

        {/* ── Basic Information ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.grid2}>
            <View style={styles.col}>
              <Field label="MRF Number" value={data?.requisition_no} />
              <Field label="Office" value={data?.requesting_office_info?.name} />
              <Field label="Department" value={data?.department_name} />
              <Field label="Project" value={data?.project_info?.name || data?.project} />
            </View>
            <View style={styles.col}>
              <Field label="Category" value={data?.category} />
              <Field label="Priority" value={data?.priority} />
              <Field label="Required By" value={data?.delivery_date} />
              <Field label="Fiscal Year" value={data?.fiscal_year} />
            </View>
          </View>
        </View>

        {/* ── Requester & Budget ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requester & Budget</Text>
          <View style={styles.grid2}>
            <View style={styles.col}>
              <Field
                label="Requester"
                value={data?.created_by?.username || data?.created_by?.name}
              />
              <Field label="Designation" value={data?.created_by?.designation} />
              <Field label="Email" value={data?.created_by?.email} />
            </View>
            <View style={styles.col}>
              <Field label="Budget Code" value={data?.budget_code_display?.name} />
              <Field label="Donor Code" value={data?.donor_code_info?.name} />
              <Field label="Account Head" value={data?.account_code_display?.name} />
            </View>
          </View>
        </View>

        {/* ── Purpose ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose & Justification</Text>
          <Text style={styles.purposeText}>{data?.purpose || '-'}</Text>
        </View>

        {/* ── BOQ Table ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Bill of Quantities (BOQ) — Total: {'\u09F3'}
            {data?.total_amount?.toLocaleString() || '0'}
          </Text>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeaderRow}>
              <TH colStyle={{ width: '5%' }} align="center">
                #
              </TH>
              <TH colStyle={{ width: '26%' }}>Item Name</TH>
              <TH colStyle={{ width: '21%' }}>Specification</TH>
              <TH colStyle={{ width: '8%' }} align="center">
                Unit
              </TH>
              <TH colStyle={{ width: '7%' }} align="center">
                Qty
              </TH>
              <TH colStyle={{ width: '16.5%' }} align="right">
                Rate ({'\u09F3'})
              </TH>
              <TH colStyle={{ width: '16.5%' }} align="right">
                Amount ({'\u09F3'})
              </TH>
            </View>

            {/* Rows */}
            {boqItems.map((item) => (
              <View key={item.sl} style={styles.tableRow}>
                <TD colStyle={{ width: '5%' }} align="center">
                  {item.sl}
                </TD>
                <TD colStyle={{ width: '26%' }}>{item.description}</TD>
                <TD colStyle={{ width: '21%' }}>{item.specification}</TD>
                <TD colStyle={{ width: '8%' }} align="center">
                  {item.unit}
                </TD>
                <TD colStyle={{ width: '7%' }} align="center">
                  {item.qty?.toLocaleString()}
                </TD>
                <TD colStyle={{ width: '16.5%' }} align="right">
                  {item.rate?.toLocaleString()}
                </TD>
                <TD colStyle={{ width: '16.5%' }} align="right">
                  {item.amount?.toLocaleString()}
                </TD>
              </View>
            ))}

            {/* Grand Total */}
            <View style={styles.grandTotalRow}>
              <View style={[styles.cell, { width: '83.5%' }]}>
                <Text style={[styles.grandTotalText, styles.textRight]}>Grand Total:</Text>
              </View>
              <View style={[styles.cell, { width: '16.5%' }]}>
                <Text style={[styles.grandTotalText, styles.textRight]}>
                  {'\u09F3'}
                  {data?.total_amount?.toLocaleString() || '0'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Approval Signatures ── */}
        <View style={styles.sigSection}>
          <Text style={styles.sectionTitle}>Approval Signatures</Text>
          <View style={styles.sigGrid}>
            <View style={styles.sigBox}>
              <Text style={styles.sigTitle}>Prepared by</Text>
              <Text style={styles.sigName}>
                {data?.created_by?.username || '______________________'}
              </Text>
              <Text style={styles.sigRole}>{data?.created_by?.designation || 'Requester'}</Text>
              <Text style={styles.sigDate}>Date: {createdDate}</Text>
            </View>
            <View style={styles.sigBox}>
              <Text style={styles.sigTitle}>Endorsed by</Text>
              <Text style={styles.sigName}>______________________</Text>
              <Text style={styles.sigRole}>Area Manager</Text>
              <Text style={styles.sigDate}>Date: ____________</Text>
            </View>
            <View style={styles.sigBox}>
              <Text style={styles.sigTitle}>Approved by</Text>
              <Text style={styles.sigName}>______________________</Text>
              <Text style={styles.sigRole}>Head of Operations</Text>
              <Text style={styles.sigDate}>Date: ____________</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
