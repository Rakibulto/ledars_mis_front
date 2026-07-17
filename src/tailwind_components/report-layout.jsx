import { Download, FileSpreadsheet } from 'lucide-react';

import { Button } from './ui/button';
import { Card, CardBody, CardHeader } from './ui/card';

export function ReportLayout({ title, description, filters, kpiCards, charts, table }) {
  const handleExportPDF = () => {
    alert('Exporting to PDF...');
  };
  const handleExportExcel = () => {
    alert('Exporting to Excel...');
  };
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="primary" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader title="Filters" description="Refine your report data" />
        <CardBody>{filters}</CardBody>
      </Card>

      {/* KPI Cards */}
      <div className="mb-6">{kpiCards}</div>

      {/* Charts */}
      {charts && <div className="mb-6">{charts}</div>}

      {/* Table */}
      <div>{table}</div>
    </div>
  );
}
