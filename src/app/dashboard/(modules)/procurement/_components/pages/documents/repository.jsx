'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Eye,
  Tag,
  File,
  Grid,
  List,
  Image,
  Search,
  Upload,
  Download,
  FileText,
  FolderOpen,
  FileSpreadsheet,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { StatCard } from '../../components/stat-card';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const mockDocuments = [
  {
    id: 'DOC-2026-0001',
    name: 'Work Order - BuildPro Construction.pdf',
    type: 'Work Order',
    category: 'Contracts',
    format: 'PDF',
    size: '1.2 MB',
    uploadedBy: 'Md. Rafiqul Islam',
    uploadDate: '2026-04-03',
    module: 'Work Orders',
    linkedTo: 'WO-2026-0045',
    vendor: 'BuildPro Construction Co',
    office: 'Dhaka Head Office',
    version: 2,
    status: 'active',
    tags: ['construction', 'Q2-2026'],
  },
  {
    id: 'DOC-2026-0002',
    name: 'Comparative Statement - IT Equipment.xlsx',
    type: 'Comparative Statement',
    category: 'Procurement',
    format: 'Excel',
    size: '450 KB',
    uploadedBy: 'Aminul Haque',
    uploadDate: '2026-04-02',
    module: 'Comparative Statements',
    linkedTo: 'CS-2026-0023',
    vendor: null,
    office: 'Dhaka Head Office',
    version: 1,
    status: 'active',
    tags: ['IT', 'equipment'],
  },
  {
    id: 'DOC-2026-0003',
    name: 'TechSupply Global - Trade License.pdf',
    type: 'Trade License',
    category: 'Vendor Documents',
    format: 'PDF',
    size: '890 KB',
    uploadedBy: 'TechSupply Global Inc',
    uploadDate: '2026-03-15',
    module: 'Vendors',
    linkedTo: 'VEN-2024-002',
    vendor: 'TechSupply Global Inc',
    office: 'External',
    version: 1,
    status: 'active',
    tags: ['license', 'compliance'],
  },
  {
    id: 'DOC-2026-0004',
    name: 'GRN Verification - Medical Supplies.pdf',
    type: 'GRN Document',
    category: 'Goods Receipt',
    format: 'PDF',
    size: '2.1 MB',
    uploadedBy: 'Shahidul Alam',
    uploadDate: '2026-04-01',
    module: 'GRN',
    linkedTo: 'GRN-2026-0065',
    vendor: 'MediCare Equipment Supplies',
    office: 'Ukhiya Warehouse',
    version: 1,
    status: 'active',
    tags: ['medical', 'warehouse'],
  },
  {
    id: 'DOC-2026-0005',
    name: 'Payment Voucher - March Batch.pdf',
    type: 'Payment Voucher',
    category: 'Financial',
    format: 'PDF',
    size: '340 KB',
    uploadedBy: 'Nasreen Akter',
    uploadDate: '2026-03-31',
    module: 'Treasury',
    linkedTo: 'PAY-2026-BATCH-03',
    vendor: null,
    office: 'Dhaka Head Office',
    version: 1,
    status: 'active',
    tags: ['payment', 'monthly'],
  },
  {
    id: 'DOC-2026-0006',
    name: 'Premium Office - VAT Certificate.jpg',
    type: 'VAT Certificate',
    category: 'Vendor Documents',
    format: 'Image',
    size: '1.5 MB',
    uploadedBy: 'Premium Office Solutions Ltd',
    uploadDate: '2026-02-20',
    module: 'Vendors',
    linkedTo: 'VEN-2024-001',
    vendor: 'Premium Office Solutions Ltd',
    office: 'External',
    version: 3,
    status: 'active',
    tags: ['VAT', 'compliance', 'certificate'],
  },
  {
    id: 'DOC-2026-0007',
    name: 'RFQ-2026-0034 - Specifications.pdf',
    type: 'RFQ Specification',
    category: 'Procurement',
    format: 'PDF',
    size: '3.2 MB',
    uploadedBy: 'Md. Rafiqul Islam',
    uploadDate: '2026-04-03',
    module: 'RFQ',
    linkedTo: 'RFQ-2026-0034',
    vendor: null,
    office: 'Dhaka Head Office',
    version: 1,
    status: 'active',
    tags: ['RFQ', 'specs'],
  },
  {
    id: 'DOC-2026-0008',
    name: 'Budget Plan FY 2025-2026.xlsx',
    type: 'Budget Plan',
    category: 'Financial',
    format: 'Excel',
    size: '780 KB',
    uploadedBy: 'Taslima Rahman',
    uploadDate: '2025-07-01',
    module: 'Budget',
    linkedTo: 'BDG-FY-2025-2026',
    vendor: null,
    office: "Cox's Bazar Office",
    version: 4,
    status: 'active',
    tags: ['budget', 'annual', 'FY2025-26'],
  },
  {
    id: 'DOC-2026-0009',
    name: 'Vendor Award Letter - MediCare.pdf',
    type: 'Award Letter',
    category: 'Contracts',
    format: 'PDF',
    size: '220 KB',
    uploadedBy: 'Aminul Haque',
    uploadDate: '2026-03-28',
    module: 'Awards',
    linkedTo: 'AWD-2026-0018',
    vendor: 'MediCare Equipment Supplies',
    office: 'Dhaka Head Office',
    version: 1,
    status: 'active',
    tags: ['award', 'medical'],
  },
  {
    id: 'DOC-2026-0010',
    name: 'Monthly Inventory Report - March.pdf',
    type: 'Inventory Report',
    category: 'Inventory',
    format: 'PDF',
    size: '1.8 MB',
    uploadedBy: 'Shahidul Alam',
    uploadDate: '2026-04-01',
    module: 'Inventory',
    linkedTo: 'INV-RPT-2026-03',
    vendor: null,
    office: 'Ukhiya Warehouse',
    version: 1,
    status: 'active',
    tags: ['inventory', 'monthly', 'report'],
  },
];
const getFormatIcon = (format) => {
  switch (format) {
    case 'PDF':
      return <FileText className="w-5 h-5 text-red-500" />;
    case 'Excel':
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    case 'Image':
      return <Image className="w-5 h-5 text-blue-500" />;
    default:
      return <File className="w-5 h-5 text-muted-foreground" />;
  }
};
const getCategoryBadge = (category) => {
  switch (category) {
    case 'Contracts':
      return (
        <Badge variant="primary" size="sm">
          {category}
        </Badge>
      );
    case 'Procurement':
      return (
        <Badge variant="info" size="sm">
          {category}
        </Badge>
      );
    case 'Vendor Documents':
      return (
        <Badge variant="warning" size="sm">
          {category}
        </Badge>
      );
    case 'Goods Receipt':
      return (
        <Badge variant="success" size="sm">
          {category}
        </Badge>
      );
    case 'Financial':
      return (
        <Badge variant="danger" size="sm">
          {category}
        </Badge>
      );
    case 'Inventory':
      return (
        <Badge variant="default" size="sm">
          {category}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" size="sm">
          {category}
        </Badge>
      );
  }
};
export function DocumentRepository() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const categories = [...new Set(mockDocuments.map((d) => d.category))];
  const modules = [...new Set(mockDocuments.map((d) => d.module))];
  const filteredDocs = mockDocuments.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.linkedTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesFormat = formatFilter === 'all' || doc.format === formatFilter;
    const matchesModule = moduleFilter === 'all' || doc.module === moduleFilter;
    return matchesSearch && matchesCategory && matchesFormat && matchesModule;
  });
  const totalDocs = mockDocuments.length;
  const totalSize = '14.5 MB';
  const categoriesCount = categories.length;
  const recentUploads = mockDocuments.filter((d) => d.uploadDate >= '2026-04-01').length;
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
            Document Repository
          </h1>
          <p className="text-muted-foreground">
            Centralized secure storage for all procurement documents
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={paths.dashboard.procurement.documents.categories}>
            <Button variant="outline">
              <FolderOpen className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
          </Link>
          <Button variant="primary">
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Documents" value={totalDocs} icon={FileText} color="blue" />
        <StatCard title="Total Storage" value={totalSize} icon={FolderOpen} color="purple" />
        <StatCard title="Categories" value={categoriesCount} icon={Tag} color="green" />
        <StatCard title="Uploaded This Week" value={recentUploads} icon={Upload} color="orange" />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, type, tag, or linked record..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Formats</option>
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="Image">Image</option>
            </select>
            <div className="flex border border-input rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-secondary'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-secondary'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Documents */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader
            title={`Documents (${filteredDocs.length})`}
            description="All files across the procurement system"
          />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b-2 border-border">
                  <tr className="text-left">
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Document
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Category
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Linked To
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">
                      Uploaded By
                    </th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Date</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Size</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase">Ver.</th>
                    <th className="pb-3 text-xs font-semibold text-foreground uppercase text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          {getFormatIcon(doc.format)}
                          <div>
                            <p className="text-sm font-medium text-foreground">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type} • {doc.format}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">{getCategoryBadge(doc.category)}</td>
                      <td className="py-3 pr-3">
                        <span className="text-sm text-primary font-medium">{doc.linkedTo}</span>
                        {doc.vendor && (
                          <p className="text-xs text-muted-foreground">{doc.vendor}</p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                            {doc.uploadedBy
                              .split(' ')
                              .slice(0, 2)
                              .map((n) => n[0])
                              .join('')}
                          </div>
                          <span className="text-sm text-foreground">{doc.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground whitespace-nowrap">
                        {doc.uploadDate}
                      </td>
                      <td className="py-3 pr-3 text-sm text-muted-foreground">{doc.size}</td>
                      <td className="py-3 pr-3">
                        <Badge variant="outline" size="sm">
                          v{doc.version}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={paths.dashboard.procurement.documents.detail(doc.id)}>
                            <button className="p-1.5 hover:bg-muted rounded transition-colors">
                              <Eye className="w-4 h-4 text-primary" />
                            </button>
                          </Link>
                          <button className="p-1.5 hover:bg-muted rounded transition-colors">
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} hover>
              <CardBody>
                <div className="text-center mb-3">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-2">
                    {getFormatIcon(doc.format)}
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.size} • v{doc.version}
                  </p>
                </div>
                {getCategoryBadge(doc.category)}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{doc.uploadDate}</span>
                  <div className="flex gap-1">
                    <Link href={paths.dashboard.procurement.documents.detail(doc.id)}>
                      <button className="p-1 hover:bg-muted rounded">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                    <button className="p-1 hover:bg-muted rounded">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
