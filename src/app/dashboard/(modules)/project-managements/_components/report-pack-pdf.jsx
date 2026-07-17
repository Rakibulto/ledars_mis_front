import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

function formatDateTime(value) {
  if (!value) return 'Not recorded';

  return new Intl.DateTimeFormat('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatCurrency(value) {
  return `BDT ${Number(value || 0).toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function chunkRows(rows, size) {
  const chunks = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 28,
    fontSize: 10,
    lineHeight: 1.45,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  brand: {
    fontSize: 9,
    color: '#2563EB',
    marginBottom: 4,
    fontWeight: 700,
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#475569',
  },
  section: {
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FBFF',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 8,
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  summaryHelper: {
    fontSize: 8.5,
    color: '#475569',
  },
  table: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    backgroundColor: '#E2E8F0',
  },
  cell: {
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    fontSize: 8.5,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  cellHeader: {
    fontWeight: 700,
    fontSize: 8.5,
  },
  textMuted: {
    color: '#64748B',
  },
  footer: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#64748B',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
  },
});

function SummaryCard({ label, value, helper }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHelper}>{helper}</Text>
    </View>
  );
}

function SimpleTable({ title, columns, rows }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.table}>
        <View style={[styles.row, styles.headerRow]}>
          {columns.map((column, index) => (
            <Text
              key={column.key}
              style={[
                styles.cell,
                styles.cellHeader,
                { width: column.width },
                index === columns.length - 1 ? styles.lastCell : null,
              ]}
            >
              {column.label}
            </Text>
          ))}
        </View>

        {rows.map((row, rowIndex) => (
          <View key={`${title}-${rowIndex}`} style={styles.row}>
            {columns.map((column, columnIndex) => (
              <Text
                key={column.key}
                style={[
                  styles.cell,
                  { width: column.width },
                  columnIndex === columns.length - 1 ? styles.lastCell : null,
                  rowIndex === rows.length - 1 ? { borderBottomWidth: 0 } : null,
                ]}
              >
                {row[column.key] ?? '—'}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProjectReportPackPdf({ snapshot }) {
  const summaryCards = [
    {
      label: 'Project Completion Rate',
      value: `${snapshot.summary.projectCompletionRate}%`,
      helper: `${snapshot.summary.completedProjects} of ${snapshot.summary.totalProjects} projects completed`,
    },
    {
      label: 'Approved Budget',
      value: formatCurrency(snapshot.summary.totalBudget),
      helper: `${snapshot.summary.totalProjects} projects with tracked approved budgets`,
    },
    {
      label: 'Task Completion Rate',
      value: `${snapshot.summary.workItemCompletionRate}%`,
      helper: `${snapshot.summary.completedWorkItems} of ${snapshot.summary.totalWorkItems} work items done`,
    },
    {
      label: 'Active Projects',
      value: String(snapshot.summary.activeProjects),
      helper: `${snapshot.summary.overdueEntries} overdue plan/work item entries need attention`,
    },
  ];

  const statusRows = (snapshot.statusDistribution || []).map((row) => ({
    status: row.label || row.status || 'Unknown',
    projects: String(row.value ?? row.count ?? 0),
  }));

  const donorRows = (snapshot.donorRows || []).map((row) => ({
    name: row.name || 'Unassigned',
    count: String(row.count ?? 0),
    share: `${row.share ?? 0}%`,
  }));

  const projectRows = (snapshot.projectProgressRows || []).map((row) => ({
    title: row.title || 'Untitled project',
    status: row.derivedStatus || 'Unknown',
    progress: `${row.progressPercent ?? 0}%`,
    workItems: `${row.completedWorkItems ?? 0}/${row.totalWorkItems || 0}`,
    donor: row.donorName || '—',
    budget: formatCurrency(row.budgetAmount),
  }));

  const projectChunks = chunkRows(projectRows, 18);

  return (
    <Document title="Project Report Pack" author="LEDARS" subject="Project management report">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>LEDARS • Project Management</Text>
          <Text style={styles.title}>Project Report Pack</Text>
          <Text style={styles.subtitle}>Generated {formatDateTime(snapshot.generatedAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <SummaryCard key={card.label} label={card.label} value={card.value} helper={card.helper} />
            ))}
          </View>
        </View>

        <SimpleTable
          title="Project Status Distribution"
          columns={[
            { key: 'status', label: 'Status', width: '60%' },
            { key: 'projects', label: 'Projects', width: '40%' },
          ]}
          rows={statusRows.length ? statusRows : [{ status: 'No data', projects: '0' }]}
        />

        <SimpleTable
          title="Donor Mix"
          columns={[
            { key: 'name', label: 'Donor', width: '54%' },
            { key: 'count', label: 'Projects', width: '20%' },
            { key: 'share', label: 'Share', width: '26%' },
          ]}
          rows={donorRows.length ? donorRows : [{ name: 'No data', count: '0', share: '0%' }]}
        />

        <View style={styles.footer} fixed>
          <Text>LEDARS report viewer pack</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {projectChunks.map((chunk, index) => (
        <Page key={`projects-${index}`} size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.brand}>LEDARS • Project Management</Text>
            <Text style={styles.title}>Project Progress Overview</Text>
            <Text style={styles.subtitle}>Detailed project-level completion and budget tracking</Text>
          </View>

          <SimpleTable
            title={`Projects ${index * 18 + 1}-${index * 18 + chunk.length}`}
            columns={[
              { key: 'title', label: 'Project', width: '28%' },
              { key: 'status', label: 'Status', width: '14%' },
              { key: 'progress', label: 'Progress', width: '12%' },
              { key: 'workItems', label: 'Work Items', width: '14%' },
              { key: 'donor', label: 'Donor', width: '16%' },
              { key: 'budget', label: 'Budget', width: '16%' },
            ]}
            rows={chunk}
          />

          <View style={styles.footer} fixed>
            <Text>Generated {formatDateTime(snapshot.generatedAt)}</Text>
            <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
          </View>
        </Page>
      ))}
    </Document>
  );
}
