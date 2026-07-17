import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },

  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: '2px solid #059669',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },

  beneficiaryId: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
    marginTop: 10,
  },

  section: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: '1px solid #e5e7eb',
  },

  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  label: {
    width: '35%',
    fontSize: 9,
    color: '#6b7280',
    fontWeight: 'bold',
  },

  value: {
    width: '65%',
    fontSize: 10,
    color: '#1f2937',
  },

  gridRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  gridCol: {
    width: '50%',
  },

  table: {
    marginTop: 10,
    border: '1px solid #e5e7eb',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
  },

  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },

  tableCell: {
    padding: 8,
    fontSize: 9,
    borderRight: '1px solid #e5e7eb',
  },

  col1: { width: '5%' },
  col2: { width: '30%' },
  col3: { width: '20%' },
  col4: { width: '15%' },
  col5: { width: '15%' },
  col6: { width: '15%' },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },

  chip: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 8,
    marginRight: 5,
    marginBottom: 5,
  },

  summaryBox: {
    backgroundColor: '#f0fdf4',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    border: '1px solid #bbf7d0',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  summaryLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: 'bold',
  },

  summaryValue: {
    fontSize: 11,
    color: '#166534',
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },

  noData: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    padding: 10,
  },
});

const BeneficiaryProfilePDF = ({ beneficiary, services }) => {
  const totalServicesValue =
    services?.reduce((sum, service) => sum + (parseFloat(service.value) || 0), 0) || 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Beneficiary Profile</Text>
          <Text style={styles.subtitle}>Comprehensive Beneficiary Information Report</Text>
          <Text style={styles.beneficiaryId}>ID: {beneficiary?.ben_code}</Text>
        </View>

        {/* Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Services Received:</Text>
            <Text style={styles.summaryValue}>{beneficiary?.total_services_received || 0}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Services Value:</Text>
            <Text style={styles.summaryValue}>৳{totalServicesValue.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status:</Text>
            <Text style={styles.summaryValue}>{beneficiary?.status}</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <View style={styles.row}>
                <Text style={styles.label}>Full Name:</Text>
                <Text style={styles.value}>{beneficiary?.name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Father&apos;s Name:</Text>
                <Text style={styles.value}>{beneficiary?.father_name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Mother&apos;s Name:</Text>
                <Text style={styles.value}>{beneficiary?.mother_name}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Date of Birth:</Text>
                <Text style={styles.value}>
                  {beneficiary?.date_of_birth} ({beneficiary?.age} years)
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sex:</Text>
                <Text style={styles.value}>{beneficiary?.sex}</Text>
              </View>
            </View>
            <View style={styles.gridCol}>
              <View style={styles.row}>
                <Text style={styles.label}>Marital Status:</Text>
                <Text style={styles.value}>{beneficiary?.marital_status}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>{beneficiary?.contact}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{beneficiary?.email || 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>National ID:</Text>
                <Text style={styles.value}>{beneficiary?.nid}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Registration Date:</Text>
                <Text style={styles.value}>{beneficiary?.registration_date}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Socio-Economic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Socio-Economic Information</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <View style={styles.row}>
                <Text style={styles.label}>Education Level:</Text>
                <Text style={styles.value}>{beneficiary?.education_level}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Occupation:</Text>
                <Text style={styles.value}>{beneficiary?.occupation}</Text>
              </View>
            </View>
            <View style={styles.gridCol}>
              <View style={styles.row}>
                <Text style={styles.label}>Household Size:</Text>
                <Text style={styles.value}>{beneficiary?.household_size} members</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Monthly Income:</Text>
                <Text style={styles.value}>
                  ৳{parseFloat(beneficiary?.monthly_income || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Location Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Division:</Text>
            <Text style={styles.value}>{beneficiary?.division}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>District:</Text>
            <Text style={styles.value}>{beneficiary?.district}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Upazila:</Text>
            <Text style={styles.value}>{beneficiary?.upazila}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Union:</Text>
            <Text style={styles.value}>{beneficiary?.union}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Village/Address:</Text>
            <Text style={styles.value}>{beneficiary?.village || beneficiary?.address}</Text>
          </View>
        </View>

        {/* Program Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Program Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Project:</Text>
            <Text style={styles.value}>{beneficiary?.project}</Text>
          </View>
          {beneficiary?.vulnerability_type && (
            <View style={styles.row}>
              <Text style={styles.label}>Vulnerability Type:</Text>
              <View style={styles.chipContainer}>
                {Array.isArray(beneficiary.vulnerability_type) ? (
                  beneficiary.vulnerability_type.map((type, index) => (
                    <Text key={index} style={styles.chip}>
                      {type}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.chip}>
                    {beneficiary.vulnerability_type?.label || beneficiary.vulnerability_type}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Services Received History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services Received History</Text>
          {services && services.length > 0 ? (
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.col1]}>#</Text>
                <Text style={[styles.tableCell, styles.col2]}>Service Name</Text>
                <Text style={[styles.tableCell, styles.col3]}>Project</Text>
                <Text style={[styles.tableCell, styles.col4]}>Date</Text>
                <Text style={[styles.tableCell, styles.col5]}>Value (৳)</Text>
                <Text style={[styles.tableCell, styles.col6]}>Status</Text>
              </View>

              {/* Table Rows */}
              {services.map((service, index) => (
                <View key={service.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.col1]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{service.name}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>
                    {service.project_name || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, styles.col4]}>{service.date}</Text>
                  <Text style={[styles.tableCell, styles.col5]}>
                    {parseFloat(service.value || 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.tableCell, styles.col6]}>{service.status}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noData}>No services recorded yet</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()} |
            Ledars NGO Management Information System
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default BeneficiaryProfilePDF;
