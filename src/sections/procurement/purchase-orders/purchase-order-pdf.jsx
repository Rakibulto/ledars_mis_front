// PurchaseOrderPDF.jsx

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
  },

  header: {
    marginBottom: 20,
    borderBottom: '1px solid #eee',
    paddingBottom: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  section: {
    marginBottom: 15,
  },

  table: {
    marginTop: 10,
    border: '1px solid #ddd',
  },

  tableRow: {
    flexDirection: 'row',
  },

  tableHeader: {
    backgroundColor: '#f3f3f3',
  },

  cell: {
    padding: 6,
    borderRight: '1px solid #ddd',
    borderBottom: '1px solid #ddd',
  },

  col1: { width: '8%' },
  col2: { width: '15%' },
  col3: { width: '25%' },
  col4: { width: '12%' },
  col5: { width: '10%' },
  col6: { width: '15%' },
  col7: { width: '15%' },

  totalSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
});

const PurchaseOrderPDF = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Purchase Order</Text>

        <View style={styles.row}>
          <Text>PO Number: {data.po_number}</Text>
          <Text>Status: {data.approval_status}</Text>
        </View>

        <View style={styles.row}>
          <Text>Delivery Date: {data.delivery_date}</Text>
          <Text>Date: {data.created_at.slice(0, 10)}</Text>
        </View>
      </View>

      {/* Supplier */}
      <View style={styles.section}>
        <Text>Supplier: {data.supplier_name}</Text>
      </View>

      {/* Created By */}
      <View style={styles.section}>
        <Text>Created By: {data.created_by.employee_name}</Text>
        <Text>Department: {data.created_by.department}</Text>
        <Text>Designation: {data.created_by.designation}</Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Header Row */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.cell, styles.col1]}>#</Text>
          <Text style={[styles.cell, styles.col2]}>Item Code</Text>
          <Text style={[styles.cell, styles.col3]}>Item</Text>
          <Text style={[styles.cell, styles.col4]}>Qty</Text>
          <Text style={[styles.cell, styles.col5]}>Unit</Text>
          <Text style={[styles.cell, styles.col6]}>Unit Price</Text>
          <Text style={[styles.cell, styles.col7]}>Total</Text>
        </View>

        {data.po_items.map((item, index) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.cell, styles.col1]}>{index + 1}</Text>
            <Text style={[styles.cell, styles.col2]}>{item.item_code}</Text>
            <Text style={[styles.cell, styles.col3]}>{item.item_name}</Text>
            <Text style={[styles.cell, styles.col4]}>{item.quantity}</Text>
            <Text style={[styles.cell, styles.col5]}>{item.unit}</Text>
            <Text style={[styles.cell, styles.col6]}>{item.unit_price}</Text>
            <Text style={[styles.cell, styles.col7]}>{item.total_price}</Text>
          </View>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalSection}>
        <Text>Total Items: {data.item_count}</Text>
        <Text>Total Amount: {data.total_amount}</Text>
      </View>
    </Page>
  </Document>
);

export default PurchaseOrderPDF;
