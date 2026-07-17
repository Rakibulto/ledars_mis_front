'use client';

import { Font, Page, View, Text, Image, Document, StyleSheet } from '@react-pdf/renderer';

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [
    { src: '/fonts/Roboto-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Roboto-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontSize: 9,
    lineHeight: 1.6,
    fontFamily: 'Roboto',
    padding: '40px 36px',
    backgroundColor: '#FFFFFF',
  },
  // Header
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    maxWidth: 160,
    maxHeight: 60,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 4,
  },
  payslipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    textDecoration: 'underline',
    marginBottom: 16,
  },
  // Info Row
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  infoCol: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 2,
  },
  lockedBadge: {
    fontSize: 8,
    color: '#ED6C02',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // Columns
  columnsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  column: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionTitleGreen: {
    color: '#2E7D32',
  },
  sectionTitleRed: {
    color: '#D32F2F',
  },
  sectionTitleBlue: {
    color: '#1976D2',
  },
  // Line items
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  lineItemHighlight: {
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
  },
  lineLabel: {
    fontSize: 9,
    color: '#333333',
  },
  lineLabelBold: {
    fontWeight: 'bold',
  },
  lineValue: {
    fontSize: 9,
    color: '#333333',
  },
  lineValueBold: {
    fontWeight: 'bold',
  },
  lineValueRed: {
    color: '#D32F2F',
  },
  lineValueWarning: {
    color: '#ED6C02',
  },
  // Net salary
  netSalarySection: {
    marginTop: 12,
    padding: 12,
    borderTopWidth: 2,
    borderTopColor: '#1976D2',
    alignItems: 'center',
  },
  netSalaryLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  transferLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 4,
  },
  netSalaryBreakdown: {
    fontSize: 8,
    color: '#666666',
    marginTop: 4,
  },
  // Leave breakdown
  leaveSection: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 2,
  },
  leaveSectionTitle: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 3,
  },
  // Signatures
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
    paddingHorizontal: 30,
  },
  signatureBox: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  signatureLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  // Footer
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
});

// ----------------------------------------------------------------------

