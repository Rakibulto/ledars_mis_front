'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Printer, Download, FileText, ArrowLeft, CheckCircle, FileSpreadsheet } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const exportPresets = [
  {
    id: 'full-audit',
    name: 'Full Audit Trail Report',
    description: 'Complete log of all system activities for the selected period',
    format: 'PDF / Excel',
    estimatedSize: '~2.5 MB',
    modules: ['All Modules'],
    icon: FileText,
  },
  {
    id: 'compliance-summary',
    name: 'Compliance Summary Report',
    description: 'Current compliance scores, failed checks, and recommendations',
    format: 'PDF',
    estimatedSize: '~800 KB',
    modules: ['Compliance'],
    icon: FileSpreadsheet,
  },
  {
    id: 'vendor-audit',
    name: 'Vendor Activity Report',
    description: 'All vendor-related activities including onboarding, blacklisting, payments',
    format: 'PDF / Excel',
    estimatedSize: '~1.2 MB',
    modules: ['Vendors', 'Payments', 'Awards'],
    icon: FileText,
  },
  {
    id: 'financial-audit',
    name: 'Financial Transaction Audit',
    description: 'Payment processing, treasury activities, budget transactions',
    format: 'Excel',
    estimatedSize: '~1.8 MB',
    modules: ['Payment Requisitions', 'Treasury', 'Budget'],
    icon: FileSpreadsheet,
  },
  {
    id: 'security-report',
    name: 'Security & Access Report',
    description: 'Login activities, failed attempts, role changes, account modifications',
    format: 'PDF',
    estimatedSize: '~500 KB',
    modules: ['Authentication', 'Settings'],
    icon: FileText,
  },
  {
    id: 'procurement-cycle',
    name: 'Procurement Cycle Audit',
    description: 'End-to-end procurement trail from requisition to payment',
    format: 'PDF / Excel',
    estimatedSize: '~3.0 MB',
    modules: ['Material Requisitions', 'RFQ', 'Comparative', 'Awards', 'Work Orders', 'GRN'],
    icon: FileSpreadsheet,
  },
];
const recentExports = [
  {
    id: 1,
    name: 'Full Audit Trail - March 2026',
    exportedBy: 'Kamal Hossain',
    date: '2026-04-01',
    format: 'PDF',
    size: '2.3 MB',
    status: 'completed',
  },
  {
    id: 2,
    name: 'Vendor Activity - Q1 2026',
    exportedBy: 'Aminul Haque',
    date: '2026-03-31',
    format: 'Excel',
    size: '1.1 MB',
    status: 'completed',
  },
  {
    id: 3,
    name: 'Financial Audit - March 2026',
    exportedBy: 'Fatema Begum',
    date: '2026-03-28',
    format: 'Excel',
    size: '1.7 MB',
    status: 'completed',
  },
  {
    id: 4,
    name: 'Compliance Summary - Q1 2026',
    exportedBy: 'Kamal Hossain',
    date: '2026-03-25',
    format: 'PDF',
    size: '750 KB',
    status: 'completed',
  },
];
export function AuditExport() {
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [dateFrom, setDateFrom] = useState('2026-04-01');
  const [dateTo, setDateTo] = useState('2026-04-04');
  const [format, setFormat] = useState('pdf');
  const [includeDetails, setIncludeDetails] = useState(true);
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.audit.log}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Audit Log
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
              Export Audit Reports
            </h1>
            <p className="text-muted-foreground">
              Generate and download audit trail reports in PDF or Excel format
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Templates */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Report Templates"
              description="Select a report template to customize and export"
            />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {exportPresets.map((preset) => {
                  const Icon = preset.icon;
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setSelectedPreset(preset.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-secondary'}`}
                        >
                          <Icon
                            className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" size="sm">
                              {preset.format}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {preset.estimatedSize}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Recent Exports */}
          <Card>
            <CardHeader title="Recent Exports" description="Previously generated audit reports" />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-border">
                    <tr className="text-left">
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                        Report Name
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                        Exported By
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                        Format
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">Size</th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExports.map((exp) => (
                      <tr
                        key={exp.id}
                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{exp.name}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-sm text-muted-foreground">
                          {exp.exportedBy}
                        </td>
                        <td className="py-3 pr-3 text-sm text-muted-foreground">{exp.date}</td>
                        <td className="py-3 pr-3">
                          <Badge variant="outline" size="sm">
                            {exp.format}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3 text-sm text-muted-foreground">{exp.size}</td>
                        <td className="py-3 text-center">
                          <button className="p-1.5 hover:bg-muted rounded transition-colors">
                            <Download className="w-4 h-4 text-primary" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Export Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Export Configuration"
              description="Customize your report parameters"
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">From</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">To</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Output Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="excel">Excel Spreadsheet (.xlsx)</option>
                    <option value="csv">CSV File</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Severity Filter
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option value="all">All Events</option>
                    <option value="critical">Critical Only</option>
                    <option value="warning">Warnings & Critical</option>
                    <option value="success">Success Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">
                    Office / Location
                  </label>
                  <select className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option value="all">All Offices</option>
                    <option value="dhaka">Dhaka Head Office</option>
                    <option value="coxs-bazar">Cox's Bazar Office</option>
                    <option value="ukhiya">Ukhiya Warehouse</option>
                    <option value="teknaf-1">Teknaf Warehouse-1</option>
                    <option value="teknaf-2">Teknaf Warehouse-2</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include-details"
                    checked={includeDetails}
                    onChange={(e) => setIncludeDetails(e.target.checked)}
                    className="rounded border-input"
                  />
                  <label htmlFor="include-details" className="text-sm text-foreground">
                    Include detailed change logs
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="include-user-info"
                    defaultChecked
                    className="rounded border-input"
                  />
                  <label htmlFor="include-user-info" className="text-sm text-foreground">
                    Include user & IP information
                  </label>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <Button variant="primary" className="w-full" disabled={!selectedPreset}>
                    <Download className="w-4 h-4 mr-2" />
                    Generate & Download
                  </Button>
                  <Button variant="outline" className="w-full" disabled={!selectedPreset}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Preview
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Scheduled Reports" />
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-foreground">Monthly Full Audit</p>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Every 1st of month • PDF • Auto-email to compliance@aab.org
                  </p>
                </div>
                <div className="p-3 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-foreground">Weekly Security Report</p>
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Every Monday • PDF • Auto-email to admin@aab.org
                  </p>
                </div>
                <div className="p-3 bg-secondary/50 border border-border rounded-lg">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium text-foreground">Quarterly Compliance</p>
                    <Badge variant="default" size="sm">
                      Paused
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Every quarter • PDF + Excel • Auto-email to director@aab.org
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
