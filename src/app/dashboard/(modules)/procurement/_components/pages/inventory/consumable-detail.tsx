'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Download,
  Plus,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui';

const formatBDT = (amount: number) => {
  if (amount >= 10000000) return `\u09F3${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `\u09F3${(amount / 100000).toFixed(2)} Lakh`;
  return `\u09F3${amount.toLocaleString('en-IN')}`;
};

const mockConsumableData = {
  id: 'INV-AAB-2026-0090',
  name: 'Emergency Tarpaulin (12ft x 18ft)',
  category: 'Relief Supplies',
  type: 'consumable',
  currentStock: 45,
  minStock: 200,
  maxStock: 1000,
  reorderPoint: 250,
  unitPrice: 1200,
  totalValue: 54000,
  location: 'Ukhiya Central Warehouse',
  grnNumber: 'GRN-AAB-2026-008',
  monthlyUsage: { issued: 155, received: 200, trend: 22 },
  recentTransactions: [
    {
      date: '2026-03-27',
      type: 'Stock In',
      quantity: 200,
      reference: 'GRN-AAB-2026-008',
      balance: 245,
    },
    {
      date: '2026-03-26',
      type: 'Issue',
      quantity: 80,
      reference: 'ISS-AAB-2026-045',
      issuedTo: 'Camp 4 (Kutupalong)',
      balance: -200,
    },
    {
      date: '2026-03-24',
      type: 'Issue',
      quantity: 50,
      reference: 'ISS-AAB-2026-043',
      issuedTo: 'Camp 18 (Balukhali)',
      balance: -120,
    },
    {
      date: '2026-03-22',
      type: 'Issue',
      quantity: 25,
      reference: 'ISS-AAB-2026-041',
      issuedTo: 'Teknaf Host Community',
      balance: -70,
    },
    {
      date: '2026-03-20',
      type: 'Transfer',
      quantity: 30,
      reference: 'TRF-AAB-2026-012',
      issuedTo: 'Teknaf Warehouse-1',
      balance: -45,
    },
  ],
  topIssuedTo: [
    { department: 'Camp 4 (Kutupalong)', quantity: 120, percentage: 38 },
    { department: 'Camp 18 (Balukhali)', quantity: 85, percentage: 27 },
    { department: 'Teknaf Host Community', quantity: 55, percentage: 18 },
    { department: 'Camp 20 (Jadimura)', quantity: 35, percentage: 11 },
    { department: 'Other Locations', quantity: 20, percentage: 6 },
  ],
};

export function ConsumableStockDetail() {
  const { id } = useParams();
  const router = useRouter();
  const item = mockConsumableData;
  const stockPercentage = (item.currentStock / item.maxStock) * 100;
  const isLowStock = item.currentStock <= item.reorderPoint;

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push('/dashboard/procurement/inventory/items')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground mb-1">{item.name}</h1>
            <p className="text-muted-foreground">Consumable Stock Detail &bull; {item.id}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/procurement/inventory/issue">
              <Button variant="primary">
                <Package className="w-4 h-4 mr-2" />
                Issue Stock
              </Button>
            </Link>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="bg-green-500">
            Consumable
          </Badge>
          {isLowStock && (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Low Stock Alert
            </Badge>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {isLowStock && (
        <Card className="mb-6 border-warning bg-warning/5">
          <CardBody>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Low Stock Alert — Reorder Immediately
                </p>
                <p className="text-sm text-muted-foreground">
                  Current stock ({item.currentStock}) is critically below reorder point (
                  {item.reorderPoint}). Raise a Material Requisition or Purchase Requisition to
                  replenish.
                </p>
              </div>
              <Link href="/dashboard/procurement/inventory/material-requisition">
                <Button variant="warning" size="sm">
                  Raise Requisition
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Stock Summary */}
          <div className="grid grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-green-500">
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                <p className="text-3xl font-bold text-green-500">{item.currentStock}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Min Stock</p>
                <p className="text-2xl font-bold text-foreground">{item.minStock}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Reorder Point</p>
                <p className="text-2xl font-bold text-warning">{item.reorderPoint}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <p className="text-sm text-muted-foreground mb-1">Max Stock</p>
                <p className="text-2xl font-bold text-foreground">{item.maxStock}</p>
                <p className="text-xs text-muted-foreground mt-1">units</p>
              </CardBody>
            </Card>
          </div>

          {/* Stock Level Visualization */}
          <Card>
            <CardHeader
              title="Stock Level"
              description="Current stock status — reorder notification active"
            />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Stock Level</span>
                    <span className="text-sm font-semibold text-foreground">
                      {stockPercentage.toFixed(0)}% of max capacity
                    </span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.currentStock <= item.minStock ? 'bg-error' : item.currentStock <= item.reorderPoint ? 'bg-warning' : 'bg-success'}`}
                      style={{ width: `${stockPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>0</span>
                    <span>Min: {item.minStock}</span>
                    <span>Reorder: {item.reorderPoint}</span>
                    <span>Max: {item.maxStock}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Available</p>
                    <p className="text-xl font-bold text-success">{item.currentStock}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Buffer Stock</p>
                    <p className="text-xl font-bold text-foreground">
                      {Math.max(0, item.currentStock - item.minStock)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">To Max Capacity</p>
                    <p className="text-xl font-bold text-foreground">
                      {item.maxStock - item.currentStock}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader
              title="Recent Stock Movements"
              description="Latest transactions for this item"
            />
            <CardBody>
              <div className="space-y-2">
                {item.recentTransactions.map((txn, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${txn.type === 'Stock In' ? 'bg-success/10' : txn.type === 'Transfer' ? 'bg-primary/10' : 'bg-warning/10'}`}
                      >
                        {txn.type === 'Stock In' ? (
                          <Plus className="w-5 h-5 text-success" />
                        ) : (
                          <Package className="w-5 h-5 text-warning" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-foreground">{txn.type}</p>
                          <Badge
                            variant={txn.type === 'Stock In' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {txn.type === 'Stock In' ? '+' : '-'}
                            {txn.quantity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{txn.date}</span>
                          <span>&bull;</span>
                          <span>Ref: {txn.reference}</span>
                          {txn.issuedTo && (
                            <>
                              <span>&bull;</span>
                              <span>To: {txn.issuedTo}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href={`/inventory/movement?item=${item.id}`}>
                <Button variant="outline" className="w-full mt-4">
                  View Full Movement History
                </Button>
              </Link>
            </CardBody>
          </Card>

          {/* Top Issued To */}
          <Card>
            <CardHeader
              title="Top Issued To (This Month)"
              description="Camps and locations consuming this item"
            />
            <CardBody>
              <div className="space-y-3">
                {item.topIssuedTo.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{dept.department}</p>
                      <span className="text-sm font-semibold text-foreground">
                        {dept.quantity} units ({dept.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${dept.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-green-500 bg-green-500/5">
            <CardHeader title="This Month" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Issued</p>
                  <p className="text-2xl font-bold text-warning">{item.monthlyUsage.issued}</p>
                  <p className="text-xs text-muted-foreground mt-1">units</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Received</p>
                  <p className="text-2xl font-bold text-success">{item.monthlyUsage.received}</p>
                  <p className="text-xs text-muted-foreground mt-1">units</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    {item.monthlyUsage.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-error" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-success" />
                    )}
                    <span
                      className={`text-sm font-medium ${item.monthlyUsage.trend > 0 ? 'text-error' : 'text-success'}`}
                    >
                      {Math.abs(item.monthlyUsage.trend)}% usage vs last month
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Valuation (BDT)" />
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatBDT(item.unitPrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Stock Value</p>
                  <p className="text-2xl font-semibold text-primary">
                    {formatBDT(item.totalValue)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Actions" />
            <CardBody>
              <div className="space-y-2">
                <Link href="/inventory/issue">
                  <Button variant="primary" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    Issue Stock
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  Adjust Stock Level
                </Button>
                <Link href="/inventory/material-requisition">
                  <Button variant="outline" className="w-full justify-start">
                    Raise Requisition
                  </Button>
                </Link>
                <Link href={`/inventory/movement?item=${item.id}`}>
                  <Button variant="outline" className="w-full justify-start">
                    View All Movements
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