function formatCurrency(val) {
  const num = parseFloat(val || 0);
  if (Number.isNaN(num)) return 'BDT 0';
  return `BDT ${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatLeaveBreakdown(breakdown) {
  if (!breakdown || typeof breakdown !== 'object' || Object.keys(breakdown).length === 0) {
    return null;
  }
  return Object.entries(breakdown);
}

// ----------------------------------------------------------------------

export function PayrollInvoicePDF({ payroll, companyInfo }) {
  if (!payroll) return null;

  const employeeName = payroll.employee?.split(' - ')?.[0] || payroll.employee || 'N/A';
  const employeeId = payroll.employee?.split(' - ')?.[1] || '';

  const totalDeductions =
    parseFloat(payroll.absence_deduction || 0) +
    parseFloat(payroll.late_deduction || 0) +
    parseFloat(payroll.tax_deduction || 0);

  const totalBonuses =
    parseFloat(payroll.festival_bonus || 0) + parseFloat(payroll.performance_bonus || 0);
  const totalCompensations =
    parseFloat(payroll.holiday_compensation || 0) + parseFloat(payroll.weekday_compensation || 0);

  const attendanceRate =
    payroll.working_days > 0
      ? ((payroll.present_days / payroll.working_days) * 100).toFixed(1)
      : '0.0';

  const leaveEntries = formatLeaveBreakdown(payroll.leave_breakdown);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerSection}>
          {companyInfo?.logo && <Image src={companyInfo.logo} style={styles.logo} />}
          {companyInfo?.company_name && (
            <Text style={styles.companyName}>{companyInfo.company_name}</Text>
          )}
        </View>

        <Text style={styles.payslipTitle}>
          Payslip for {payroll.payroll_month} {payroll.payroll_year}
        </Text>

        {/* Employee & Payslip Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Employee</Text>
            <Text style={styles.infoValue}>{employeeName}</Text>
            {employeeId ? <Text style={styles.infoText}>ID: {employeeId}</Text> : null}
            <Text style={styles.infoText}>Generated by: {payroll.creator}</Text>
            {payroll.is_locked && <Text style={styles.lockedBadge}>LOCKED</Text>}
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text style={styles.infoValue}>Payslip #{payroll.id}</Text>
            <Text style={styles.infoText}>
              Created:{' '}
              {payroll.created_at ? new Date(payroll.created_at).toLocaleDateString() : 'N/A'}
            </Text>
            {payroll.updated_at !== payroll.created_at && (
              <Text style={styles.infoText}>
                Updated: {new Date(payroll.updated_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>

        {/* Earnings & Deductions */}
        <View style={styles.columnsRow}>
          {/* LEFT: Earnings */}
          <View style={styles.column}>
            <Text style={[styles.sectionTitle, styles.sectionTitleGreen]}>Earnings</Text>
            <PDFLineItem label="Basic Salary" value={formatCurrency(payroll.basic)} />
            <PDFLineItem label="House Rent" value={formatCurrency(payroll.house_rent)} />
            <PDFLineItem label="Conveyance" value={formatCurrency(payroll.conveyance)} />
            <PDFLineItem label="Medical" value={formatCurrency(payroll.medical)} />
            <PDFLineItem
              label="Gross Salary"
              value={formatCurrency(payroll.gross_salary)}
              bold
              highlight
            />
            <PDFLineItem label="Festival Bonus" value={formatCurrency(payroll.festival_bonus)} />
            <PDFLineItem
              label="Performance Bonus"
              value={formatCurrency(payroll.performance_bonus)}
            />
            <PDFLineItem
              label="Holiday Compensation"
              value={formatCurrency(payroll.holiday_compensation)}
            />
            <PDFLineItem
              label="Weekday Compensation"
              value={formatCurrency(payroll.weekday_compensation)}
            />
            <PDFLineItem
              label="Total Bonuses & Comp."
              value={formatCurrency(totalBonuses + totalCompensations)}
              bold
              highlight
            />
          </View>

          {/* RIGHT: Deductions + Attendance */}
          <View style={styles.column}>
            <Text style={[styles.sectionTitle, styles.sectionTitleRed]}>Deductions</Text>
            <PDFLineItem
              label="Absence Deduction"
              value={formatCurrency(payroll.absence_deduction)}
              negative
            />
            <PDFLineItem
              label="Late Deduction"
              value={formatCurrency(payroll.late_deduction)}
              negative
            />
            <PDFLineItem
              label="Tax Deduction"
              value={formatCurrency(payroll.tax_deduction)}
              warning
            />
            <PDFLineItem
              label="Total Deductions"
              value={formatCurrency(totalDeductions)}
              bold
              negative
              highlight
            />

            <Text style={[styles.sectionTitle, styles.sectionTitleBlue, { marginTop: 12 }]}>
              Attendance
            </Text>
            <PDFLineItem label="Days in Month" value={String(payroll.days_of_month)} />
            <PDFLineItem label="Working Days" value={String(payroll.working_days)} />
            <PDFLineItem label="Present Days" value={String(payroll.present_days)} />
            <PDFLineItem label="Absent Days" value={String(payroll.absent_days)} />
            <PDFLineItem label="Late Days" value={String(payroll.late_days || 0)} />
            <PDFLineItem label="Weekend Days" value={String(payroll.weekend_days)} />
            <PDFLineItem label="Holidays" value={String(payroll.holidays)} />
            <PDFLineItem label="Attendance Rate" value={`${attendanceRate}%`} bold highlight />

            {/* Leave Breakdown as object */}
            {leaveEntries && leaveEntries.length > 0 && (
              <View style={styles.leaveSection}>
                <Text style={styles.leaveSectionTitle}>Leave Breakdown</Text>
                {leaveEntries.map(([type, days]) => (
                  <PDFLineItem key={type} label={type} value={`${days} day(s)`} />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Net Salary & Transfer */}
        <View style={styles.netSalarySection}>
          <Text style={styles.netSalaryLabel}>
            Net Salary: {formatCurrency(payroll.net_salary)}
          </Text>
          {parseFloat(payroll.total_transfer_amount || 0) > 0 && (
            <Text style={styles.transferLabel}>
              Total Transfer: {formatCurrency(payroll.total_transfer_amount)}
            </Text>
          )}
          <Text style={styles.netSalaryBreakdown}>
            (Gross {formatCurrency(payroll.gross_salary)} + Bonuses{' '}
            {formatCurrency(totalBonuses + totalCompensations)} - Deductions{' '}
            {formatCurrency(totalDeductions)})
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signaturesRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Employer Signature</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Employee Signature</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        <Text style={styles.footer}>This is a system-generated payslip</Text>
      </Page>
    </Document>
  );
}

// ----------------------------------------------------------------------

function PDFLineItem({ label, value, bold, negative, warning, highlight }) {
  return (
    <View style={[styles.lineItem, highlight && styles.lineItemHighlight]}>
      <Text style={[styles.lineLabel, bold && styles.lineLabelBold]}>{label}</Text>
      <Text
        style={[
          styles.lineValue,
          bold && styles.lineValueBold,
          negative && styles.lineValueRed,
          warning && styles.lineValueWarning,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
