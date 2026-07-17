'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Edit,
  User,
  MapPin,
  Barcode,
  Package,
  Printer,
  Calendar,
  Download,
  FileText,
  ArrowLeft,
  Link as LinkIcon,
} from 'lucide-react';

import { paths } from 'src/routes/paths';

import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
const formatBDT = (amount) => {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount.toLocaleString('en-IN')}`;
};
const mockItemData = {
  id: 'INV-AAB-2026-0012',
  name: 'HP ProBook 450 G10 Laptop',
  category: 'IT Equipment',
  type: 'asset',
  assetTag: 'AAB-FA-IT-001',
  quantity: 15,
  unitPrice: 90000,
  totalValue: 1350000,
  location: 'Dhaka HQ Store',
  custodian: 'Md. Rafiqul Islam',
  custodianDesignation: 'IT Manager',
  custodianEmail: 'rafiqul.islam@actionaid.org',
  dateReceived: '2026-03-28',
  status: 'in-stock',
  grnNumber: 'GRN-AAB-2026-003',
  woNumber: 'WO-AAB-2026-002',
  poNumber: 'PO-AAB-2026-002',
  vendor: 'TechBD Solutions Ltd',
  vendorTIN: '123456789012',
  vendorBIN: '001234567-0401',
  description: 'High-performance laptop for programme staff — Intel Core i7, dedicated graphics',
  specifications:
    'Intel Core i7-1355U, 16GB DDR5 RAM, 512GB NVMe SSD, 15.6" FHD IPS, Windows 11 Pro',
  warrantyPeriod: '3 years',
  warrantyExpiry: '2029-03-28',
  attachments: [
    { name: 'Purchase Invoice (TechBD).pdf', size: '245 KB' },
    { name: 'Warranty Certificate.pdf', size: '180 KB' },
    { name: 'Technical Specifications.pdf', size: '520 KB' },
    { name: 'GRN-AAB-2026-003.pdf', size: '310 KB' },
  ],
};
export function InventoryItemDetail() {
  const id = 'INV-AAB-2026-0012'; // mock id
  const router = useRouter();
  const item = mockItemData;
  const handleViewSpecializedDetail = () => {
    if (item.type === 'asset') {
      router.push(paths.dashboard.procurement.inventory.assetDetail(id));
    } else {
      router.push(paths.dashboard.procurement.inventory.consumableDetail(id));
    }
  };
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <button
            type="button"
            onClick={() => router.push(paths.dashboard.procurement.inventory.items)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground mb-1">{item.name}</h1>
            <p className="text-muted-foreground">
              {item.id} {item.assetTag && `\u2022 Tag: ${item.assetTag}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleViewSpecializedDetail}>
              {item.type === 'asset' ? 'Asset Details' : 'Stock Details'}
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={item.type === 'asset' ? 'default' : 'success'}>
            {item.type === 'asset' ? 'Fixed Asset (Permanent)' : 'Consumable'}
          </Badge>
          <Badge variant="success">{item.status.replace('-', ' ')}</Badge>
          {item.assetTag && <Badge variant="outline">Tag: {item.assetTag}</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Indicator */}
          <Card
            className={`${item.type === 'asset' ? 'border-l-4 border-l-blue-500 bg-blue-500/5' : 'border-l-4 border-l-green-500 bg-green-500/5'}`}
          >
            <CardBody>
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center ${item.type === 'asset' ? 'bg-blue-500/10' : 'bg-green-500/10'}`}
                >
                  {item.type === 'asset' ? (
                    <Box className="w-8 h-8 text-blue-500" />
                  ) : (
                    <Package className="w-8 h-8 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.category} &bull; {item.location}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleViewSpecializedDetail}>
                  View {item.type === 'asset' ? 'Asset' : 'Stock'} Details
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader title="Basic Information" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Barcode className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Inventory ID</p>
                    <p className="font-medium text-foreground">{item.id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <p className="font-medium text-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                    <p className="font-medium text-foreground">{item.quantity} units</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date Received</p>
                    <p className="font-medium text-foreground">{item.dateReceived}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium text-foreground">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Custodian</p>
                    <p className="font-medium text-foreground">{item.custodian}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.custodianDesignation} &bull; {item.custodianEmail}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-2">Description</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-foreground mb-2">Specifications</p>
                <p className="text-sm text-muted-foreground">{item.specifications}</p>
              </div>
            </CardBody>
          </Card>

          {/* Valuation */}
          <Card>
            <CardHeader title="Valuation (BDT)" />
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unit Price</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatBDT(item.unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Quantity</p>
                  <p className="text-xl font-semibold text-foreground">{item.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-xl font-semibold text-primary">{formatBDT(item.totalValue)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Procurement Linkage */}
          <Card>
            <CardHeader title="Procurement Linkage" />
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">GRN Number</p>
                      <p className="text-xs text-muted-foreground">Goods Received Note</p>
                    </div>
                  </div>
                  <Link href={paths.dashboard.procurement.grn.detail(item.grnNumber)}>
                    <Button variant="outline" size="sm">
                      {item.grnNumber}
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Work Order / PO</p>
                      <p className="text-xs text-muted-foreground">Purchase authorization</p>
                    </div>
                  </div>
                  <Link href={paths.dashboard.procurement.workOrders.detail(item.woNumber)}>
                    <Button variant="outline" size="sm">
                      {item.woNumber}
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <LinkIcon className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Vendor</p>
                      <p className="text-xs text-muted-foreground">
                        TIN: {item.vendorTIN} &bull; BIN: {item.vendorBIN}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.vendor}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Attachments */}
          {item.attachments?.length > 0 && (
            <Card>
              <CardHeader title="Attachments" />
              <CardBody>
                <div className="space-y-2">
                  {item.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.size}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Quick Summary" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                  <Badge variant="success">{item.status.replace('-', ' ')}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Item Type</p>
                  <Badge variant={item.type === 'asset' ? 'default' : 'success'}>
                    {item.type === 'asset' ? 'Fixed Asset (Permanent)' : 'Consumable'}
                  </Badge>
                </div>
                {item.assetTag && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Asset Tag</p>
                    <p className="text-sm font-mono font-semibold text-primary">{item.assetTag}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                  <p className="text-xl font-semibold text-primary">{formatBDT(item.totalValue)}</p>
                </div>
                {item.warrantyPeriod && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Warranty</p>
                    <p className="text-sm font-medium text-foreground">{item.warrantyPeriod}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {item.warrantyExpiry}
                    </p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleViewSpecializedDetail}
                >
                  {item.type === 'asset' ? (
                    <>
                      <Box className="w-3.5 h-3.5 mr-1.5" />
                      View Asset Details
                    </>
                  ) : (
                    <>
                      <Package className="w-3.5 h-3.5 mr-1.5" />
                      View Stock Details
                    </>
                  )}
                </Button>
                <Link href={paths.dashboard.procurement.inventory.issue}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Issue / Transfer
                  </Button>
                </Link>
                <Link href={paths.dashboard.procurement.inventory.movement}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    View Movement History
                  </Button>
                </Link>
                <Link href={paths.dashboard.procurement.inventory.materialRequisition}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    Raise Requisition
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download Report
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
