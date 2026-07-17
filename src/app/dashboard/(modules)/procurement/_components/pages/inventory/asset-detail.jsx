'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tag,
  Edit,
  QrCode,
  Printer,
  Calendar,
  Download,
  ArrowLeft,
  CheckCircle,
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
const mockAssetData = {
  id: 'INV-AAB-2026-0012',
  name: 'HP ProBook 450 G10 Laptop',
  category: 'IT Equipment',
  type: 'asset',
  totalQuantity: 15,
  available: 11,
  assigned: 4,
  unitPrice: 90000,
  totalValue: 1350000,
  location: 'Dhaka HQ Store',
  grnNumber: 'GRN-AAB-2026-003',
  woNumber: 'WO-AAB-2026-002',
  dateReceived: '2026-03-28',
  warrantyPeriod: '3 years',
  warrantyExpiry: '2029-03-28',
  depreciationRate: 20,
  currentValue: 1080000,
  individualAssets: [
    {
      assetTag: 'AAB-FA-IT-001-01',
      serialNumber: 'HP5CG4123456',
      status: 'assigned',
      assignedTo: 'Fatema Khatun',
      designation: 'Procurement Officer',
      assignedDate: '2026-03-29',
      location: 'Dhaka HQ',
      condition: 'excellent',
    },
    {
      assetTag: 'AAB-FA-IT-001-02',
      serialNumber: 'HP5CG4123457',
      status: 'assigned',
      assignedTo: 'Tasneem Jahan',
      designation: 'Communications Officer',
      assignedDate: '2026-03-29',
      location: 'Dhaka HQ',
      condition: 'excellent',
    },
    {
      assetTag: 'AAB-FA-IT-001-03',
      serialNumber: 'HP5CG4123458',
      status: 'assigned',
      assignedTo: 'Dr. Nafisa Akter',
      designation: 'Health Programme Manager',
      assignedDate: '2026-03-30',
      location: 'Ukhiya Field Office',
      condition: 'excellent',
    },
    {
      assetTag: 'AAB-FA-IT-001-04',
      serialNumber: 'HP5CG4123459',
      status: 'assigned',
      assignedTo: 'Md. Ashraful Hoque',
      designation: 'Admin Officer',
      assignedDate: '2026-03-30',
      location: 'Dhaka HQ',
      condition: 'excellent',
    },
    {
      assetTag: 'AAB-FA-IT-001-05',
      serialNumber: 'HP5CG4123460',
      status: 'available',
      assignedTo: null,
      designation: null,
      assignedDate: null,
      location: 'Dhaka HQ Store',
      condition: 'excellent',
    },
    {
      assetTag: 'AAB-FA-IT-001-06',
      serialNumber: 'HP5CG4123461',
      status: 'available',
      assignedTo: null,
      designation: null,
      assignedDate: null,
      location: 'Dhaka HQ Store',
      condition: 'excellent',
    },
    {
      assetTag: 'AAB-FA-IT-001-07',
      serialNumber: 'HP5CG4123462',
      status: 'available',
      assignedTo: null,
      designation: null,
      assignedDate: null,
      location: 'Ukhiya Central Warehouse',
      condition: 'good',
    },
  ],
  maintenanceSchedule: [
    {
      date: '2026-06-28',
      type: 'Quarterly IT Check',
      status: 'scheduled',
      assignedTo: 'Md. Rafiqul Islam',
    },
    {
      date: '2026-09-28',
      type: 'Quarterly IT Check',
      status: 'scheduled',
      assignedTo: 'Md. Rafiqul Islam',
    },
    {
      date: '2026-12-28',
      type: 'Annual Maintenance',
      status: 'scheduled',
      assignedTo: 'TechBD Solutions Ltd',
    },
  ],
};
const getConditionColor = (condition) => {
  switch (condition) {
    case 'excellent':
      return 'success';
    case 'good':
      return 'default';
    case 'fair':
      return 'warning';
    case 'poor':
      return 'error';
    default:
      return 'default';
  }
};
export function FixedAssetDetail() {
  const id = 'INV-AAB-2026-0012'; // mock id
  const router = useRouter();
  const asset = mockAssetData;
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
            <h1 className="text-2xl font-semibold text-foreground mb-1">{asset.name}</h1>
            <p className="text-muted-foreground">Fixed Asset (Permanent) &bull; {asset.id}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit Asset
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="w-3.5 h-3.5 mr-1.5" />
              Generate Tags
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="default" className="bg-blue-500">
            Fixed Asset (Permanent)
          </Badge>
          <Badge variant="success">
            <CheckCircle className="w-3 h-3 mr-1" />
            {asset.available} Available
          </Badge>
          <Badge variant="warning">{asset.assigned} Assigned</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Total Assets</p>
                <p className="text-xl font-bold text-blue-500">{asset.totalQuantity}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Available</p>
                <p className="text-xl font-bold text-success">{asset.available}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Assigned</p>
                <p className="text-xl font-bold text-warning">{asset.assigned}</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                <p className="text-xl font-bold text-primary">{formatBDT(asset.currentValue)}</p>
              </CardBody>
            </Card>
          </div>

          {/* Individual Asset Tracking with Unique Tags */}
          <Card>
            <CardHeader
              title="Individual Asset Tracking (Auto-Assigned Tags)"
              description="Each fixed asset has a unique AAB asset tag for tracking"
            />
            <CardBody>
              <div className="space-y-3">
                {asset.individualAssets.map((item) => (
                  <div
                    key={item.assetTag}
                    className="border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground mb-1 font-mono">
                            {item.assetTag}
                          </h4>
                          <p className="text-sm text-muted-foreground">SN: {item.serialNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.status === 'assigned' ? 'warning' : 'success'}>
                          {item.status}
                        </Badge>
                        <Badge variant={getConditionColor(item.condition)} size="sm">
                          {item.condition}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                      {item.status === 'assigned' ? (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                            <p className="text-sm font-medium text-foreground">{item.assignedTo}</p>
                            <p className="text-xs text-muted-foreground">{item.designation}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Assigned Date</p>
                            <p className="text-sm font-medium text-foreground">
                              {item.assignedDate}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <p className="text-sm text-success font-medium">
                            Available for assignment
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Location</p>
                        <p className="text-sm font-medium text-foreground">{item.location}</p>
                      </div>
                    </div>
                    {item.status === 'available' && (
                      <div className="mt-3 flex gap-2">
                        <Button variant="primary" size="sm">
                          Assign Asset
                        </Button>
                        <Button variant="outline" size="sm">
                          <QrCode className="w-3 h-3 mr-1" />
                          Print Tag
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader
              title="Maintenance Schedule"
              description="Planned maintenance for Ledars NGO assets"
            />
            <CardBody>
              <div className="space-y-3">
                {asset.maintenanceSchedule.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{schedule.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {schedule.date} &bull; {schedule.assignedTo}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">{schedule.status}</Badge>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-blue-500 bg-blue-500/5">
            <CardHeader title="Asset Information" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Purchase Value</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatBDT(asset.totalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Value (Depreciated)</p>
                  <p className="text-xl font-semibold text-primary">
                    {formatBDT(asset.currentValue)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {asset.depreciationRate}% annual depreciation (NBR Schedule)
                  </p>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Date Received</p>
                  <p className="text-sm font-medium text-foreground">{asset.dateReceived}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Warranty Period</p>
                  <p className="text-sm font-medium text-foreground">{asset.warrantyPeriod}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires: {asset.warrantyExpiry}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Work Order</p>
                  <Link
                    href={paths.dashboard.procurement.workOrders.detail(asset.woNumber)}
                    className="text-primary hover:underline font-medium text-sm"
                  >
                    {asset.woNumber}
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Asset Actions" />
            <CardBody>
              <div className="space-y-2">
                <Button variant="primary" size="sm" className="w-full justify-start">
                  Assign Asset
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Transfer Assets
                </Button>
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
                  Download Asset Report
                </Button>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Procurement" />
            <CardBody>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">GRN Number</p>
                  <Link
                    href={paths.dashboard.procurement.grn.detail(asset.grnNumber)}
                    className="text-primary hover:underline font-medium"
                  >
                    {asset.grnNumber}
                  </Link>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Vendor</p>
                  <p className="font-medium text-foreground">TechBD Solutions Ltd</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
