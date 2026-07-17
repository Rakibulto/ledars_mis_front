'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Eye, Tag, Upload, Shield, FileText, Download, ArrowLeft } from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockDocDetail = {
  id: 'DOC-2026-0001',
  name: 'Work Order - BuildPro Construction.pdf',
  type: 'Work Order',
  category: 'Contracts',
  format: 'PDF',
  size: '1.2 MB',
  uploadedBy: 'Md. Rafiqul Islam',
  uploadDate: '2026-04-03 14:30:22',
  module: 'Work Orders',
  linkedTo: 'WO-2026-0045',
  vendor: 'BuildPro Construction Co',
  office: 'Dhaka Head Office',
  version: 2,
  status: 'active',
  tags: ['construction', 'Q2-2026', 'approved'],
  description:
    'Signed work order for construction material supply to Ukhiya warehouse expansion project',
  accessLevel: 'Restricted',
  checksum: 'sha256:a3f8b2c1d4e5...',
  versions: [
    {
      version: 2,
      uploadedBy: 'Md. Rafiqul Islam',
      date: '2026-04-03 14:30:22',
      size: '1.2 MB',
      note: 'Updated with vendor signature',
    },
    {
      version: 1,
      uploadedBy: 'Md. Rafiqul Islam',
      date: '2026-04-01 10:15:00',
      size: '980 KB',
      note: 'Initial draft uploaded',
    },
  ],
  accessLog: [
    {
      user: 'Md. Rafiqul Islam',
      action: 'Upload',
      date: '2026-04-03 14:30:22',
      ip: '103.15.245.12',
    },
    { user: 'Fatema Begum', action: 'Viewed', date: '2026-04-03 16:00:10', ip: '103.15.245.15' },
    {
      user: 'Kamal Hossain',
      action: 'Downloaded',
      date: '2026-04-04 09:05:00',
      ip: '103.15.245.10',
    },
    { user: 'Aminul Haque', action: 'Viewed', date: '2026-04-04 09:30:15', ip: '103.15.245.18' },
  ],
  relatedDocuments: [
    {
      id: 'DOC-2026-0011',
      name: 'Material Requisition - MR-2026-0130.pdf',
      type: 'Material Requisition',
    },
    {
      id: 'DOC-2026-0012',
      name: 'Comparative Statement - CS-2026-0020.xlsx',
      type: 'Comparative Statement',
    },
    { id: 'DOC-2026-0013', name: 'Award Letter - AWD-2026-0015.pdf', type: 'Award Letter' },
  ],
  metadata: {
    pageCount: 4,
    language: 'English / Bangla',
    signedBy: 'Country Director, BuildPro Construction MD',
    contractValue: 'BDT 680,000',
    validUntil: '2026-09-30',
  },
};
export function DocumentDetail() {
  const { id } = useParams();
  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={paths.dashboard.procurement.documents.repository}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Repository
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-red-50 flex items-center justify-center">
              <FileText className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-semibold text-foreground mb-1">
                {mockDocDetail.name}
              </h1>
              <div className="flex items-center gap-3">
                <Badge variant="primary">{mockDocDetail.category}</Badge>
                <Badge variant="outline">v{mockDocDetail.version}</Badge>
                <Badge variant="success">{mockDocDetail.status}</Badge>
                <span className="text-sm text-muted-foreground">{mockDocDetail.size}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Version
            </Button>
            <Button variant="primary">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Document Preview Placeholder */}
          <Card>
            <CardHeader title="Document Preview" />
            <CardBody>
              <div className="w-full h-[400px] bg-secondary/50 border-2 border-dashed border-border rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">{mockDocDetail.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {mockDocDetail.metadata.pageCount} pages • {mockDocDetail.size}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Eye className="w-4 h-4 mr-2" />
                    Open Full Preview
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader title="Version History" description="All versions of this document" />
            <CardBody>
              <div className="space-y-3">
                {mockDocDetail.versions.map((ver, idx) => (
                  <div
                    key={ver.version}
                    className={`flex items-center justify-between p-3 rounded-lg border ${idx === 0 ? 'bg-primary/5 border-primary/20' : 'bg-secondary/50 border-border'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                      >
                        v{ver.version}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{ver.note}</p>
                        <p className="text-xs text-muted-foreground">
                          {ver.uploadedBy} • {ver.date} • {ver.size}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {idx === 0 && (
                        <Badge variant="primary" size="sm">
                          Current
                        </Badge>
                      )}
                      <button className="p-1.5 hover:bg-muted rounded transition-colors">
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Access Log */}
          <Card>
            <CardHeader title="Access Log" description="Who accessed this document" />
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 border-border">
                    <tr className="text-left">
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">User</th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                        Action
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                        Date & Time
                      </th>
                      <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDocDetail.accessLog.map((entry, idx) => (
                      <tr key={idx} className="border-b border-border">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {entry.user
                                .split(' ')
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join('')}
                            </div>
                            <span className="text-sm text-foreground">{entry.user}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <Badge
                            variant={
                              entry.action === 'Upload'
                                ? 'success'
                                : entry.action === 'Downloaded'
                                  ? 'info'
                                  : 'outline'
                            }
                            size="sm"
                          >
                            {entry.action}
                          </Badge>
                        </td>
                        <td className="py-3 pr-3 text-sm text-muted-foreground">{entry.date}</td>
                        <td className="py-3 pr-3">
                          <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                            {entry.ip}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Document Info */}
          <Card>
            <CardHeader title="Document Information" />
            <CardBody>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Document ID</p>
                  <p className="text-sm font-medium">{mockDocDetail.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className="text-sm font-medium">{mockDocDetail.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Category</p>
                  <Badge variant="primary" size="sm">
                    {mockDocDetail.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Module</p>
                  <Badge variant="outline" size="sm">
                    {mockDocDetail.module}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Linked Record</p>
                  <span className="text-sm text-primary font-medium">{mockDocDetail.linkedTo}</span>
                </div>
                {mockDocDetail.vendor && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                    <p className="text-sm font-medium">{mockDocDetail.vendor}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Office</p>
                  <p className="text-sm font-medium">{mockDocDetail.office}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Access Level</p>
                  <Badge variant="warning" size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    {mockDocDetail.accessLevel}
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader title="Metadata" />
            <CardBody>
              <div className="space-y-3">
                {Object.entries(mockDocDetail.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-xs text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xs font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader title="Tags" />
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {mockDocDetail.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Related Documents */}
          <Card>
            <CardHeader title="Related Documents" />
            <CardBody>
              <div className="space-y-2">
                {mockDocDetail.relatedDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={paths.dashboard.procurement.documents.detail(doc.id)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
